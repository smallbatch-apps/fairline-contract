# Flight Contract

# Goal

The flight contract is a distributed Solidity app (dapp) running on the Ethereum blockchain. It is a proof-of-concept of a means of paying for and managing airline flights.

The intent is to democratize and restrict the capabilities of airlines in response to some unacceptable behaviours from airlines. There are two specific use-cases that are intended to be handled by the smart contract. 

The first is to eliminate the possibility of “overselling”. Airlines typically book more people to a flight than they can fit, under that assumption that a given percentage will not travel. If this assumption is incorrect, passengers need to be removed. High profile examples include unacceptable violence on the part of the airline. 

The second use-case is ticket transfer. In many cases, changing a booked flight is prohibitively expensive. Airlines expect the passenger to book a new ticket, at an inflated rate. They may also refuse entirely as there are no seats available, even though it is actually merely a name change.

## Technology



# Usage

## Operation
The flight contract is deployed by an owner, who is the administrator of the flight. They set the flight details, and then load the seat information.

The contract deployer is the owner of the contract. They are the only one authorised as an admin. 

A flight is initially created with no state, and none is added in the constructor on deployment. This is because constructor testing is difficult. After the flight is created it needs a number of state properties set. This includes the flight id, the number of seats, and the seats themselves. All of this would are done through a dApp, but for clarity, the flightID is a uuid. Flight numbers (such as JQ176) are not sufficiently unique.  Flight details such as the flight number, origin and destination, would be stored in the dApp’s persistence layer.

The flight status will default to “Presale” status, during which the flight cannot be purchased, and is able to be setup. The primary thing to do here is add seats. These are added with Flight.loadSeat(seatUuid) where the uuid is also generated through the dApp. This provides a way to tie the blockchain state to the seat info: ac46f65fe3 = 12G, a window seat on an exit row.

The seatCount is independent of the number of times loadSeats is called. Care should be taken to keep them in sync. Seats can not be unloaded, but seatCount can be modified at any time.

Flight.setSeatPrice(newPrice) can be called at any time to reflect market requirements, and adjusts all future bookings. It does not affect transfers. The default price used in unit tests is 5, which translates to 5 gwei, or $0.0000001c. Which may be considered too low for current market conditions.

Flight.enableFlight() will allow purchasing of tickets once the state is valid. The SetupHelper class will assist in determining a valid state.

Flight status must be progressively set beyond that.  Statuses are as follows

Presale - Setup state
Sale - Available to purchase seats
Closed - Can no longer purchase, less than 24 hrs to flight, etc
Landed - Flight has finished 
Finalised - Flight is done, but may have outstanding issues or questions.
Concluded - Not a formal state, Flight.concludeFlight() executes the selfdestruct on the flight, sending the contract’s funds to the owner.
Cancelled  - This flight will not operate. Any paid customer is able to request a refund which has no approval process. The contract is void and can not be acted on in any way.

Sale -> Closed -> Landed -> Finalised -> Concluded must be called explicitly and in that order.

## Customer

The customer has three main actions. Book, transfer, and cancel. Booking requires a number of seats to book, and is payable at the current seat price multiplied by the number of seats. 

This means that in order to purchase a seat for themselves and a partner through the contract, a customer would have to:

Get the current seat price
Execute Flight.book(2) and pay (2 * seat price)
Execute Flight.getOwnerSeats() and get the index of the second seat
Execute Flight.transferSeat(secondSeatId, partnerAddress)

In practice, all the above would be done through a dApp, which makes use of eventing to facilitate the workflow.

Transferring can be done until the flight is “closed”, ie something like an hour before boarding. Transferring incurs negligible cost (gas cost only) and can be done on any and all seats.  The ability to fully transfer a ticket’s ownership is a potential future upgrade.

If a plane is cancelled, the owners will be able to request a refund, which requires no approval and cannot be prevented by the contract.

# Known/Deliberate Limitations

## For Admin
The workflow for setting up the contract’s initial state - especially seats - is unintuitive and has a high gas cost. As an operating cost for an airline this is not likely to be significant. Any way to actually pass an array or object into the constructor or to a loadSeat-like function would alleviate this.

There is no concept of classes - all seats have equivalent prices at any given time. First Class, etc, could potentially be done as a separate contract, or be a later addition.

There is no ability to pick seats, move seats, etc.

There is no concept of identification. A customer is an Ethereal address, nothing more. Tying this into Zeppelin’s ID system is an ideal solution here.

The only possible administrator is the contract deployer. It is not possible to add other administrators.

## For Customer
The flight contract books flights sequentially. If three seats are booked it will book (for example) 12C, 12D and 12E. However, it has no knowledge of the layout of the plane and will happily book a couple on 4G and 5A.

Transferring transfers only the passenger address, the original purchaser remains the official “owner”. This means any refunds, etc, go to the owner, not the passenger. This also means a ticket could be re-assigned multiple times by a malicious owner without the new passenger being informed.
