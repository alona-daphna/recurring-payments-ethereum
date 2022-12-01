const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const truffleAssert = require('truffle-assertions');

const chai = require('chai');

const Recur = artifacts.require('Recur.sol');

const ONE_DAY = 60*60*24;

contract("Recur", addresses => {
    let contractInstance;
    const[payer, payee, payer2] = addresses;

    beforeEach(async() => {
        contractInstance = await Recur.new();

        await contractInstance.createPayment(payee, "bill 1", web3.utils.toWei("1", "ether"), ONE_DAY, {from:payer});
        await contractInstance.createPayment(payee, "bill 2", web3.utils.toWei("2", "ether"), ONE_DAY*30, {from:payer});
        await contractInstance.createPayment(payee, "bill 2", web3.utils.toWei("1.5", "ether"), ONE_DAY*5, {from:payer2});
    });

    it("should create payment", async() => {

        let payment = await contractInstance.all_payments(1);
        let payment2 = await contractInstance.all_payments(2);

        chai.assert.equal(web3.utils.fromWei(payment.amount, "ether"), 1);
        chai.assert.equal(payment.interval, ONE_DAY);
        chai.assert.equal(web3.utils.fromWei(payment2.amount, "ether"), 2);
        chai.assert.equal(payment2.label, "bill 2");

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
        chai.assert.equal(incomingLength, 3);
    });

    it('should fund payment', async() => {
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("3", "ether")});
        let fund = await contractInstance.funds(1);
        chai.assert.equal(web3.utils.fromWei(fund, "ether"), 3);
        
    });
    
    it("should withdraw funds", async() => {
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("3", "ether")});
        await contractInstance.withdraw(1, web3.utils.toWei("1", "ether"), {from: payer});
        let fund = await contractInstance.funds(1);
        chai.assert.equal(web3.utils.fromWei(fund, "ether"), 2);

    });

    it("should activate payment", async() => {
        await contractInstance.fund(1, {from:payer, value:web3.utils.toWei("2", "ether")});
        let payment = await contractInstance.all_payments(1);
        chai.assert.equal(payment.active, false);
        await contractInstance.activatePayment(1, {from: payer});
        payment = await contractInstance.all_payments(1);
        chai.assert.equal(payment.active, true);
    });

    it("should deactivate payment if fund gets depleated", async() => {
        // when payee collects the funds
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(1, {from: payer});
        await time.increase(ONE_DAY*2);
        await contractInstance.collectAllFunds({from: payee});
        let payment = await contractInstance.outgoingPayments(payer, 0);
        chai.assert.equal(payment.active, false);


        // when payer withdraws funds 
        await contractInstance.fund(2, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(2, {from: payer});

        await contractInstance.withdraw(2, web3.utils.toWei("1", "ether"), {from: payer});
        payment = await contractInstance.all_payments(2);
        chai.assert.equal(payment.active, false);

    });

    it("should transfer claimable funds to payee when payment gets deactivated", async() => {
        
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(1, {from: payer});
        // wait one day
        await time.increase(ONE_DAY);


        let balanceBefore = await web3.eth.getBalance(payee);

        await contractInstance.deactivatePayment(1, {from: payer});

        let balanceAfter = await web3.eth.getBalance(payee);

        chai.assert.equal(web3.utils.fromWei(balanceAfter, "ether"), Number(web3.utils.fromWei(balanceBefore, "ether")) + 1);

    });

    
    it("should refund payment and reactivate it if the payer wishes to", async() => {
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(1, {from: payer});
        await time.increase(ONE_DAY*2);
        await contractInstance.collectAllFunds({from: payee});
        let payment = await contractInstance.outgoingPayments(payer, 0);
        chai.assert.equal(payment.active, false);

        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(1, {from: payer});
        let funds = await contractInstance.funds(1);
        chai.assert.equal(web3.utils.fromWei(funds, "ether"), 2);
    });

    it("should not activate payment if fund is insufficient", async() => {
        await expectRevert(contractInstance.activatePayment(1, {from: payer}), 'Payment amount exceeds funds');

    });

    it("should get all unclaimed funds for payee", async() => {
        await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(1, {from: payer});

        await contractInstance.fund(3, {from: payer2, value:web3.utils.toWei("2", "ether")});
        await contractInstance.activatePayment(3, {from: payer2});

        
        await time.increase(ONE_DAY*10);

        let {0: claimable} = await contractInstance.getUnclaimedFundsById(1);
        let {0: claimable2} = await contractInstance.getUnclaimedFundsById(3);

        chai.assert.equal(web3.utils.fromWei(claimable), 2);
        chai.assert.equal(web3.utils.fromWei(claimable2), 1.5);


        let tx = await contractInstance.collectAllFunds({from: payee});

        truffleAssert.eventEmitted(tx, 'Transfer', (ev) => {
            return ev.to == payee && web3.utils.fromWei(ev.amount, 'ether') ==  3.5
        });

    });

    it("should delete payment", async() => {
        await contractInstance.deletePayment(1, {from: payer});
        await expectRevert(contractInstance.activatePayment(1, {from: payer}),
        'payment does not exist');

    });

    it("should not be allowed to do that if not payer", async() => {
        await expectRevert(contractInstance.activatePayment(1, {from: payee}), 'Only payer can do that');
        await expectRevert(contractInstance.deactivatePayment(1, {from: payee}), 'Only payer can do that');
        await expectRevert(contractInstance.deletePayment(1, {from: payee}), 'Only payer can do that');
    });

});