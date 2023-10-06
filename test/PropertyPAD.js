const PropertyPAD = artifacts.require("PropertyPAD");
const PropertyNFT = artifacts.require("PropertyNFT");
const MockERC20 = artifacts.require("MockERC20"); // Assuming you have a mock ERC20 token for testing
const chalk = require('chalk');
const { advanceTime } = require('./advanceTime');

const truffleAssert = require('truffle-assertions');

async function assertRevert(promise) {
    await truffleAssert.reverts(promise);
}


contract("PropertyPAD", (accounts) => {
    let propertyPAD;
    let propertyNFT;
    let raiseToken;

    const admin = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const mintedtoken = 10000;
    const userpartecipation = 100;

    before(async () => {
         raiseToken = await MockERC20.new({ from: admin });
         propertyNFT = await PropertyNFT.new({ from: admin });
         propertyPAD = await PropertyPAD.new(propertyNFT.address, { from: admin });

    });

    it("should set PropertPAD as minter in the PropertyNFT contract", async () => {
        await propertyNFT.setMinter(propertyPAD.address);
        const minterAddress = await propertyNFT.minter();
        assert.equal(minterAddress, propertyPAD.address);

    });

    it("should set raise parameters correctly", async () => {
        await propertyPAD.setRaiseParameters(raiseToken.address, 100, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 3600, 10, 500, { from: admin });
        await propertyPAD.setPropertyAttributes("Los Angeles Mansion",1 ,5, 3, 1, { from: admin });
        const token = await propertyPAD.raiseToken();
        assert.equal(token, raiseToken.address);
        // ... check other parameters
    });

    it("should mint token to the user wallet to allow him to partecipate", async () => {
        await raiseToken.mint(user1, mintedtoken, {from: admin});
        const user1Balance = await raiseToken.balanceOf(user1);
        assert.equal(user1Balance,mintedtoken);
    })

    it("should allow users to participate in the raise", async () => {
        await raiseToken.approve(propertyPAD.address, userpartecipation, { from: user1 });
        await propertyPAD.participate(userpartecipation, { from: user1 });
        const contribution = await propertyPAD.userContributions(user1);
        assert.equal(contribution, userpartecipation);
        const user1Balance = await raiseToken.balanceOf(user1);
        assert.equal(user1Balance, ( mintedtoken - userpartecipation));
    });


    xit("should allow users to claim back tokens if raise is unsuccessful", async () => {
        await advanceTime(3601); 
        await propertyPAD.claimBack({ from: user1 });
        const contribution = await propertyPAD.userContributions(user1);
        assert.equal(contribution, 0, "User's contribution should be reset to 0");
        const user1Balance = await raiseToken.balanceOf(user1);
        assert.equal(user1Balance,( mintedtoken - userpartecipation));

    });

    it("should allow users to claim PropertyNFT if raise is successful", async () => {
        await advanceTime(3601); 
        await propertyPAD.claimPropertyNFT({ from: user1 });
        const contribution = await propertyPAD.userContributions(user1);
        assert.equal(contribution, 0, "User's contribution should be reset to 0");

        const balance = await propertyNFT.balanceOf(user1);
        assert.equal(balance, 1, "User should have 1 PropertyNFT");
        const property = await propertyNFT.properties(balance);

        console.log(chalk.bold("NFT Properties:"));
        console.log("------------------");
        console.log("Property Name:", property.propertyName);
        console.log("APR:", property.apr.toNumber());
        console.log("Total Property Raised:", property.totalPropertyRaised.toNumber());
        console.log("Property Participation:", property.propertyParticipation.toNumber());
        console.log("Property Percentage:", property.propertyParticipation.toNumber() / property.totalPropertyRaised.toNumber() *100 + "%");
        console.log("Launchpad ID:", property.propertyID.toNumber());
        console.log("Redeem Fees:", property.redeemFees.toNumber());
        console.log("Sell Fees:", property.sellFees.toNumber());
        console.log("Total Earned:", property.totalEarned.toNumber());
        console.log("------------------");


    });

    it("should not allow participation outside of the raise window", async () => {
        await propertyPAD.setRaiseParameters(raiseToken.address, 1000, Date.now() + 7200, Date.now() + 10800, 10, 500, { from: admin });
        await raiseToken.approve(propertyPAD.address, userpartecipation, { from: user1 });

        // This should fail since the raise hasn't started yet
        await assertRevert(propertyPAD.participate(userpartecipation, { from: user1 }));
    });

    it("should enforce contribution limits", async () => {
        await propertyPAD.setRaiseParameters(raiseToken.address, 1000, Date.now(), Date.now() + 3600, 10, 500, { from: admin });
        await raiseToken.approve(propertyPAD.address, 1000, { from: user1 });

        // Participation below min limit should fail
        await assertRevert(propertyPAD.participate(5, { from: user1 }));

        // Participation above max limit should fail
        await assertRevert(propertyPAD.participate(600, { from: user1 }));
    });

    it("should restrict admin-only functions", async () => {
        // This should fail since user1 is not the admin
        await assertRevert(propertyPAD.setRaiseParameters(raiseToken.address, 1000, Date.now(), Date.now() + 3600, 10, 500, { from: user1 }));
    });



});