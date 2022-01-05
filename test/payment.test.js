const { time } = require('@openzeppelin/test-helpers');
const { assertion } = require('@openzeppelin/test-helpers/src/expectRevert');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const Payment = artifacts.require('Payment.sol');

const ONE_DAY = time.duration.days(1);
const ONE_WEEK = time.duration.weeks(1);

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
        assert(payment.methods.funding[payer] == 100);
    });
    
    it('should withdraw funds', async () => {

    });

    it('payee should receive payment', async () => {

    });

    it('should ', async () => {

    });

    it('should withdraw funds', async () => {

    });
});