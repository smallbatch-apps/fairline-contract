const networkToId = {
  mainnet: 1,
  ropsten: 3,
  rinkeby: 4,
  kovan: 42,
  sokol: 77,
  localhost: 5777,
  dev: 5777
};

const Web3 = require('web3');
const { allFromAST, interfaceFromAST, eventsFromAST } = require('./ASTFunctions');

const createDefaultProvider = () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    return window.ethereum; // metamask instance available
  }
  return new Web3.providers.WebsocketProvider("ws://127.0.0.1:8545");
}

const getNetworkIdFromProvider = provider => {
  if (provider.constructor.name === 'MetamaskInpageProvider') {
    return provider.networkVersion;
  }

  const hostUrl = provider.connection ? provider.connection.url : provider.host;
  let network = new URL(hostUrl).host.split('.')[0];

  if (network === '127') { network = 'localhost' }

  return networkToId[network];
}

class ContractWrapper {
  constructor(truffleArtefact, provider = false) {
    provider = !provider ? createDefaultProvider() : provider;

    this.truffleArtefact = truffleArtefact;
    this.web3 = new Web3(provider);

    this.web3Contract = this.loadWeb3ContractAtAddress(truffleArtefact.networks[getNetworkIdFromProvider(provider)].address);

    this.proxyContract = this.createContractProxy();

    this.astObject = truffleArtefact.astObject
      ? truffleArtefact.astObject
      : allFromAST(truffleArtefact.ast);
  }

  async newInstance(...args) {
    if (typeof this.truffleArtefact.new === 'undefined') {
      throw "You cannot deploy from build files, please use truffle";
    }

    args.forEach((arg, index) => {
      args[index] = this.inputType(arg, this.astObject.constructor.parameters[index].type);
    });
    const {address} = await this.truffleArtefact.new(...args);
    this.web3Contract = this.loadWeb3ContractAtAddress(address);
    this.proxyContract = this.createContractProxy();
  }

  contract() {
    return this.proxyContract;
  }

  loadWeb3ContractAtAddress(address) {
    return new this.web3.eth.Contract(this.truffleArtefact.abi, address);
  }

  loadDependencies(...deps) {
    deps.forEach(({ast}) => {
      this.astObject.interface = Object.assign(this.astObject.interface, interfaceFromAST(ast));
      this.astObject.events = Object.assign(this.astObject.events, eventsFromAST(ast));
    });
  }

  overrideInterface(overrideObject) {
    this.astObject.interface = Object.assign(this.astObject.interface, overrideObject);
  }

  assembleStructFromArrays(structure, dataArrays){
    return dataArrays[0].map((data, index) => {
      let newObject = {};
      structure.forEach((field, innerIndex) => {

        if(dataArrays[innerIndex]){
          let fieldRowValue = dataArrays[innerIndex][index];
          newObject[field.name] = this.returnType(fieldRowValue, field.type);
        }

      })
      return newObject;
    });
  }

  inputType(value, type){
    switch(type) {
      case 'bytes32': return this.web3.utils.utf8ToHex(value);
      default: return value;
    }
  }

  returnType(value, type){
    switch(type) {
      case 'bytes32': return this.web3.utils.hexToUtf8(value);
      case 'uint256': return Number(value);
      case 'uint': return Number(value);
      default: return value;
    }
  }

  mapValuesReturnObject(values, parameters) {
    return parameters.reduce((returnObject, { name, type }, index) => {
      returnObject[name] = this.returnType(values[index], type);
      return returnObject;
    }, {});
  }

  mapValuesReturnArray(values, parameters){
    if(values.length === (parameters.length * 2)) {
      values = values.slice(0, values.length / 2);
    }

    if(values.length !== parameters.length){
      throw "Incorrect number of values for contract return parameters.";
    }

    return parameters.map(({type}, index) => {
      return this.returnType(values[index], type);
    });
  }

  mapValuesInputArray(values, parameters){
    if(values.length !== parameters.length){
      throw "Incorrect number of values for contract input parameters.";
    }

    return parameters.map(({type}, index) => {
      return this.outType(values[index], type);
    });
  }

  createContractProxy() {
    let handler = {
      get: (target, name) => {
        if(name === 'address') {
          return target._address;
        }

        if(name === 'subscribeEvent') {
          return (...args) => {
            let eventToSubscribe = args[0];
            let listenerCallback = args[1];
            if (typeof listenerCallback === 'function') {
              target.events[eventToSubscribe]({}, listenerCallback);
            }
          }
        }

        if(target.methods.hasOwnProperty(name) &&
            typeof target.methods[name] === 'function'){
          return async (...args) => {
            const accounts = await this.web3.eth.getAccounts();

            if (accounts.length > 0 && !this.web3.currentProvider.defaultAccount) {
              this.web3.currentProvider.defaultAccount = accounts[0];
            }

            let parameterObject = {from: this.web3.currentProvider.defaultAccount};

            let result;
            if (typeof args[args.length-1] === 'object') {
              parameterObject = {...parameterObject, ...args.pop()};
            }

            args.forEach((arg, index) => {
              let { type } = this.astObject.interface[name].parameters[index];
              args[index] = this.inputType(arg, type);
            });

            const func = target.methods[name](...args);

            try {
              if(this.astObject.interface[name].stateMutability === 'view'){
                result = await func.call(parameterObject);
              } else {

                result = await func.send(parameterObject);

                if (typeof result.transactionHash !== 'undefined') {
                  this.lastTransaction = result;
                  return result;
                }
              }

            } catch(error) {
              throw error;
            }

            if (this.astObject.interface[name].returnParameters.length === 0) {
              return null;
            }

            if(typeof result === "integer" || typeof result === "string") {
              return await this.returnType(result, this.astObject.interface[name].returnParameters[0].type);
            }

            if(Object.keys(result).length === (this.astObject.interface[name].returnParameters.length * 2)) {

              return this.mapValuesReturnObject(
                removeDuplicateKeys(result),
                this.astObject.interface[name].returnParameters
              );
            }
            return this.mapValuesReturnArray(Object.values(result), this.astObject.interface[name].returnParameters);
          }
        }
        throw `"${name}" is not a valid method on this contract`;
      }
    }

    return new Proxy(this.web3Contract, handler);
  }
}

const removeDuplicateKeys = result => Object.entries(result)
  .filter(([k]) => !isNaN(k))
  .map(([,v]) => v);

const wrap = (contract, provider = false) => new ContractWrapper(contract, provider);

module.exports = { wrap }