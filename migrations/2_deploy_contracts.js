var PropertyNFT = artifacts.require("../contracts/PropertyNFT.sol");
module.exports = function(deployer) {
  deployer.deploy(PropertyNFT);
};