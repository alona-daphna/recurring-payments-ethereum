const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
// expectRevert did not work for me and it was too time consuming
// to check for a solution so I decided to check manually for 
// correct reverts in truffle console

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

    // it("should create payment", async() => {

    //     let payment = await contractInstance.all_payments(1);
    //     let payment2 = await contractInstance.all_payments(2);

    //     chai.assert.equal(web3.utils.fromWei(payment.amount, "ether"), 0.001);
    //     chai.assert.equal(payment.interval, ONE_DAY);
    //     chai.assert.equal(web3.utils.fromWei(payment2.amount, "ether"), 0.002);
    //     chai.assert.equal(payment2.label, "bill 2");

    // });

    // it("should add to outgoing and incoming payments", async() => {

    //     let outgoing = await contractInstance.outgoingPayments(payer, 0);
    //     chai.assert.equal(outgoing.from, payer);
    //     let incoming = await contractInstance.incomingPayments(payee, 0);
    //     chai.assert.equal(incoming.from, payer);

    //     outgoing = await contractInstance.outgoingPayments(payer, 1);
    //     chai.assert.equal(web3.utils.fromWei(outgoing.amount, "ether"), 0.002);
    //     incoming = await contractInstance.incomingPayments(payee, 1);
    //     chai.assert.equal(web3.utils.fromWei(incoming.amount, "ether"), 0.002);


    //     // should return how many outgoing and incoming
    //     let outgoingLength = await contractInstance.getNumOutgoingPayments(payer);
    //     chai.assert.equal(outgoingLength, 2);
    //     let incomingLength = await contractInstance.getNumIncomingPayments(payee);
    //     chai.assert.equal(incomingLength, 2);
    // });

    // it('should fund payment', async() => {
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("0.003", "ether")});
    //     let fund = await contractInstance.funds(1);
    //     chai.assert.equal(web3.utils.fromWei(fund, "ether"), 0.003);
        
    // });
    
    // it("should withdraw funds", async() => {
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("0.003", "ether")});
    //     await contractInstance.withdraw(1, web3.utils.toWei("0.001", "ether"), {from: payer});
    //     let fund = await contractInstance.funds(1);
    //     chai.assert.equal(web3.utils.fromWei(fund, "ether"), 0.002);

    // });

    // it("should activate payment", async() => {
    //     await contractInstance.fund(1, {from:payer, value:web3.utils.toWei("0.002", "ether")});
    //     let payment = await contractInstance.all_payments(1);
    //     chai.assert.equal(payment.active, false);
    //     await contractInstance.activatePayment(1, {from: payer});
    //     payment = await contractInstance.all_payments(1);
    //     chai.assert.equal(payment.active, true);
    // });

    // it("should deactivate payment if fund gets depleated", async() => {
    //     // when payee collects the funds
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(1, {from: payer});
    //     await time.increase(ONE_DAY*2);
    //     await contractInstance.collectAllFunds({from: payee});
    //     let payment = await contractInstance.outgoingPayments(payer, 0);
    //     chai.assert.equal(payment.active, false);


    //     // when payer withdraws funds 
    //     await contractInstance.fund(2, {from: payer, value:web3.utils.toWei("0.002", "ether")});
    //     await contractInstance.activatePayment(2, {from: payer});

    //     await contractInstance.withdraw(2, web3.utils.toWei("0.001", "ether"), {from: payer});
    //     let payment = await contractInstance.all_payments(2);
    //     chai.assert.equal(payment.active, false);

    // });

    // it("should transfer claimable funds to payee when payment gets deactivated", async() => {
        
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(1, {from: payer});
    //     // wait one day
    //     await time.increase(ONE_DAY);


    //     let balanceBefore = await web3.eth.getBalance(payee);

    //     await contractInstance.deactivatePayment(1, {from: payer});

    //     let balanceAfter = await web3.eth.getBalance(payee);

    //     chai.assert.equal(web3.utils.fromWei(balanceAfter, "ether"), Number(web3.utils.fromWei(balanceBefore, "ether")) + 1);

    // });

    
    // it("should refund payment and reactivate it if the payer wishes to", async() => {
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(1, {from: payer});
    //     await time.increase(ONE_DAY*2);
    //     await contractInstance.collectAllFunds({from: payee});
    //     let payment = await contractInstance.outgoingPayments(payer, 0);
    //     chai.assert.equal(payment.active, false);

    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(1, {from: payer});
    //     let funds = await contractInstance.funds(1);
    //     chai.assert.equal(web3.utils.fromWei(funds, "ether"), 2);
    // });

    // it("should get all unclaimed funds for payee", async() => {
    //     await contractInstance.fund(1, {from: payer, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(1, {from: payer});

    //     await contractInstance.fund(3, {from: payer2, value:web3.utils.toWei("2", "ether")});
    //     await contractInstance.activatePayment(3, {from: payer2});

        
    //     await time.increase(ONE_DAY*10);

    //     let {0: claimable} = await contractInstance.getUnclaimedFundsById(1);
    //     let {0: claimable2} = await contractInstance.getUnclaimedFundsById(3);

    //     chai.assert.equal(web3.utils.fromWei(claimable), 2);
    //     chai.assert.equal(web3.utils.fromWei(claimable2), 1.5);



    //     await contractInstance.collectAllFunds({from: payee});

    //     // emits transfer with the correct amount

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

});