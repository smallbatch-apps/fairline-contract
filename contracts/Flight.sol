pragma solidity ^0.4.15;

import 'zeppelin-solidity/contracts/ownership/Ownable.sol';

contract Flight is Ownable {

    address public regulator;

    uint public seatCount;
    uint public seatIndex;
    uint public seatPrice;

    Seat[] public seats;

    enum FlightStatus { Presale, Sale, Closed, Landed, Finalised }
    FlightStatus status;
    
    struct Seat {
        string seatNumber;
        string description;
    }

    function Flight() {
        status = FlightStatus.Presale;
    }

    function changeSeatCount(uint _seatCount) onlyOwner {
        seatCount = _seatCount;
    }

    function addRegulator(address _regulator) onlyOwner {
        regulator = _regulator;
    }

    function loadSeat(string _seatNumber, string _description) onlyOwner {
        seats.push(Seat(_seatNumber, _description));
    }

    function changeSeatPrice(uint _seatPrice) onlyOwner {
        seatPrice = _seatPrice;
    }

    function enableFlight() onlyOwner onlyPresale {
        require(seatCount > 0);
        status = FlightStatus.Sale;
    }

    function getStatus() returns (FlightStatus) {
        return status;
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