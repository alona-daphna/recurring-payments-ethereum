const { expectRevert, time } = require('@openzeppelin/test-helpers');
const chai = require('chai');

const Payment = artifacts.require('Payment.sol');

const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:9545'));

const ONE_DAY = 60*60*24;

contract('Payment', addresses => {
    let payment;
    const [payer, payee] = addresses;

    beforeEach(async () => {
        payment = await Payment.new();
    });

    it('should fund the contract', async () => {
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.options.address,
            value: '100'
        });
        chai.assert.equal(payment.funding[payer], 100);
    });
    
    it('should withdraw funds', async () => {
        await payment.withdraw(90, {from:payer});
        chai.assert.equal(payment.funding[payer], 10);
    });

    it('should suspend and resume payment', async () => {
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        chai.assert.equal(await payment.all_payments[payer][0].active, true);
        await payment.suspendPayment(0);
        chai.assert.equal(await payment.all_payments[payer][0].active, false);
        await payment.resumePayment(0);
        chai.assert.equal(await payment.all_payments[payer][0].active, true);
    });

    it('should cancel payment', async () => {
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        await payment.cancelPayment(0);
        chai.assert.equal(await payment.all_payments[payer][0].amount, 0);

        // create a payment after one was deleted
        await payment.createPayment(payee, 50, ONE_DAY, {from:payer});
        chai.assert.equal(await payment.created[payer], 2);
        chai.assert.equal(await payment.all_payment[payer][1].amount, 50);
    });

    it('should create payments', async () => {
        // create first payment
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        chai.assert.equal(await payment.created[payer], 1);
        chai.assert.equal(await payment.all_payment[payer][0].amount, 100);

        // create second payment
        await payment.createPayment(payee, 50, ONE_DAY, {from:payer});
        chai.assert.equal(payment.created[payer], 2);
        chai.assert.equal(payment.all_payment[payer][1].amount, 50);

    });

    it('should fail to create payment', async () => {
        await expectRevert(payment.createPayment(payee, 0, ONE_DAY, {from:payer}), 'amount must be greater than 0');
        await expectRevert(payment.createPayment(payee, 100, 0, {from:payer}), 'frequency must be greater than 0');
    });

    it('payee should receive payment', async () => {
        // fund the contract
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.options.address,
            value: '100'
        });
        await payment.createPayment(payee, 10, ONE_DAY, {from:payer});

        // mock the passage of time - one day
        await time.increase(ONE_DAY)
        //get balance of payee before the transfer
        var balance = payee.getBalance();
        await payment.executePayment(payer, 0);
        // compare the balance from before to after the transfer
        chai.assert.equal(payee.getBalance(), balance+10);
        chai.assert.equal(payment.funding[payer], 90);

        // payee can call the function over and over until last_pay + frequency catches up with block.timestamp
        // time passage of three days
        var days = 3, balance = payee.getBalance();
        await time.increase(ONE_DAY*days);
        for(var i = 0; i<days; i++){
            try {
                await payment.executePayment(payer, 0);
            } catch (error) {
                throw new Error("calling executePayment consecutively faild\nreason: "+error);
            }
        }
        chai.assert.equal(payee.getBalance(), balance+10*days);
        chai.assert.equal(payment.funding[payer], 90-10*days);

    });

    it('should fail to execute payment', async () => {

        // fund the contract
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.options.address,
            value: '100'
        });
        await payment.createPayment(payee, 110, ONE_DAY, {from:payer});
        await expectRevert(payment.executePayment(payer, 0), 'amount exceeds funds');

        // suspend payment
        await payment.suspendPayment(0);
        await expectRevert(payment.executePayment(payer, 0), 'payment is deactivated');

        await payment.resumePayment(0);
        await expectRevert(payment.executePayment(payer, 0), 'payment is not due yet');

        await expectRevert(payment.executePayment(payer, 1), 'payment does not exist');

    
    });
});