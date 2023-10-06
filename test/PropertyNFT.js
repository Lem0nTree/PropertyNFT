const chalk = require('chalk');

const PropertyNFT = artifacts.require("PropertyNFT");
const MockERC20 = artifacts.require("MockERC20"); 


const propertyNames = ["LosAngeles", "LosAngeles", "NewYork"];
const apr = [30, 30, 10];
const totalPropertyRaised = [100000, 100000, 50000];
const propertyParticipation = [50000, 1000, 10000];
const propertyID = [1, 1, 2];
const redeemFees = [10, 10, 15];
const sellFees = [5, 5, 3];
const totalEarned = [0, 0, 0];


contract("PropertyNFT", (accounts) => {
    let [alice, bob, charlie, delta, enea] = accounts;
    let contractInstance;
    let mockUSDT;
    const USDT_AMOUNT = 1000; // Example value


    before(async () => {
        console.log(chalk.bgBlue("---- STARTING TESTS ----"));
        contractInstance = await PropertyNFT.new({from: alice});
        console.log("Contract Address:",contractInstance.address);
        mockUSDT = await MockERC20.new(); // Deploy the mock token
        // console.log("MockUSDT Address:",mockUSDT.address);
        // const tokenDecimals = await mockUSDT.decimals();
        // console.log("MockUSDT Decimals:", tokenDecimals.toString());
        await mockUSDT.mint(delta, 1000); // Mint some mock USDT tokens to delta  
        // const deltaBalance = await mockUSDT.balanceOf(delta);
        // console.log("MockUSDT Balance:",deltaBalance.toString());


  
    });


    it(chalk.red.green("should check Alice as the admin"), async () => {
        const admin = await contractInstance.admin();
        assert.equal(admin, alice);
    });

    it(chalk.green("should allow Alice to assign roles and verify"), async () => {
        await contractInstance.setMinter(bob, {from: alice});
        const currentMinter = await contractInstance.minter();
        assert.equal(currentMinter, bob);

        await contractInstance.setRedeemer(charlie, {from: alice});
        const currentRedeemer = await contractInstance.redeemer();
        assert.equal(currentRedeemer, charlie);

        await contractInstance.setOperator(delta, {from: alice});
        const currentOperator = await contractInstance.operator();
        assert.equal(currentOperator, delta);
    });




    it(chalk.green("should allow Bob to mint a new property and verify"), async () => {
        await contractInstance.mintProperty(
            bob, propertyNames[0], apr[0], totalPropertyRaised[0], 
            propertyParticipation[0], propertyID[0], redeemFees[0], 
            sellFees[0], totalEarned[0], {from: bob}
        );
        
        const tokenId = await contractInstance.totalSupply();
        const property = await contractInstance.properties(tokenId);

        // console.log(chalk.bold("NFT Properties:"));
        // console.log("------------------");
        // console.log("Property Name:", property.propertyName);
        // console.log("APR:", property.apr.toNumber());
        // console.log("Total Property Raised:", property.totalPropertyRaised.toNumber());
        // console.log("Property Participation:", property.propertyParticipation.toNumber());
        // console.log("Property Percentage:", property.propertyParticipation.toNumber() / property.totalPropertyRaised.toNumber() *100 + "%");
        // console.log("Launchpad ID:", property.propertyID.toNumber());
        // console.log("Redeem Fees:", property.redeemFees.toNumber());
        // console.log("Sell Fees:", property.sellFees.toNumber());
        // console.log("Total Earned:", property.totalEarned.toNumber());
        // console.log("------------------");

        assert.equal(property.propertyName, propertyNames[0]);
        assert.equal(property.apr.toNumber(), apr[0]);
        assert.equal(property.totalPropertyRaised.toNumber(), totalPropertyRaised[0]);
        assert.equal(property.propertyParticipation.toNumber(), propertyParticipation[0]);
        assert.equal(property.propertyID.toNumber(), propertyID[0]);
        assert.equal(property.redeemFees.toNumber(), redeemFees[0]);
        assert.equal(property.sellFees.toNumber(), sellFees[0]);
        assert.equal(property.totalEarned.toNumber(), totalEarned[0]);
    });

    it(chalk.green("should mint a new NFT from same launchpad to enea"), async () => {
        await contractInstance.mintProperty(
            enea, propertyNames[1], apr[1], totalPropertyRaised[1], 
            propertyParticipation[1], propertyID[1], redeemFees[1], 
            sellFees[1], totalEarned[1], {from: bob}
        );
        const tokenId = await contractInstance.totalSupply();
        const property = await contractInstance.properties(tokenId);

        // console.log(chalk.bold("NFT Properties:"));
        // console.log("------------------");
        // console.log("Property Name:", property.propertyName);
        // console.log("APR:", property.apr.toNumber());
        // console.log("Total Property Raised:", property.totalPropertyRaised.toNumber());
        // console.log("Property Participation:", property.propertyParticipation.toNumber());
        // console.log("Property Percentage:", property.propertyParticipation.toNumber() / property.totalPropertyRaised.toNumber() *100 + "%");
        // console.log("Launchpad ID:", property.propertyID.toNumber());
        // console.log("Redeem Fees:", property.redeemFees.toNumber());
        // console.log("Sell Fees:", property.sellFees.toNumber());
        // console.log("Total Earned:", property.totalEarned.toNumber());
        // console.log("------------------");

        const NFTOwner = await contractInstance.ownerOf(2);
        assert.equal(NFTOwner, enea, "enea should be the owner of NFT id 1");
    });




    it(chalk.green("should verify Bob is holding 1 NFT"), async () => {
        const bobNFTBalance = await contractInstance.balanceOf(bob);
        assert.equal(bobNFTBalance.toNumber(), 1, "Bob should hold exactly 1 NFT");
    });


    it(chalk.green("should verify who is the owner of NFT id"), async () => {
        const NFTOwner = await contractInstance.ownerOf(1);
        assert.equal(NFTOwner, bob, "Bob should be the owner of NFT id 0");
    });


    it(chalk.green("should get tokenIDs for same launchpad who generated the NFTs"), async () => {
        const tokensForLaunchpad1  = await contractInstance.getTokensBypropertyID(1);
        assert.equal(tokensForLaunchpad1.length, 2, "Should have 2 tokens for launchpad ID 1");
        // console.log("Tokens for Launchpad ID 1:", tokensForLaunchpad1.map(id => id.toNumber()));
        const convertedTokens = tokensForLaunchpad1.map(id => id.toNumber());
        assert.equal(convertedTokens[0], 1, "Token ID 1 should be included for launchpad ID 1");
        assert.equal(convertedTokens[1], 2, "Token ID 2 should be included for launchpad ID 1");
    
    });

    it(chalk.green("should distribuite USDT rewards based on users partecipation from operator's wallet"), async () => {
        
        // Approve the contract to spend USDT from delta
        await mockUSDT.approve(contractInstance.address, USDT_AMOUNT, {from: delta});
        // const allowance = await mockUSDT.allowance(delta, contractInstance.address);
        // console.log("Allowance set for contract:", allowance.toString());
        // const deltaBalanceBefore = await mockUSDT.balanceOf(delta);
        // console.log("Delta's balance before distributing rewards:", deltaBalanceBefore.toString());

        
        // Distribute rewards
        const result = await contractInstance.distributeRewards(1, USDT_AMOUNT, mockUSDT.address, {from: delta});

        // Verify USDT balances and totalEarned for each NFT
        const bobBalance = await mockUSDT.balanceOf(bob);
        const eneaBalance = await mockUSDT.balanceOf(enea);
        
        // Calculate expected rewards based on the NFT properties and the provided formula
        const bobExpectedReward = (USDT_AMOUNT / 100000) * 50000;
        const eneaExpectedReward = (USDT_AMOUNT / 100000) * 1000;
        // console.log ("BobExpected Reward", bobExpectedReward);
        // console.log ("EneaExpected Reward", eneaExpectedReward);
        assert.equal(bobBalance.toString(), bobExpectedReward.toString(), "Bob did not receive the correct amount of USDT");
        assert.equal(eneaBalance.toString(), eneaExpectedReward.toString(), "Enea did not receive the correct amount of USDT");
        // console.log ("Bob Balance", bobBalance.toString());
        // console.log ("Enea Balance", eneaBalance.toString());
        
        // Verify the totalEarned for each NFT
        const bobProperty = await contractInstance.properties(1); // Assuming the first minted token has ID 1
        const eneaProperty = await contractInstance.properties(2); // Assuming the second minted token has ID 2

        assert.equal(bobProperty.totalEarned.toString(), bobExpectedReward.toString(), "Bob's totalEarned was not updated correctly");
        assert.equal(eneaProperty.totalEarned.toString(), eneaExpectedReward.toString(), "Charlie's totalEarned was not updated correctly");

        // console.log ("Bob NFT Total Earned Value", bobProperty.totalEarned.toString());
        // console.log ("Enea NFT Total Earned Value", eneaProperty.totalEarned.toString());

        // const deltaBalanceAfter = await mockUSDT.balanceOf(delta);
        // console.log("Delta's balance after distributing rewards:", deltaBalanceAfter.toString());

        

    
    });

    after(() => {
        console.log(chalk.bgBlue("---- TESTS COMPLETED ----"));
    });

});