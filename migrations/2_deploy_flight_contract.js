var Flight = artifacts.require("./Flight.sol");

const toHex = web3.utils.utf8ToHex;

module.exports = async function(deployer){
    await deployer.deploy(Flight, toHex("DJ420"));
}