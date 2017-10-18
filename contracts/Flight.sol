pragma solidity ^0.4.17;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Flight is Ownable {

    address public regulator;

    uint public seatCount;
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
}