export default class SetupHelper {

    constructor(flight, accounts){
        this.flight = flight;
        this.accounts = accounts;
    }

    async saleSetup(){
        await this.fullSetup();
        await this.setEnabled();
    }

    async noSeats(){
        await this.regulator();
        await this.flightId();
        await this.seatPrice();
    }

    async fullSetup(){
        await this.regulator();
        await this.seats();
        await this.flightId();
        await this.seatPrice();
    }

    async regulator(){
        await this.flight.addRegulator(this.accounts[1]);
    }

    async seats(flight) {
        const numberOfSeats = 8;
        await this.flight.setSeatCount(numberOfSeats);
        await this.flight.setRemainingSeats(numberOfSeats);
        const randoms = [
            'fc4f2908', 'fc4f2ba6', 'fc4f2cfa', 'fc4f3100',
            'fc4f327c', 'fc4f33a8', 'fc4f34c0', 'fc4f35e2'
        ];
        for(let i = 0; i < numberOfSeats; i++){
            await this.flight.loadSeat(randoms[i]);
        }
    }

    async flightId(){
        await this.flight.setFlightId('JQ570');
    }

    async seatPrice(){
        await this.flight.setSeatPrice(5);
    }

    async setEnabled() {
        await this.flight.enableFlight();
    }
}
