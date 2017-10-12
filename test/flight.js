const assertError = require('./helpers/AssertError');
var Flight = artifacts.require("./Flight.sol");

var setup = require('./helpers/setup');

contract('Flight', function(accounts) {
    
    var flight;
    var administrator = accounts[0];
    var regulator = accounts[1];
    var customer = accounts[2];

    const STATUS_PRESALE = 0;
    const STATUS_SALE = 1;
    const STATUS_LANDED = 2;
    const STATUS_CLOSED = 3;

    const FLIGHT_NUMBER = 'JQ570';
    
    beforeEach(async function() {
        flight = await Flight.deployed();
    });

    /**
     * ADMIN
     * 
     * This section is primarily setup and workflow requirements.
     */

    it('should allow an admin to set the number of seats', async function(){
        let newSeatCount = 200;
        await flight.changeSeatCount(newSeatCount);
        let seatCount = await flight.seatCount();
        assert.equal(newSeatCount, seatCount, 'Seat count is not being correcly set');
    });

    it('should not have a regulator', async function(){
        let defaultRegulator = await flight.regulator();
        let theOwner = await flight.owner();
        assert.equal(0, defaultRegulator, 'Regulator must not be set by default');
    });

    it('should allow a regulator to be added', async function(){
        await flight.addRegulator(regulator);
        let newRegulator = await flight.regulator();
        assert.equal(regulator, newRegulator, 'Regulator must be settable by admin');
    });

    it('should allow a seat to load', async function() {
        let seatNumber = '1A';
        let seatDescription = 'Window Seat - Exit Row'
        let seatIndex = await flight.loadSeat(seatNumber, seatDescription);
        let seat = await flight.seats(0);

        assert.equal(seat[0], seatNumber, 'Seat number does not match');
        assert.equal(seat[1], seatDescription, 'Seat description does not match');
    });

    it('should have an owner', async function(){
        let contractOwner = await flight.owner();
        assert.equal(contractOwner, administrator, 'Owner is not correctly set');
    });

    it('should allow an admin to set the price', async function(){
        let newPrice = 6;
        await flight.changeSeatPrice(newPrice);
        let seatPrice = await flight.seatPrice();
    
        assert.equal(seatPrice, newPrice, 'Seat price is not being correcly set');
    });

    xit('should not allow a flight to be enabled without a regulator', async function(){
        try {
            let enabled = await flight.enableFlight();
            assert.fail('VM Exception while processing transaction: invalid opcode');
        } catch(error) {
            assertError(error);
        }
    });

    it('should not allow a non-owner to set a regulator', async function(){
        try {
            let enabled = await flight.addRegulator(regulator, {from: accounts[3]});
            assert.fail('VM Exception while processing transaction: invalid opcode');
        } catch(error) {
            assertError(error);
        }
    });

    it('should not allow a flight with no seats to be enabled', async function(){
        try {
            await flight.enableFlight();
            assert.fail('VM Exception while processing transaction: invalid opcode');
        } catch(error) {
            assertError(error);
        }
    });
    
    xit('should allow a flight to be enabled', async function(){
        
        await setup.regulator(flight, accounts);
        await setup.flightNumber(flight);
        await setup.seats(flight);
        await flight.enableFlight();

        let status = await flight.status();
        
        assert.equal(status, STATUS_SALE, 'Flight should be available for sale');
    });

    xit('should have the same number of seats as the declared seat count', async function(){
        await setup.fullSetup(flight, accounts);
        await flight.setSeatCount(5);
        
        try {
            await flight.enableFlight();
            assert.fail('should have thrown before');
        } catch(error) {
            assertError(error);
        }
    });

    xit('should not allow a flight to be closed prior to landing', async function(){
        try {
            await flight.enableFlight();
            assert.fail('should have thrown before');
        } catch(error) {
            assertError(error);
        }
    });

    xit('should send balance of money to owner when closed', async function(){
        let initialBalance = await owner.balance();
        let seatPrice = 1234;

        setup.fullSetup();
        let tx = await flight.transfer(seatPrice, {from: customer});
        await flight.landedFlight();
        await flight.closeFlight();
        let finalBalance = await owner.balance();

        assertEqual(initalBalance + seatPrice, finalBalance, "Contract balance incompletely forwarded to owner");
    });

    /**
     * BOOKINGS
     * 
     * Note that owner in this context refers to the ticket owner, 
     * not the contract owner. SHOULD and MUST have no specific distinctions
     * and all functionality is a requirement.
     */

    xit('should allow the purchase of a ticket', async function(){

    });

    it('must be the correct amount paid');

    it('must purchase one or more seat');

    it('must purchase an "empty" seat if one is available and a single seat is purchased');

    it('must remove the empty seat after purchase');

    it('must not allow the purchase of more than one ticket from an address');

    it('must decline purchase of tickets if there are insufficient seats');

    it('must create a SeatLocation on the ticket for the owner');

    it('must add the owner into the ticketOwners array');

    it('must allow the owner to retrieve their ticket');

    it('must allow the owner to cancel their ticket');

    it('must allow the owner to assign accounts to their seats');

    it('must not allow the owner to re-assign their own seat');

    it('must not allow the owner to assign multiple seats to themself');

    it('must allow owner to cancel seats');

    it('must not allow owner to cancel their own seat');

    it('must return the ticket details for a valid ticket');

    it('must return the seat details for a valid seat');

    it('must allow a non-owner address to get their seat and ticket details');

    it('must allow an owner to confirm flight arrival');

    it('must send contract owner ticket price on flight arrival confirmation.');

});