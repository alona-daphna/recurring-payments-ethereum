const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const chai = require('chai');

const Recur = artifacts.require('Recur.sol');

contract("Recur", addresses => {
    let contractInstance;
    const[payer, payee] = addresses;

    beforeEach(async() => {
        contractInstance = await Recur.new();
    });

    it("should create payment", async() => {
        // also assert should fail
    });

    it('should fund payment', async() => {

    });
    
    it("should withdraw funds", async() => {

    });

    it("should deactivate payment if funds get depleated", async() => {
        // when payee collects the funds
        // when payer withdraws funds 

    });

    it("should deactivate payment if the payer wishes to", async() => {

    });

    it("should refund payment and reactivate it if the payer wishes to", async() => {

    });

    it("should delete payment", async() => {

    });

    it("should not delete payment if not the payer", async() => {

    });

    it("should not activate payment if not the payer", async() => {

    });

    it("should not deactivate payment if not payer", async() => {

    });

    it("should get sum of unclaimed funds for a specific payment", async() => {

    });

    it("should get all unclaimed funds for payee", async() => {

    });

    it("should collect available funds and transfer to payee", async() => {

    });

    it("should add to outgoing and incoming payments", async() => {
        // should return how many outgoing and incoming
    });

});