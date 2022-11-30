const contract = artifacts.require("./Recur.sol");

module.exports = function (deployer) {
  deployer.deploy(contract);
};
