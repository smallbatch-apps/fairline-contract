module.exports = class ContractWrapper {
  constructor(cont) {
    let abi = cont.abi;
    let address = cont.address;

    //console.log(Object.keys(cont));

    console.log(cont._properties);

    // this.web3Instance = web3.utils.Contract(abi, address);
    // this.structs = this.buildStructs(abi);
    // this.proxyInstance = new Proxy(this.web3Instance, this.traps())

  }

  traps() {
      return {
          get: (target, prop) => {

          }
      }
  }

  buildStructs(abi) {

  }



}