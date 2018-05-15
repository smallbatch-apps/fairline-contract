pragma solidity ^0.4.23;

import "../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";

contract Flight is Ownable {

    event TicketPurchased(address indexed purchaser);
    event FlightEnabled(bytes32 indexed flightId);
    event FlightLanded(bytes32 indexed flightId);
    event FlightCancelled(bytes32 indexed flightId);
    event SeatBooked(bytes32 indexed flightId, address indexed owner, bytes32 uuid);
    event SeatCancelled(bytes32 indexed flightId, bytes32 uuid);
    event SeatTransferred(bytes32 indexed flightId, address indexed owner, bytes32 uuid);
    event RefundSent(bytes32 indexed flightId, address indexed owner, uint amount);
    event FlightConcluded(bytes32 indexed flightId, address indexed owner, uint amount);

    event Dump(bytes32 debugString, uint debugInteger);

    address public regulator;

    uint public seatCount;
    uint public seatsRemaining;
    uint public seatPurchaseIndex = 0;
    uint public seatPrice;

    bytes32 public flightId;
    
    struct Seat {
        bytes32 uuid;
        address owner;
        address passenger;
        uint price;
    }

    mapping(address => uint[]) public ownerSeats;
    mapping(bytes32 => uint) public seatIndexFromUuid;
    mapping(address => uint) public passengerSeat;
    Seat[] public seats;

    uint[] private skippedSeats;

    enum FlightStatus { Presale, Sale, Closed, Landed, Finalised, Cancelled }
    FlightStatus status;

    constructor() public {
        status = FlightStatus.Presale;
    }

    function addRegulator(address _regulator) public onlyOwner {
        regulator = _regulator;
    }

    function setSeatPrice(uint _seatPrice) public onlyOwner {
        seatPrice = _seatPrice;
    }

    function enableFlight() public onlyOwner {
        require(seatCount > 0);
        require(regulator != 0);
        require(flightId != "");
        status = FlightStatus.Sale;
        emit FlightEnabled(flightId);
    }

    function getOwnerSeat(uint _index) public view hasTicket returns(uint) {
        return ownerSeats[msg.sender][_index];
    }

    function getOwnerSeats() public view hasTicket returns(uint[]) {
        return ownerSeats[msg.sender];
    }

    function transferSeat(uint _seatIndex, address _transferTo) public hasTicket {
        require(seats[_seatIndex].owner == msg.sender, "You are not the owner of this seat");
        seats[_seatIndex].passenger = _transferTo;
        passengerSeat[_transferTo] = _seatIndex;

        emit SeatTransferred(flightId, msg.sender, seats[_seatIndex].uuid);
    }

    function closeFlight() public onlyOwner onlySale {
        status = FlightStatus.Closed;
    }

    function landFlight() public onlyOwner onlyClosed {
        status = FlightStatus.Landed;
        emit FlightLanded(flightId);
    }

    function finaliseFlight() public onlyOwner onlyLanded {
        status = FlightStatus.Finalised;
    }

    function cancelFlight() public onlyOwner onlyFinalised {
        status = FlightStatus.Landed;
        emit FlightLanded(flightId);
    }

    function getStatus() public view returns(FlightStatus) {
        return status;
    }

    function setFlightId(bytes32 _flightId) public onlyOwner {
        flightId = _flightId;
    }

    function setSeatCount(uint _seatCount) public onlyOwner {
        seatCount = _seatCount;
    }

    function setRemainingSeats(uint _seatsRemaining) public onlyOwner {
        seatsRemaining = _seatsRemaining;
    }
    
    /**
     * Passenger Actions
     */

    function book(uint numberOfSeats) public payable onlySale {
        require(msg.value > 0, "Value must be greater than zero");
        require(msg.value == seatPrice * numberOfSeats, "Value must be the number of seats multiplied by the current price");
        require(numberOfSeats <= seatsRemaining);

        if (numberOfSeats == 1 && skippedSeats.length == 0) {
            bookOneSeat();
        } else if (numberOfSeats > 1) {
            bookMultipleSeats(numberOfSeats);
        } else if (numberOfSeats == 1 && skippedSeats.length > 0) {
            bookSkippedSeat();
        }
    }

    function loadSeat(bytes32 _uuid) public returns(uint) {
        seats.push(Seat(_uuid, address(0), address(0), 0));
        seatIndexFromUuid[_uuid] = seats.length-1;
        return seats.length-1;
    }

    function getSeatByIndex(uint _index) 
        public 
        view 
        returns(uint, bytes32, address, address, uint) 
    {
        Seat storage searchSeat = seats[_index];
        return (_index, searchSeat.uuid, searchSeat.owner, searchSeat.passenger, searchSeat.price);
    }

    function getSeatByUuid(bytes32 _uuid) 
        public 
        view 
        returns(uint, bytes32, address, address, uint) 
    {
        Seat storage searchSeat = seats[seatIndexFromUuid[_uuid]];
        return (seatIndexFromUuid[_uuid], _uuid, searchSeat.owner, searchSeat.passenger, searchSeat.price);
    }

    function getPassengerSeat() public view returns(uint, bytes32, address, address, uint) {
        Seat storage searchSeat = seats[passengerSeat[msg.sender]];
        return (passengerSeat[msg.sender], searchSeat.uuid, searchSeat.owner, searchSeat.passenger, searchSeat.price);
    }
    
    function bookOneSeat() private {
        ownerSeats[msg.sender].push(seatPurchaseIndex);
        passengerSeat[msg.sender] = seatPurchaseIndex;
        
        seats[seatPurchaseIndex].owner = msg.sender;
        seats[seatPurchaseIndex].passenger = msg.sender;
        seats[seatPurchaseIndex].price = seatPrice;

        emit SeatBooked(flightId, seats[seatPurchaseIndex].owner, seats[seatPurchaseIndex].uuid);
        
        seatPurchaseIndex++;
        seatsRemaining--;
    }

    function bookSkippedSeat() private {

        uint skippedSeatIndex = skippedSeats[skippedSeats.length-1];
        delete skippedSeats[skippedSeats.length-1];
        skippedSeats.length--;

        seatsRemaining--;

        ownerSeats[msg.sender].push(skippedSeatIndex);
        passengerSeat[msg.sender] = skippedSeatIndex;
        
        seats[skippedSeatIndex].owner = msg.sender;
        seats[skippedSeatIndex].passenger = msg.sender;
        seats[skippedSeatIndex].price = seatPrice;

        emit SeatBooked(flightId, seats[skippedSeatIndex].owner, seats[skippedSeatIndex].uuid);
    }

    function cancelSeat(uint _seatIndex) public {
        require(seats[_seatIndex].owner == msg.sender, "This seat does not belong to this user");
        
        if (seats[_seatIndex].passenger == msg.sender) {
            delete passengerSeat[msg.sender];
        }
        
        for (uint i = 0; i < ownerSeats[msg.sender].length-1; i++) {
            if (_seatIndex == ownerSeats[msg.sender][i]) {
                delete ownerSeats[msg.sender][i];
                ownerSeats[msg.sender][i] = ownerSeats[msg.sender][ownerSeats[msg.sender].length-1];
            }
        }
        
        ownerSeats[msg.sender].length--;
        skippedSeats.push(_seatIndex);

        msg.sender.transfer(seats[_seatIndex].price);
        
        seats[_seatIndex].owner = address(0);
        seats[_seatIndex].passenger = address(0);
        seats[_seatIndex].price = 0;

        seatsRemaining++;
        
        emit SeatCancelled(flightId, seats[_seatIndex].uuid);
    }

    function bookMultipleSeats(uint _numberOfSeats) private {
        for (uint i; i < _numberOfSeats; i++) {
            bookOneSeat();
        }
    }

    function getSkippedSeatCount() public view returns(uint) {
        return skippedSeats.length;
    }

    function requestRefund() public hasTicket {
        uint totalRefund = 0;
        for(uint i; i < ownerSeats[msg.sender].length; i++){
            totalRefund += ownerSeats[msg.sender][i];
            delete ownerSeats[msg.sender][i];
        }
        ownerSeats[msg.sender].length = 0;

        emit RefundSent(flightId, msg.sender, totalRefund);
        msg.sender.transfer(totalRefund);
    }

    function concludeFlight() public onlyOwner {
        emit FlightConcluded(flightId, owner, address(this).balance);
        selfdestruct(owner);
    }

    /**
     * Modifiers
     */

    modifier onlyRegulator(){
        require(msg.sender == regulator, "Sender must be a regulator");
        _;
    }

    modifier onlyPresale(){
        require(status == FlightStatus.Presale, "Flight must be in Presale status");
        _;
    }

    modifier onlySale(){
        require(status == FlightStatus.Sale, "Flight must be in Sale status");
        _;
    }

    modifier onlyClosed(){
        require(status == FlightStatus.Closed, "Flight must be in Closed status");
        _;
    }

    modifier onlyLanded(){
        require(status == FlightStatus.Landed, "Flight must be in Landed status");
        _;
    }

    modifier onlyFinalised(){
        require(status == FlightStatus.Finalised, "Flight must be in Finalised status");
        _;
    }

    modifier onlyCancelled(){
        require(status == FlightStatus.Cancelled, "Flight must be in Cancelled status");
        _;
    }

    modifier hasTicket(){
        require(ownerSeats[msg.sender].length > 0, "Sender must have seats on this flight");
        _;
    }
}