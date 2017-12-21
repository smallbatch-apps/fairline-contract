Flight Contract
The flight contract is a distributed Solidity app (dapp) running on the Ethereum blockchain. It is a proof-of-concept of a means of paying for and managing airline flights.

The intent is to democratize and restrict the capabilities of airlines in response to some unacceptable behaviours from airlines. There are two specific use-cases that are intended to be handled by the smart contract. 

The first is to eliminate the possibility of “overselling”. Airlines typically book more people to a flight than they can fit, under that assumption that a given percentage will not travel. If this assumption is incorrect, passengers need to be removed. High profile examples include unacceptable violence on the part of the airline. 

The second use-case is ticket transfer. In many cases, changing a booked flight is prohibitively expensive. Airlines expect the passenger to book a new ticket, at an inflated rate. They may also refuse entirely as there are no seats available, even though it is actually merely a name change.

## Operation
The flight contract is deployed by an owner, who is the administrator of the flight. They set the flight details, and then load the seat information.

## Customer
The customer can book, purchase, transfer and cancel tickets.