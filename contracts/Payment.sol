pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

/* Recurring payments on the ethereum blockchain */

contract Payment {

    struct Payment {
        address to;
        uint amount;
        uint last_pay; // in seconds, epoch
        uint frequency; //the period in seconds between payments, for ex. daily = 60 * 60 * 24
        bool active; // user can suspend payment
    }

    // payer => (payment id => Payment struct)
    // id starts from 0 and gets incremented by one each time payer creates a new payment
    mapping(address => mapping(uint => Payment)) public all_payments;
    // maps address to the amount with which the address funded the contract
    mapping(address => uint) public funding;
    // maps address to number of payments the address created, used as an id for payments
    mapping(address => uint) public created;
    // user => has created any payments
    mapping(address => bool) public has_payments;

    modifier paymentExists(address from, uint id) {
        require(all_payments[from][id].amount != 0, 'payment does not exist');
        _;
    }

    event PaymentCreated(address from, address to, uint amount, uint frequency);
    event PaymentCancelled(address cancler, uint id, uint when);
    event PaymentSuspended(address suspender, uint id, uint when);
    event PaymentResumed(address suspender, uint id, uint when);
    event PaymentSent(address from, address to, uint amount);


    function createPayment(address to, uint amount, uint frequency) external {
        require(amount > 0, 'amount must be greater than 0');
        require(frequency > 0, 'frequency must be greater than 0');

        // if msg.sender's first payment
        if(!has_payments[msg.sender]) {
            // create a new Payment struct
            Payment memory new_payment = Payment(to, amount, block.timestamp, frequency, true);

            all_payments[msg.sender][0] = new_payment; // add struct to mapping
            has_payments[msg.sender] = true;

            created[msg.sender] = 1; // set number of payments msg.sender has created to one
            
        } 
        else {
             uint payment_id = created[msg.sender];
            // create a new Payment struct
            Payment memory new_payment = Payment(to, amount, block.timestamp, frequency, true);

             all_payments[msg.sender][payment_id] = new_payment; // add struct to mapping
             created[msg.sender] += 1; // increment number of payments msg.sender has created by one
        }

    }

    function executePayment(address from, uint id) public payable paymentExists(from, id) returns (bool) {
        // get payment struct
        Payment storage payment = all_payments[from][id];
        require(payment.amount <= funding[from], 'amount exceeds funds');
        require(payment.active, 'payment is deactivated');
        require(block.timestamp >= payment.frequency + payment.last_pay, 'payment is not due yet');

        funding[from] -= payment.amount;
        payable(payment.to).transfer(payment.amount);
        emit PaymentSent(from, payment.to, payment.amount);

        // set the time for the next payment
        payment.last_pay = payment.last_pay + payment.frequency;

        return true;
    }

    function cancelPayment(uint id) external paymentExists(msg.sender, id) {
        delete all_payments[msg.sender][id];
        emit PaymentCancelled(msg.sender, id, block.timestamp);
    }

    function suspendPayment(uint id) external paymentExists(msg.sender, id) {
        all_payments[msg.sender][id].active = false;
        emit PaymentSuspended(msg.sender, id, block.timestamp);
    }

    function resumePayment(uint id) external paymentExists(msg.sender, id) {
        all_payments[msg.sender][id].active = true;
        emit PaymentResumed(msg.sender, id, block.timestamp);
    }

    // user withdraw funds
    function withdraw(uint amount) external payable {
        require(amount <= funding[msg.sender], 'amount to withdraw is greater than funds');
        funding[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
    }

    // user funds the contract
    receive() external payable {
        funding[msg.sender] += msg.value;
    }

    function isPaymentActive(uint id) external view returns (bool) {
        return all_payments[msg.sender][id].active;
    }
}
