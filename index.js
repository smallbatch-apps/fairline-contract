
let Flight = require('./build/contracts/Flight');
let Ownable = require('./build/contracts/Ownable');
let Web3 = require('web3');
import 'babel-polyfill';

let contractWrapper = require('./test/helpers/ContractWrapper');

let web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));

let wrapper = contractWrapper.create(Flight, web3);
console.log(wrapper);
wrapper.loadDependencies(Ownable);
console.log(wrapper);

let flightContract = wrapper.contract();

console.log(flightContract);

//console.log(flightContract.address);

//flightContract = wrapper.newInstance();
let myResponse = new flightContract();
console.log(myResponse);

// let wrapper = contractWrapper.create(Flight, web3);