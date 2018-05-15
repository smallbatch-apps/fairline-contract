const Flight = artifacts.require("./Flight.sol");

import expectThrow from 'zeppelin-solidity/test/helpers/expectThrow';
import decodeLogs from 'zeppelin-solidity/test/helpers/decodeLogs';
import SetupHelper from './helpers/SetupHelper';
import DebugEvents from 'contract-events';

let debugEvents = new DebugEvents(Flight);

contract('Flight', function(accounts) {
    
    var flight;
    var administrator = accounts[0];
    var regulator = accounts[1];
    var customer = accounts[2];
    var customer2 = accounts[3];

    const STATUS_PRESALE = 0;
    const STATUS_SALE = 1;
    const STATUS_LANDED = 2;
    const STATUS_CLOSED = 3;
    const SEAT_UUIDS = [
        'fc4f2908', 'fc4f2ba6', 
        'fc4f2cfa', 'fc4f3100',
        'fc4f327c', 'fc4f33a8', 
        'fc4f34c0', 'fc4f35e2'
    ];

    let setup;

    const FLIGHT_NUMBER = 'JQ570';
    const SEAT_PRICE = 5;
    const NUMBER_OF_SEATS = 2;
    
    beforeEach(async function() {
        return Flight.new()
        .then(function(instance) {
            flight = instance;
            setup = new SetupHelper(flight, accounts);
        });
    });

    /**
     * ADMIN
     * 
     * This section is primarily setup and workflow requirements.
     */

    it('should allow an admin to set the number of seats', async function(){
        let newSeatCount = 200;
        await flight.setSeatCount(newSeatCount);
        await flight.setRemainingSeats(newSeatCount);
        let seatCount = await flight.seatCount();
        assert.equal(newSeatCount, seatCount, 'Seat count is not being correcly set');
    });

    it('should allow an admin to add seats', async function(){
        await setup.noSeats();

        await flight.loadSeat(SEAT_UUIDS[0]);
        await flight.loadSeat(SEAT_UUIDS[1]);
        await flight.loadSeat(SEAT_UUIDS[2]);
        await flight.loadSeat(SEAT_UUIDS[3]);
        
        const checkInteger = 2;
        
        let [index, uuid, owner, passenger, price] = await flight.getSeatByIndex(checkInteger);
        
        assert.equal(SEAT_UUIDS[checkInteger], debugEvents.cleanString(uuid), 'Seat is not correctly stored');
    });

    it('should not have a regulator', async function(){
        let defaultRegulator = await flight.regulator();
        assert.equal(0, defaultRegulator, 'Regulator must not be set by default');
    });

    it('should allow a regulator to be added', async function(){
        await flight.addRegulator(regulator);
        let newRegulator = await flight.regulator();
        assert.equal(regulator, newRegulator, 'Regulator must be settable by admin');
    });

    it('should have an owner', async function(){
        let contractOwner = await flight.owner();
        assert.equal(contractOwner, administrator, 'Owner is not correctly set');
    });

    it('should allow an admin to set the price', async function(){
        let newPrice = 6;
        await flight.setSeatPrice(newPrice);
        let seatPrice = await flight.seatPrice();
    
        assert.equal(seatPrice, newPrice, 'Seat price is not being correcly set');
    });

    it('should not allow a flight to be enabled without a regulator', () => {
        expectThrow(flight.enableFlight());
    });

    it('should not allow a non-owner to set a regulator', () => {
        expectThrow(flight.addRegulator(regulator, {from: accounts[3]}));
    });

    it('should not allow a flight with no seats to be enabled', () => {
        expectThrow(flight.enableFlight());
    });
    
    it('should allow a flight to be enabled', async function(){
        await setup.fullSetup();
        await flight.enableFlight();
        
        let status = await flight.getStatus();
        
        assert.equal(status, STATUS_SALE, 'Flight should be available for sale');
    });

    it('should not allow a flight to be finalised prior to landing', async function(){
        await setup.fullSetup();
        
        expectThrow(flight.finaliseFlight());
    });

    /**
     * BOOKINGS
     * 
     * Note that owner in this context refers to the ticket owner, 
     * not the contract owner. SHOULD and MUST have no specific distinctions
     * and all functionality is a requirement.
     */

    it('should allow not allow the purchase of a ticket before sale status', async function(){
        await setup.fullSetup();
        expectThrow(flight.book(NUMBER_OF_SEATS, {from: customer, value: SEAT_PRICE * NUMBER_OF_SEATS}));
    });


    it('should allow the purchase of a seat', async function(){
        await setup.saleSetup();

        await flight.book(NUMBER_OF_SEATS, {from: customer, value: SEAT_PRICE * NUMBER_OF_SEATS});
        let tx = await flight.book(NUMBER_OF_SEATS, {from: customer2, value: SEAT_PRICE * NUMBER_OF_SEATS});
        let event = debugEvents.setTx(tx).getEvent('SeatBooked');
        let [index, uuid, owner, passenger, price] = await flight.getSeatByUuid(event.uuid);
        
        assert.equal(debugEvents.cleanString(uuid), 'fc4f2cfa', 'ticket is from the wrong index');
        assert.equal(owner, customer2, 'owner address should be ' + customer2);
        assert.equal(passenger, customer2, 'passenger address should be ' + customer2);
        assert.equal(debugEvents.cleanUint(price), 5, 'Price should be 5');
    });

    it('must be the correct amount paid', async function(){
        await setup.saleSetup();
        expectThrow(flight.book(NUMBER_OF_SEATS, {from: customer, value: SEAT_PRICE}));
    });

    it('must not purchase zero seats', async function(){
        await setup.saleSetup();
        expectThrow(flight.book(0, {from: customer, value: SEAT_PRICE}));
    });

    it('must allow owner to cancel their seat', async function(){
        await setup.saleSetup();
        
        let tx = await flight.book(1, {from: customer, value: SEAT_PRICE});

        let event = debugEvents.setTx(tx).getEvent('SeatBooked');
        let [index, uuid, owner, passenger, price] = await flight.getSeatByUuid(event.uuid);

        tx = await flight.cancelSeat(index, {from: customer});
        event = debugEvents.setTx(tx).getEvent('SeatCancelled');

        [index, uuid, owner, passenger, price] = await flight.getSeatByUuid(event.uuid);
        
        let skippedSeatCount = await flight.getSkippedSeatCount();
        
        assert.equal(debugEvents.cleanString(uuid), SEAT_UUIDS[0], 'Seat UUID should not change on cancellation');
        assert.equal(owner, 0, 'Owner should be blank after cancellation');
        assert.equal(passenger, 0, 'Passenger should be blank after cancellation');
        assert.equal(debugEvents.cleanUint(price), 0, 'Price should be 0 after cancellation');
        assert.equal(debugEvents.cleanUint(skippedSeatCount), 1, 'There should be one skipped seat');
    });

    it('must purchase a "skipped" seat if one is available and a single seat is purchased', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});
        await flight.book(1, {from: customer2, value: SEAT_PRICE});
        await flight.book(1, {from: accounts[4], value: SEAT_PRICE});
        await flight.book(1, {from: accounts[5], value: SEAT_PRICE});
        await flight.cancelSeat(2, {from: accounts[4]});
        await flight.book(1, {from: accounts[6], value: SEAT_PRICE});

        let [index, uuid, owner, passenger, price] = await flight.getSeatByIndex(2);
        let skippedSeatCount = await flight.getSkippedSeatCount();

        assert.equal(owner, accounts[6], 'Owner should be new purchaser');
        assert.equal(passenger, accounts[6], 'Passenger should be new purchaser');
        assert.equal(debugEvents.cleanUint(price), 5, 'Price should be 0 after cancellation');
        assert.equal(debugEvents.cleanUint(skippedSeatCount), 0, 'There should be no skipped seats');
    });
    
    it('must allow purchase of tickets of multiple seats', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer2, value: SEAT_PRICE});
        await flight.book(1, {from: customer2, value: SEAT_PRICE});
        const numberOfSeats = 3;
        const tx = await flight.book(numberOfSeats, {from: customer, value: SEAT_PRICE * numberOfSeats});
        const events = debugEvents.setTx(tx).getEvents('SeatBooked');
        const ownerSeats = await flight.getOwnerSeats({from: customer});
        assert.equal(events.length, numberOfSeats, `Seat Booking event did not fire ${numberOfSeats} times`);
        assert.equal(ownerSeats.length, numberOfSeats, `CustomerSeats array does not contain ${numberOfSeats} elements`);
        assert.equal(debugEvents.cleanUint(ownerSeats[0]), 2, 'Index of purchased seat should be 2');
    });

    it('must decline purchase of tickets if there are insufficient seats', async function(){
        await setup.saleSetup();
        await flight.book(7, {from: customer2, value: SEAT_PRICE * 7});
        expectThrow(flight.book(3, {from: customer, value: SEAT_PRICE * 3}));
    });

    it('must allow the owner to assign transfer their seats', async function(){
        await setup.saleSetup();
        await flight.book(2, {from: customer, value: SEAT_PRICE * 2});
        const ownerSeats = await flight.getOwnerSeats({from: customer});
        
        const seatIndex = debugEvents.cleanUint(ownerSeats[1]);
        
        await flight.transferSeat(seatIndex, customer2, {from: customer});

        let [index, uuid, owner, passenger, price] = await flight.getSeatByIndex(seatIndex);

        assert.equal(owner, customer, 'Customer does not own this seat');
        assert.equal(passenger, customer2, 'Wrong passenger in this seat');
    });

    it('must not allow transferring a seat that does not belong to you', async function(){
        await setup.saleSetup();
        await flight.book(2, {from: customer, value: SEAT_PRICE * 2});
        const ownerSeats = await flight.getOwnerSeats({from: customer});
        
        const seatIndex = debugEvents.cleanUint(ownerSeats[1]);
        
        expectThrow(flight.transferSeat(seatIndex, customer2, {from: customer2}));
    });

    it('must allow an owner passenger to get their seat details', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});

        let [index, uuid, owner, passenger, price] = await flight.getPassengerSeat({from: customer});

        assert.equal(debugEvents.cleanString(uuid), SEAT_UUIDS[0], 'is not correct');
        assert.equal(owner, customer, 'Owner should be customer');
        assert.equal(passenger, customer, 'Passenger should be customer');
        assert.equal(debugEvents.cleanUint(price), 5, `Price should be ${SEAT_PRICE}`);
    });

    it('must allow a non-owner passenger to get their seat details', async function() {
        await setup.saleSetup();
        await flight.book(2, {from: customer, value: SEAT_PRICE * 2});
        const ownerSeats = await flight.getOwnerSeats({from: customer});
        
        const seatIndex = debugEvents.cleanUint(ownerSeats[1]);
        
        await flight.transferSeat(seatIndex, customer2, {from: customer});

        let [index, uuid, owner, passenger, price] = await flight.getPassengerSeat({from: customer2});

        assert.equal(debugEvents.cleanString(uuid), SEAT_UUIDS[1], 'is not correct');
        assert.equal(owner, customer, 'Owner should be customer');
        assert.equal(passenger, customer2, 'Passenger should be customer2');
        assert.equal(debugEvents.cleanUint(price), 5, `Price should be ${SEAT_PRICE}`);
    });

    it('must allow an owner to confirm flight arrival', async function(){
        await setup.saleSetup();
        await flight.closeFlight();
        await flight.landFlight();
        const status = await flight.getStatus();
        assert.equal(debugEvents.cleanUint(status), 3, 'Status is not Landed');
    });

    xit('must allow refunds on flight cancellation', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});
        await flight.closeFlight();
        await flight.landFlight();
        await flight.finaliseFlight();
        await flight.cancelFlight();

        let tx = await flight.requestRefund({from: customer});

        let event = debugEvents.setTx(tx).getEvents('RefundSent');

        assert.equal(event.length, 1, 'Refund was sent');
    });

    it('must only allow refunds on a flight that is cancelled', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});
        await flight.closeFlight();
        await flight.landFlight();
        await flight.finaliseFlight();

        expectThrow(await flight.requestRefund({from: customer}));
    });

    it('must not allow refunds for people who are not customers', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});
        await flight.closeFlight();
        await flight.landFlight();
        await flight.finaliseFlight();
        await flight.cancelFlight();

        expectThrow(flight.requestRefund({from: customer2}));
    });

    it('must not allow multiple refunds on a flight', async function(){
        await setup.saleSetup();
        await flight.book(1, {from: customer, value: SEAT_PRICE});
        await flight.closeFlight();
        await flight.landFlight();
        await flight.finaliseFlight();
        await flight.cancelFlight();

        await flight.requestRefund({from: customer});
        expectThrow(flight.requestRefund({from: customer}));

    });

    it('must send contract owner ticket prices on flight conclusion.', async function(){
        await setup.saleSetup();
        await flight.closeFlight();
        await flight.landFlight();
        await flight.finaliseFlight();

        let tx = await flight.concludeFlight();
        let events = debugEvents.setTx(tx).getEvents('FlightConcluded');

        assert.equal(events.length, 1, 'FlightConcluded event should have been executed');
    });
});