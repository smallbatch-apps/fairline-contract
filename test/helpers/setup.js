module.exports = {
    fullSetup: async function(flight, accounts){
        await this.regulator(flight, accounts);
        await this.seats(flight);
        await this.flightNumber(flight);
        //await flight.enableFlight(flight);
    },

    regulator: async function(flight, accounts){
        await flight.addRegulator(accounts[1]);
        return flight;
    },

    seats: async function(flight) {
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
    },

    flightNumber: async function(flight){
        await flight.setFlightNumber('JQ570');
        return flight;
    },

    setEnabled: async function(flight) {
        await flight.enableFlight();
        return flight;
    },
}
