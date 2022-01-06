const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const chai = require('chai');

const Payment = artifacts.require('Payment.sol');

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
            to: payment.address,
            value: '100'
        });
        var funding = await payment.funding(payer);
        assert(funding.toNumber() === 100);
    });

    it('should withdraw funds', async () => {
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.address,
            value: '100'
        });
        await payment.withdraw(90, {from:payer});
        var funding = await payment.funding(payer);
        chai.assert.equal(funding.toNumber(), 10);
    });

    it('should suspend and resume payment', async () => {
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.address,
            value: '100'
        });
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        await payment.suspendPayment(0);
        await expectRevert(payment.executePayment(payer, 0), 'payment is deactivated');

        await time.increase(ONE_DAY)
        await payment.resumePayment(0);
        await expectRevert(payment.executePayment(payer, 0), 'payment is not due yet');
    });

    it('should cancel payment', async () => {
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        await payment.cancelPayment(0);
        await expectRevert(payment.cancelPayment(0), 'payment does not exist');
    });

    it('should fail to cancel payment', async () => {
        await expectRevert(payment.cancelPayment(0), 'payment does not exist');
    });

    it('should create payments', async () => {
        // create first payment
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        var created = await payment.created(payer);
        chai.assert.equal(created.toNumber(), 1);
        // cancel should succeed if payment exists
        await payment.cancelPayment(0);

        // create second payment
        await payment.createPayment(payee, 100, ONE_DAY, {from:payer});
        created = await payment.created(payer);
        chai.assert.equal(created.toNumber(), 2);
        await payment.cancelPayment(1);
    });

    it('should fail to create payment', async () => {
        await expectRevert(payment.createPayment(payee, 0, ONE_DAY, {from:payer}), 'amount must be greater than 0');
        await expectRevert(payment.createPayment(payee, 100, 0, {from:payer}), 'frequency must be greater than 0');
    });

    it('payee should receive payment', async () => {
        // fund the contract
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.address,
            value:  '100'
        });
        await payment.createPayment(payee, 10, ONE_DAY, {from:payer});

        // mock the passage of time - one day
        await time.increase(ONE_DAY)
        //get balance of payee before the transfer
        var balance = await web3.eth.getBalance(payee);

        await payment.executePayment(payer, 0);
        var new_balance = await web3.eth.getBalance(payee);
        // compare the balance from before to after the transfer
        chai.assert.equal(new_balance == parseInt(balance)+10);
        chai.assert.equal(await payment.funding(payer), 90);

        // payee can call the function over and over until last_pay + frequency catches up with block.timestamp
        // time passage of three days
        var days = 3;
        await time.increase(ONE_DAY*days);
        for(var i = 0; i < 3; i++){
            try {
                await payment.executePayment(payer, 0);
            } catch (error) {
                throw new Error("calling executePayment consecutively faild\nreason: "+error);
            }
        }

        balance = await web3.eth.getBalance(payee);
        chai.assert.equal(balance == parseInt(new_balance)+10*days);
        chai.assert.equal(await payment.funding[payer], 90-10*days);

    });

    it('payee should fail to receive payment', async () => {

        // fund the contract
        await web3.eth.sendTransaction({
            from: payer,
            to: payment.address,
            value: '100'
        });
        await payment.createPayment(payee, 110, ONE_DAY, {from:payer});
        await expectRevert(payment.executePayment(payer, 0), 'amount exceeds funds');

        await payment.createPayment(payee, 10, ONE_DAY, {from:payer});
        // suspend payment
        await payment.suspendPayment(1);
        await expectRevert(payment.executePayment(payer, 1), 'payment is deactivated');

        await payment.resumePayment(1);
        await expectRevert(payment.executePayment(payer, 1), 'payment is not due yet');

        await expectRevert(payment.executePayment(payer, 2), 'payment does not exist');

    
    });
});