pragma solidity ^0.8.0;

/* Recurring payments on the ethereum blockchain */

contract Payment {

    struct Payment {
        address to;
        uint amount;
        uint last_pay; // in seconds, epoch
        uint frequency; //the period in seconds between payments
        bool active; // user can suspend payment
    }

    // payer => (payment id => Payment struct)
    // id starts from 0 and gets incremented by one each time payer creates a new payment
    mapping(address => mapping(uint => Payment)) all_payments;
    // Maps address to the amount with which the address funded the contract
    mapping(address => uint) funding;
    // maps address to number of payments the address created and still exist
    mapping(address => uint) created;

    modifier paymentExists(uint id) {
        require(all_payments[msg.sender][id], 'payment does not exist');
        _;
    }

    event PaymentCreated(address from, address to, uint amount, uint frequency);
    event PaymentCancelled(address cancler, uint id, uint when);
    event PaymentSuspended(address suspender, uint id, uint when);
    event PaymentResumed(address suspender, uint id, uint when);
    event PaymentSent(address from, address to, uint amount);


    // When user creates a new payment
    // frequency = in seconds, for ex. daily = 60 * 60 * 24
    function createPayment(address to, uint amount, uint frequency) external view {
        require(amount > 0, 'amount must be greater than 0');

        // if msg.sender's first payment
        if(!all_payments[msg.sender][0]) {
            executePayment(msg.sender, to, amount, 0);

            // create a new Payment struct
            new_payment = Payment(
                to,
                amount,
                block.timestamp, // last_pay
                frequency,
                true // active
                );

            all_payments[msg.sender][0] = new_payment; // add struct to mapping
            created[msg.sender] = 1; // increment number of payments msg.sender has created by one
            
        } 
        else {
             payment_id = created[msg.sender];
             executePayment(msg.sender, to amount, payment_id);

             // create a new Payment struct
            new_payment = Payment(
                to,
                amount,
                block.timestamp, // last_pay
                frequency,
                true // active
                );

             all_payments[msg.sender][payment_id] = new_payment; // add struct to mapping
             created[msg.sender] += 1; // increment number of payments msg.sender has created by one
        }

    }

    // add modifiers if it gets repeatitive with the require statements

    function executePayment(address from, address to , uint amount, uint id) public view paymentExists(id) returns (bool) {
        // get payment struct
        payment = all_payments[from][id];

        require(payment.active, 'payment is deactivated');
        require(block.timestamp >= payment.frequency + payment.last_pay, 'payment is not due yet');

        to.transfer(amount);

        emit PaymentSent(msg.sender, to, amount);

        // set the time for the next payment
        payment.last_pay = payment.last_pay + frequency;

        return true;
    }

    function cancelPayment(uint id) external view paymentExists(id) {
        // iterate until payment to be deleted and  
        for(uint i = 0; i < created[msg.sender]; i++) {
            if(i == id){
                delete all_payments[msg.sender][id];
                for (uint index = i; index < created[msg.sender]-1; index++) {
                    all_payments[msg.sender][index] = all_payments[msg.sender][index+1];
                }
                break;
            }
        }
        created[msg.sender] -= 1;

        emit PaymentCancelled(msg.sender, id, block.timestamp);
    }

    // params: payment id
    function suspendPayment(uint id) external view paymentExists(id) {
        all_payments[msg.sender][id].active = false;
        emit PaymentSuspended(msg.sender, id, block.timestamp);
    }

    function resumePayment(uint id) external view paymentExists(id) {
        all_payments[msg.sender][id].active = true;
        emit PaymentResumed(msg.sender, id, block.timestamp);
    }

    function withdraw(uint amount) external view {
        require(amount <= funding[msg.sender], 'amount to withdraw is greater than funds');
        msg.sender.transfer(amount);
    }

    receive() external payable {
        funding[msg.sender] += msg.value;
    }

}
