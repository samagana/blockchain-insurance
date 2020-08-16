var SimpleStorage = artifacts.require("../contracts/SimpleStorage.sol");
var Insurance = artifacts.require("../contracts/Insurance.sol")

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Insurance, accounts[1], { from:accounts[0] });
};
