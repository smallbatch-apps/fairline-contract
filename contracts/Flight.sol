pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Flight is Ownable {

    address public regulator;

    uint public seatCount;
    uint public finalSeatCount;
    uint public seatIndex;
    uint public seatPrice;

    bytes32 public flightNumber;

    Seat[] public seats;

    enum FlightStatus { Presale, Sale, Closed, Landed, Finalised }
    FlightStatus status;
    
    struct Seat {
        string seatNumber;
        string description;
    }

    struct TicketSeatLocation {
        uint ticketIndex;
        uint seatIndex;
        address owner;
    }

    struct Ticket {
        address owner;
        TicketSeatLocation[] seatDetails;
        uint paid;
        uint date;
    }

    function Flight() public {
        status = FlightStatus.Presale;
    }

    function addRegulator(address _regulator) public onlyOwner {
        regulator = _regulator;
    }

    function loadSeat(string _seatNumber, string _description) public onlyOwner {
        seats.push(Seat(_seatNumber, _description));
    }

    function setSeatPrice(uint _seatPrice) public onlyOwner {
        seatPrice = _seatPrice;
    }

    function enableFlight() public onlyOwner onlyPresale {
        require(seatCount > 0);
        require(seatCount == seats.length);
        require(regulator != 0);
        require(flightNumber != "");
        status = FlightStatus.Sale;
    }

    function closeFlight() public onlyOwner onlyPresale {
        status = FlightStatus.Closed;
    }

    function landFlight() public onlyOwner onlyClosed {
        status = FlightStatus.Landed;
    }

    function finaliseFlight() public onlyOwner onlyLanded {
        status = FlightStatus.Finalised;
        //selfdestruct();
    }

    function getStatus() public view returns (FlightStatus) {
        return status;
    }

    function setFlightNumber(bytes32 _flightNumber) public onlyOwner {
       flightNumber = _flightNumber;
    }

    function setSeatCount(uint _seatCount) public onlyOwner {
       seatCount = _seatCount;
    }
    
    /**
     * Passenger Actions
     */

    function book(uint amount, uint numberOfSeats) public payable {
        require(amount > 0);
        require(amount = seatPrice * numberOfSeats);
        //require(seatLocations + numberOfSeats <= seatCount)

    }

    // function book(uint amount, uint numberOfSeats) payable onlyActive returns (bool) {
    //     TicketSeatLocation[] memory ticketSeats;

    //     for(uint seatCounter; seatCounter < numberOfSeats; seatCounter++){
    //         ticketSeats.push(TicketSeatLocation(ticketIndex, seatIndex, msg.sender));
    //     }

    //     bookings.push(Ticket(msg.sender, ticketSeats, amount, now));
    //     return true;
    // }


    function bookOneSeat() private returns (SeatLocation[]) {

    }

    function bookMultipleSeats() private returns (SeatLocation[]) {

    }

    function bookEmptySeat() private returns (SeatLocation[]) {

    }


    /**
     * Modifiers
     */

    modifier onlyRegulator(){
        require(msg.sender == regulator);
        _;
    }

    modifier onlyPresale(){
        require(status == FlightStatus.Presale);
        _;
    }

    modifier onlySale(){
        require(status == FlightStatus.Sale);
        _;
    }

    modifier onlyClosed(){
        require(status == FlightStatus.Closed);
        _;
    }

    modifier onlyLanded(){
        require(status == FlightStatus.Landed);
        _;
    }

}