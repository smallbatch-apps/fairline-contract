pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Flight is Ownable {

    event TicketPurchased(address indexed purchaser, );

    address public regulator;

    uint public seatCount;
    uint public finalSeatCount;
    uint public seatIndex;
    uint public seatPrice;

    bytes32 public flightNumber;

    Seat[] public seats;
    
    mapping(address => Ticket) tickets;
    mapping(uint => address) seatTicket;
    
    uint[] public skippedSeats;

    mapping(address => uint) ticketOwnerSeatIndex;

    enum FlightStatus { Presale, Sale, Closed, Landed, Finalised }
    FlightStatus status;
    
    enum TicketStatus { Pending, Purchased, Closed, Cancelled }
    TicketStatus ticketStatus;

    struct Seat {
        string seatNumber;
        string description;
    }

    struct TicketSeatLocation {
        address ticketOwner;
        uint seatIndex;
        address owner;
    }

    struct Ticket {
        address owner;
        TicketSeatLocation[] seatDetails;
        uint paid;
        uint date;
        bool purchased;
        TicketStatus ticketStatus;
    }

    function Flight() public {
        status = FlightStatus.Presale;
    }

    //function setUpTestFlight(address _regulator) public {
        //this.setFlightNumber("JQ570");
        // this.loadSeat("1A", "Window exit");
        // this.loadSeat("1B", "Aisle exit");
        // this.loadSeat("1C", "Aisle exit");
        // this.loadSeat("1D", "Window exit");
        // this.loadSeat("2A", "Window exit");
        // this.loadSeat("2B", "Aisle exit");
        // this.loadSeat("2C", "Aisle exit");
        // this.loadSeat("2D", "Window exit");
        // this.setSeatCount(8);
        // this.setSeatPrice(5);
        // this.addRegulator(_regulator);

        // status = FlightStatus.Sale;
    //}

    function addRegulator(address _regulator) public onlyOwner {
        regulator = _regulator;
    }

    function loadSeat(string _seatNumber, string _description) public onlyOwner {
        seats.push(Seat(_seatNumber, _description));
    }

    function setSeatPrice(uint _seatPrice) public onlyOwner {
        seatPrice = _seatPrice;
    }

    function enableFlight() public onlyOwner {
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

    function getSeatsLength() public view onlyOwner returns(uint) {
        return seats.length;
    }
    
    /**
     * Passenger Actions
     */

    function book(uint numberOfSeats) public payable onlySale {
        require(msg.value > 0);
        require(msg.value == seatPrice * numberOfSeats);
        
        require(!tickets[msg.sender].purchased);
        //require(seatLocations + numberOfSeats <= seatCount);

        tickets[msg.sender].owner = msg.sender;
        tickets[msg.sender].paid = msg.value;
        tickets[msg.sender].date = block.timestamp;
        tickets[msg.sender].ticketStatus = TicketStatus.Pending;
        
        if (numberOfSeats == 1 && skippedSeats.length == 0) {
             bookOneSeat();
        }
        // else if (numberOfSeats == 1) {
        // //     bookEmptySeat();
        // } else {
        //     bookMultipleSeats(numberOfSeats);
        // }

        tickets[msg.sender].purchased = true;
    }

    function getTicket() public view returns (address, uint, uint, uint, string, string) {
        Ticket storage userTicket = tickets[msg.sender];

        Seat storage userSeat = seats[userTicket.seatDetails[ticketOwnerSeatIndex[msg.sender]].seatIndex];

        return (userTicket.owner, 
            userTicket.seatDetails.length,
            userTicket.paid, 
            userTicket.date,
            userSeat.seatNumber,
            userSeat.description
        );
    }

    function bookOneSeat() private {
        tickets[msg.sender].seatDetails.push(TicketSeatLocation(msg.sender, seatIndex, msg.sender));
        seatIndex++;
    }

    // function bookSkippedSeat() private {
    //     require(skippedSeats.length > 0);


    // }
    
    function getSeatByIndex(uint index) view public returns (uint, address, uint) {
        return (tickets[msg.sender].seatDetails[index].seatIndex,
            tickets[msg.sender].seatDetails[index].owner,
            tickets[msg.sender].seatDetails[index].seatIndex);
    }

    function cancelSeat() public {

    }

    function bookMultipleSeats(uint numberOfSeats) private {
        for (uint i; i <= numberOfSeats; i++) {
            bookOneSeat();
        }
    }

    function cancelTicket() public {
        for (uint i; i <= tickets[msg.sender].seatDetails.length; i++) {
            skippedSeats.push(tickets[msg.sender].seatDetails[i].seatIndex);
            delete tickets[msg.sender].seatDetails[i];
        }
        delete tickets[msg.sender];
    }

    function getTicketSeatCount() public view returns(uint) {
        return tickets[msg.sender].seatDetails.length;
    }

    function getSkippedSeatCount() public view returns(uint) {
        return skippedSeats.length;
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
        //require(status == FlightStatus.Sale);
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

    modifier hasTicket(){
        require(tickets[msg.sender].purchased);
        _;
    }
}