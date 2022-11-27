// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;


contract Recur {

    struct Payment {
        uint id;
        address from;
        string label;
        address to;
        uint amount;
        uint lastPay;
        uint interval; //the period in seconds between payments, for ex. daily = 60 * 60 * 24
        bool active;
    }

    // access a payment with all its details (from, to, amount...) with a single unique ID.
    mapping(uint => Payment) public all_payments;
    // keeps track of all the payments an address created
    mapping(address => Payment[]) public outgoingPayments;
    // keeps track of all the payments an address receives
    mapping(address => Payment[]) public incomingPayments;
    // acts as a unique id. always gets incremented with each creation of payment.
    uint count; 
    // keeps track of the funding for each payment.
    mapping(uint => uint) public funds;

    modifier paymentExists(uint id) {
        require(all_payments[id].amount != 0, 'payment does not exist');
        _;
    }

    modifier paymentIsActive(uint id) {
        require(all_payments[id].active, 'payment is deactivated');
        _;
    }

    modifier onlyPayer(address who, uint id) {
        require(all_payments[id].from == who, 'Only payer can do that');
        _;
    }

    modifier onlyPayee(address who, uint id) {
        require(all_payments[id].to == who, 'Only payee can do that');
        _;
    }

    event CreatePayment(address from, address to, string label, uint amount, uint interval);
    event DeletePayment(address from, uint paymentId);
    event DeactivatePayment(address from, uint paymentId);
    event ActivatePayment(address from, uint paymentId);
    event SendPayment(address from, address to, uint amount);
    event DepletedFunds(uint paymentId);
    event Fund(address who, uint amount, uint paymentId);
    event Withdraw(address who, uint amount, uint paymentId);
    event ClaimPayments(address who, uint amount);
    // transfer tokens from the sender funds kept inside the contract
    event Transfer(address from, address to, uint amount, uint paymentId); 


    function createPayment(address to, string memory label, uint amount, uint interval) public {
        require(amount > 0, 'amount must be greater than 0');
        require(msg.sender != to, 'Payer cannot be the payee');
        count += 1;

        Payment memory payment = Payment(count, msg.sender, label, to, amount, block.timestamp, interval, false);

        all_payments[count] = payment;

        // add to outgoing array and incoming array
        incomingPayments[to].push(payment);
        outgoingPayments[msg.sender].push(payment);

        emit CreatePayment(msg.sender, to, label, amount, interval);
    }


    function deletePayment(uint id) public paymentExists(id) onlyPayer(msg.sender, id) {
        // transfer funds back to the sender
        uint amount = funds[id];
        delete funds[id];
        payable(msg.sender).transfer(amount);

        for (uint i = 0; i < outgoingPayments[msg.sender].length; i++) {
            if (outgoingPayments[msg.sender][i].id == id) {
                // delete payment from sender's outgoing payments
                delete outgoingPayments[msg.sender][i];
            }
        }

        for (uint i = 0; i < incomingPayments[all_payments[id].to].length; i++) {
            if (incomingPayments[all_payments[id].to][i].id == id) {
                // delete payment from receiver's incoming payments
                delete incomingPayments[all_payments[id].to][i];
            }
        }

        // delete from total payments mapping
        delete all_payments[id];

        emit DeletePayment(msg.sender, id);
    }

    function contractDeactivatePayment(uint id) private paymentExists(id) {

        if (getAllUnclaimedFunds(all_payments[id].to) > 0) {
            contractCollectAllFunds(all_payments[id].to);
        }

        all_payments[id].active = false;

        // update structs in array!!!
        for (uint i = 0; i < incomingPayments[all_payments[id].to].length; i++) {
            if (incomingPayments[all_payments[id].to][i].id == id) {
                incomingPayments[all_payments[id].to][i].active = false;
            }
        }

        for (uint i = 0; i < outgoingPayments[all_payments[id].from].length; i++) {
            if (outgoingPayments[all_payments[id].from][i].id == id) {
                outgoingPayments[all_payments[id].from][i].active = false;
            }

        }


        emit DeactivatePayment(msg.sender, id);
    }

    function contractCollectAllFunds(address payee) private {
        for (uint i=0; i < incomingPayments[payee].length; i++) {
            collectFundsById(incomingPayments[payee][i].id, payee);
        }
        uint allClaimableFunds = getAllUnclaimedFunds(payee);

        emit ClaimPayments(payee, allClaimableFunds);
    }

    // so that the payer can deactivate payment and also the contract when funds get depleted
    function deactivatePayment(uint id) public paymentExists(id) onlyPayer(msg.sender, id) {
        contractDeactivatePayment(id);
    }
    
    function activatePayment(uint id) public paymentExists(id) onlyPayer(msg.sender, id) {
        require(funds[id] >= all_payments[id].amount, 'Payment amount exceeds funds');
        all_payments[id].active = true;
        all_payments[id].lastPay =  block.timestamp;

        // update structs in array!!!
        for (uint i = 0; i < incomingPayments[all_payments[id].to].length; i++) {
            if (incomingPayments[all_payments[id].to][i].id == id) {
                incomingPayments[all_payments[id].to][i].active = true;
            }
        }

        for (uint i = 0; i < outgoingPayments[all_payments[id].from].length; i++) {
            if (outgoingPayments[all_payments[id].from][i].id == id) {
                outgoingPayments[all_payments[id].from][i].active = true;
            }

        }

        emit ActivatePayment(msg.sender, id);
    }

    function getNumOutgoingPayments(address payer) public view returns (uint) {
        return outgoingPayments[payer].length;
    }

    function getNumIncomingPayments(address payee) public view returns (uint) {
        return incomingPayments[payee].length;
    }

    // determine how much funds are available to collect from an incoming payment by id
    function getUnclaimedFundsById(uint id) public view paymentExists(id) paymentIsActive(id) returns (uint, uint) {

        uint availableToCollect = 0;
        uint paymentFund = funds[id];
        uint last_pay = all_payments[id].lastPay;

        Payment memory payment = all_payments[id];
        while (block.timestamp >= payment.interval + last_pay && paymentFund >= payment.amount) {
            availableToCollect += payment.amount;
            paymentFund -= payment.amount;
            last_pay = last_pay + payment.interval;
        }


        return (availableToCollect, last_pay);
    }

    // determine how much funds are available to collect from all incoming payments
    function getAllUnclaimedFunds(address payee) public view returns (uint) {
        uint fundsToCollect = 0;
        uint claimableFunds;

        for (uint i=0; i < incomingPayments[payee].length; i++) {
            if (incomingPayments[payee][i].active == true) {
                (claimableFunds,) = getUnclaimedFundsById(incomingPayments[payee][i].id);
                fundsToCollect += claimableFunds;
            }
        }

        return fundsToCollect;
    }

    // need to collect each funds separately because for each payment the funder is different.
    function collectFundsById(uint id, address payee) public payable paymentExists(id) paymentIsActive(id) onlyPayee(payee, id) {
        (uint fundsToCollect, uint last_pay) = getUnclaimedFundsById(id);
        funds[id] -= fundsToCollect;
        // update lastPay
        all_payments[id].lastPay = last_pay;
        // update structs in array!!!
        for (uint i = 0; i < incomingPayments[all_payments[id].to].length; i++) {
            if (incomingPayments[all_payments[id].to][i].id == id) {
                incomingPayments[all_payments[id].to][i].lastPay = last_pay;
            }
        }

        for (uint i = 0; i < outgoingPayments[all_payments[id].from].length; i++) {
            if (outgoingPayments[all_payments[id].from][i].id == id) {
                outgoingPayments[all_payments[id].from][i].lastPay = last_pay;
            }

        }


        // all_payments[id].lastPay = block.timestamp;

        // if what's left in the fund is insufficient for the next payment,
        // deactivate it.
        if (funds[id] < all_payments[id].amount) {
            emit DepletedFunds(id);
            contractDeactivatePayment(id);
        }

        // transfer to payee the available funds
        payable(payee).transfer(fundsToCollect);
        emit Transfer(all_payments[id].from, payee, all_payments[id].amount, id);
    }

    function collectAllFunds() public {
        contractCollectAllFunds(msg.sender);
    }


    function fund(uint id) public payable onlyPayer(msg.sender, id) {
        require(funds[id] + msg.value >= all_payments[id].amount, 'Payment amount exceeds funds');
        funds[id] += msg.value;

        emit Fund(msg.sender, msg.value, id);
    }

    function withdraw(uint id, uint amount) public payable onlyPayer(msg.sender, id) {
        funds[id] -= amount;
        if (funds[id] < all_payments[id].amount) {
            contractDeactivatePayment(id);
        }

        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount, id);
    }
 

}