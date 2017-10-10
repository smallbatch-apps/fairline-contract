async function regulator(flight, accounts){
    await flight.addRegulator(accounts[1]);
    return flight;
}

async function seats(flight) {
    await flight.loadSeat('1A', 'Window exit');
    await flight.loadSeat('1B', 'Aisle exit');
    await flight.loadSeat('1C', 'Aisle exit');
    await flight.loadSeat('1D', 'Window exit');
    await flight.loadSeat('2A', 'Window exit');
    await flight.loadSeat('2B', 'Aisle exit');
    await flight.loadSeat('2C', 'Aisle exit');
    await flight.loadSeat('2D', 'Window exit');

    await flight.setSeatCount(8);
    
    return flight;
}

async function flightNumber(flight){
    await flight.setFlightNumber('JQ570');

    return flight;
}

async function setEnabled(flight) {
    await flight.enableFlight();
    return flight;
}

async function fullSetup(flight, accounts){
    await regulator(flight, accounts);
    await seats(flight);
    await flightNumber(flight);
    await enableFlight(flight);
}