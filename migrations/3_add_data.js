const Flight = artifacts.require("Flight.sol");
const SetupHelper = require('../test/helpers/SetupHelper');


const toHex = web3.utils.utf8ToHex;

module.exports = async function(deployer, environment, accounts){
  const flightInstance = await Flight.deployed();
  //console.log(flightInstance.address);
  const setup = new SetupHelper(flightInstance, accounts);

  await setup.saleSetup();
  // const numberOfSeats = 8;
  // await flightInstance.setSeatCount(numberOfSeats);
  // await flightInstance.setRemainingSeats(numberOfSeats);

  // [
  //   'fc4f2908', 'fc4f2ba6', 'fc4f2cfa', 'fc4f3100',
  //   'fc4f327c', 'fc4f33a8', 'fc4f34c0', 'fc4f35e2'
  // ].forEach(
  //   async seatNumber => {
  //     let seatNumberCreated = await flightInstance.loadSeat(toHex(seatNumber));
  //     console.log(seatNumberCreated);
  //   }
  // );

  // await this.flight.setSeatPrice(5);
}