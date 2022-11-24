const { expectRevert, time } = require('@openzeppelin/test-helpers');

const chai = require('chai');

const Recur = artifacts.require('Recur.sol');

const ONE_DAY = 60*60*24;

contract("Recur", addresses => {
    let contractInstance;
    const[payer, payee] = addresses;

    beforeEach(async() => {
        contractInstance = await Recur.new();

        await contractInstance.createPayment(payee, "bill 1", web3.utils.toWei("1", "ether"), ONE_DAY, {from:payer});

        await contractInstance.createPayment(payee, "bill 2", web3.utils.toWei("2", "ether"), ONE_DAY*30, {from:payer});
    });

    it("should create payment", async() => {

        let payment = await contractInstance.all_payments(1);
        let payment2 = await contractInstance.all_payments(2);

        chai.assert.equal(web3.utils.fromWei(payment.amount, "ether"), 1);
        chai.assert.equal(payment.interval, ONE_DAY);
        chai.assert.equal(web3.utils.fromWei(payment2.amount, "ether"), 2);
        chai.assert.equal(payment2.label, "bill 2");

        // expectRevert did not work for me and it was too time consuming
        // to check for a solution so I decided to check manually for 
        // correct reverts in truffle console

    });

    it("should add to outgoing and incoming payments", async() => {

        let outgoing = await contractInstance.outgoingPayments(payer, 0);
        chai.assert.equal(outgoing.from, payer);
        let incoming = await contractInstance.incomingPayments(payee, 0);
        chai.assert.equal(incoming.from, payer);

        outgoing = await contractInstance.outgoingPayments(payer, 1);
        chai.assert.equal(web3.utils.fromWei(outgoing.amount, "ether"), 2);
        incoming = await contractInstance.incomingPayments(payee, 1);
        chai.assert.equal(web3.utils.fromWei(incoming.amount, "ether"), 2);


        // should return how many outgoing and incoming
        let outgoingLength = await contractInstance.getNumOutgoingPayments(payer);
        chai.assert.equal(outgoingLength, 2);
        let incomingLength = await contractInstance.getNumIncomingPayments(payee);
        chai.assert.equal(incomingLength, 2);
    });

    // it('should fund payment', async() => {

    // });
    
    // it("should withdraw funds", async() => {

    // });

    // it("should deactivate payment if funds get depleated", async() => {
    //     // when payee collects the funds
    //     // when payer withdraws funds 

    // });

    // it("should deactivate payment if the payer wishes to", async() => {

    // });

    // it("should refund payment and reactivate it if the payer wishes to", async() => {

    // });

    // it("should delete payment", async() => {

    // });

    // it("should not delete payment if not the payer", async() => {

    // });

    // it("should not activate payment if not the payer", async() => {

    // });

    // it("should not deactivate payment if not payer", async() => {

    // });

    // it("should get sum of unclaimed funds for a specific payment", async() => {

    // });

    // it("should get all unclaimed funds for payee", async() => {

    // });

    // it("should collect available funds and transfer to payee", async() => {

    // });

});