pragma solidity ^0.8.0;


contract Recur {

    struct Payment {
        uint id;
        address from;
        string label;
        address to;
        uint amount;
        uint last_pay;
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
    // keeps track of the funding for each payment the address created.
    mapping(address => mapping(uint => uint)) internal funds;

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
    event DepletedFunds(address from, uint paymentId);
    event Fund(address who, uint amount, uint paymentId);
    event Withdraw(address who, uint amount, uint paymentId);
    event ClaimPayments(address who, uint amount);
    event Transfer(address from, address to, uint amount, uint paymentId);


    function createPayment(address to, string memory label, uint amount, uint interval) public {
        require(amount > 0, 'amount must be greater than 0');
        require(msg.sender != to, 'Payer cannot be the payee');
        count += 1;

        Payment memory payment = Payment(count, msg.sender, label, to, amount, block.timestamp, interval, false);

        // add to outgoing array and incoming array
        incomingPayments[to].push(payment);
        outgoingPayments[msg.sender].push(payment);

        emit CreatePayment(msg.sender, to, label, amount, interval);
    }


    function deletePayment(uint id) public paymentExists(id) onlyPayer(msg.sender, id) {
        // transfer funds back to the sender
        uint amount = funds[msg.sender][id];
        delete funds[msg.sender][id];
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

    function contractDeactivatePayment(uint id) public paymentExists(id) paymentIsActive(id) {
        all_payments[id].active = false;

        emit DeactivatePayment(msg.sender, id);
    }

    // so that the payer can deactivate payment and also the contract when funds get depleted
    function UserDeactivatePayment(uint id) public paymentExists(id) onlyPayer(msg.sender, id) {
        contractDeactivatePayment(id);
    }
    
    function activatePayment(uint id) private paymentExists(id) {
        require(funds[msg.sender][id] >= all_payments[id].amount, 'Payment amount exceeds funds');
        all_payments[id].active = true;

        emit ActivatePayment(msg.sender, id);
    }

    function getNumOutgoingPayments(address who) public view returns (uint) {
        return outgoingPayments[who].length;
    }

    function getNumIncomingPayments(address who) public view returns (uint) {
        return incomingPayments[who].length;
    }

    // determine how much funds are available to collect from an incoming payment by id
    function getUnclaimedFundsById(uint id, address payee) public view paymentExists(id) paymentIsActive(id) returns (uint) {
        for (uint i=0; i < incomingPayments[payee].length; i++) {
            if (incomingPayments[payee][i].id == id) {
                // calculate how much funds payee is entitled to collect now an return
            }
        }
        return 0;
    }

    // determine how much funds are available to collect from all incoming payments
    function getAllUnclaimedFunds() public view returns (uint) {
        uint fundsToCollect = 0;
        for (uint i=0; i < incomingPayments[msg.sender].length; i++) {
            fundsToCollect += getUnclaimedFundsById(incomingPayments[msg.sender][i].id, msg.sender);
        }

        return fundsToCollect;
    }

    // need to collect each funds separately because for each payment the funder is different.
    function collectFundsById(uint id) public payable paymentExists(id) paymentIsActive(id) onlyPayee(msg.sender, id) {
        // requires

        // update funds

        // Check if funds not > amount after the transfer, emit depletedfunds event and deactivate payment

        // call to transfer

        // emit Transfer
    }

    function collectAllFunds() public {
        for (uint i=0; i < incomingPayments[msg.sender].length; i++) {
            collectFundsById(incomingPayments[msg.sender][i].id);
        }
        uint allClaimableFunds = getAllUnclaimedFunds();

        emit ClaimPayments(msg.sender, allClaimableFunds);
    }


    function fund(uint id) public payable onlyPayer(msg.sender, id) {
        require(funds[msg.sender][id] + msg.value >= all_payments[id].amount, 'Payment amount exceeds funds');
        funds[msg.sender][id] += msg.value;

        emit Fund(msg.sender, msg.value, id);
    }

    function withdraw(uint id, uint amount) public payable onlyPayer(msg.sender, id) {
        funds[msg.sender][id] -= amount;
        if (funds[msg.sender][id] < all_payments[id].amount) {
            contractDeactivatePayment(id);
        }

        payable(msg.sender).transfer(amount);
        emit Withdraw(msg.sender, amount, id);
    }
 

}