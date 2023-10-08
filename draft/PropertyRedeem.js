const PropertyREDEEM = artifacts.require("PropertyREDEEM");
const IPropertyNFT = artifacts.require("PropertyNFT"); // Assuming the actual contract for this exists
const MockERC20 = artifacts.require("MockERC20"); // Import the MockERC20 contract


contract("PropertyREDEEM", (accounts) => {
    let propertyRedeem;
    let propertyNFT;
    let mockERC20; // Declare a variable to hold the mock ERC20 instance


    const admin = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    
    beforeEach(async () => {
        propertyNFT = await IPropertyNFT.new({ from: admin });
        propertyRedeem = await PropertyREDEEM.new(propertyNFT.address, { from: admin });
        mockERC20 = await MockERC20.new({ from: admin }); // Deploy the mock ERC20 token
        await propertyNFT.setRedeemer(propertyRedeem, {from: admin}); // set the contract as redeemer in the NFT
    
        const mintAmount = 10000; // Arbitrary amount for testing
        await mockERC20.mint(admin, mintAmount); // Mint tokens to the admin
        await mockERC20.mint(user1, mintAmount); // Mint tokens to the user1
        await mockERC20.mint(user2, mintAmount); // Mint tokens to the user2


    });

    it("should set the correct admin on deployment", async () => {
        const adminAddress = await propertyRedeem.admin();
        assert.equal(adminAddress, admin, "Admin address does not match the deployer address");
    });

    xit("should allow admin transfer", async () => {
        await propertyRedeem.transferAdmin(user1, { from: admin });
        const newAdmin = await propertyRedeem.admin();
        assert.equal(newAdmin, user1, "Admin transfer failed");
    });

    it("should not allow non-admin to transfer admin", async () => {
        try {
            await propertyRedeem.transferAdmin(user2, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    it("should have the correct admin", async () => {
        const contractAdmin = await propertyRedeem.admin();
        assert.equal(contractAdmin, admin, "Admin address does not match expected address");
    });
    

    it("should allow admin to top up funds for a property", async () => {
        const propertyID = 1;
        const amount = 1000;

        // Step 1: Approve the PropertyREDEEM contract to spend the tokens on behalf of the admin
        await mockERC20.approve(propertyRedeem.address, amount, { from: admin });
        await propertyRedeem.topUp(propertyID, amount, mockERC20.address, { from: admin });
    
        const claimAmount = await propertyRedeem.claimAmounts(propertyID);
        assert.equal(claimAmount.toNumber(), amount, "Top up amount did not match");
    });

    it("should not allow non-admin to top up funds", async () => {
        const propertyID = 1;
        const amount = 1000;
        
        try {
            // Step 1: Approve the PropertyREDEEM contract to spend the tokens on behalf of the user1
            await mockERC20.approve(propertyRedeem.address, amount, { from: user1 });
            await propertyRedeem.topUp(propertyID, amount, mockERC20.address, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    it("should allow users to claim funds", async () => {
        const propertyID = 1;
        const amount = 1000;
        
        // Assume user1 owns the NFT with propertyID 1
        await propertyNFT.setMinter(admin, { from: admin });

        const propertyName = "Sample Property";
        const apr = 5; // Just an example value
        const totalPropertyRaised = 1000; // Example value
        const propertyParticipation = 10; // Example value
        const redeemFees = 2; // Example value
        const sellFees = 3; // Example value
        const totalEarned = 500; // Example value

        await propertyNFT.mintProperty(
            user1,
            propertyName,
            apr,
            totalPropertyRaised,
            propertyParticipation,
            propertyID,
            redeemFees,
            sellFees,
            totalEarned,
            { from: admin }
        );  



        await mockERC20.approve(propertyRedeem.address, amount, { from: admin });
        await propertyRedeem.topUp(propertyID, amount, mockERC20.address, { from: admin });
        
        const initialBalance = await web3.eth.getBalance(user1);
        
        // User1 claims their share
        await propertyRedeem.claim(propertyID, mockERC20.address, { from: user1 });
        
        const finalBalance = await web3.eth.getBalance(user1);
        assert(finalBalance > initialBalance, "Claimed amount was not added to user's balance");
    });

    xit("should update claim statistics after a claim", async () => {
        const propertyID = 1;
        const amount = 1000;
        
        await propertyRedeem.topUp(propertyID, amount, { from: admin });
        
        // Assuming user1 owns the NFT with propertyID
        await propertyRedeem.claim(propertyID, { from: user1 });
        
        const stats = await propertyRedeem.getClaimStats(propertyID);
        assert.equal(stats.claims.toNumber(), 1, "Number of claims did not update correctly");
        assert.equal(stats.totalClaimed.toNumber(), amount, "Total claimed amount did not update correctly");
        assert.equal(stats.remainingToClaim.toNumber(), 0, "Remaining to claim did not update correctly");
    });

    xit("should not allow users to claim for a property they don't own", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });

        // Attempting to claim without owning the property
        try {
            await propertyRedeem.claim(propertyID, { from: user2 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should allow admin to start and end a claiming process", async () => {
        const propertyID = 1;

        await propertyRedeem.startClaimingProcess(propertyID, { from: admin });
        let inProgress = await propertyRedeem.claimingInProgress(propertyID);
        assert.equal(inProgress, true, "Claiming process did not start");

        await propertyRedeem.endClaimingProcess(propertyID, { from: admin });
        inProgress = await propertyRedeem.claimingInProgress(propertyID);
        assert.equal(inProgress, false, "Claiming process did not end");
    });

    xit("should not allow non-admin to start or end a claiming process", async () => {
        const propertyID = 1;

        try {
            await propertyRedeem.startClaimingProcess(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }

        try {
            await propertyRedeem.endClaimingProcess(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should correctly retrieve properties in claiming process", async () => {
        const propertyID1 = 1;
        const propertyID2 = 2;

        await propertyRedeem.startClaimingProcess(propertyID1, { from: admin });
        await propertyRedeem.startClaimingProcess(propertyID2, { from: admin });

        const result = await propertyRedeem.getClaimingInProgress();
        const count = result[0];
        const activePropertyIDs = result[1];

        assert.equal(count, 2, "Incorrect number of properties in claiming process");
        assert.include([propertyID1, propertyID2], activePropertyIDs[0], "Returned property IDs are incorrect");
        assert.include([propertyID1, propertyID2], activePropertyIDs[1], "Returned property IDs are incorrect");
    });

    
    xit("should correctly update the totalClaimedAmounts after multiple claims", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });

        // Assuming user1 owns the NFT with propertyID
        await propertyRedeem.claim(propertyID, { from: user1 });

        // Assuming user2 also owns another NFT with the same propertyID (just for testing)
        await propertyRedeem.claim(propertyID, { from: user2 });

        const totalClaimed = await propertyRedeem.totalClaimedAmounts(propertyID);
        assert.equal(totalClaimed.toNumber(), 2 * amount, "Total claimed amount did not update correctly after multiple claims");
    });

    xit("should not allow claims when no funds are available", async () => {
        const propertyID = 1;

        // No top up has been done, so no funds available
        try {
            await propertyRedeem.claim(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should not allow claims during claiming process", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });
        await propertyRedeem.startClaimingProcess(propertyID, { from: admin });

        // Trying to claim during the claiming process
        try {
            await propertyRedeem.claim(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should correctly track the number of claims for a property", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });

        await propertyRedeem.claim(propertyID, { from: user1 });
        await propertyRedeem.claim(propertyID, { from: user2 });

        const claims = await propertyRedeem.numberOfClaims(propertyID);
        assert.equal(claims.toNumber(), 2, "Number of claims did not match expected value");
    });

    xit("should correctly update the claimAmounts after topUp", async () => {
        const propertyID = 1;
        const amount1 = 1000;
        const amount2 = 500;

        await propertyRedeem.topUp(propertyID, amount1, { from: admin });
        await propertyRedeem.topUp(propertyID, amount2, { from: admin });

        const totalClaimAmount = await propertyRedeem.claimAmounts(propertyID);
        assert.equal(totalClaimAmount.toNumber(), amount1 + amount2, "Total claim amount did not update correctly after multiple top-ups");
    });

    xit("should allow claims only for the available amount", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });

        // Assuming user1 owns the NFT with propertyID
        await propertyRedeem.claim(propertyID, { from: user1 });

        // Trying to claim again should fail since no funds are left
        try {
            await propertyRedeem.claim(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should allow multiple properties to be in claiming process", async () => {
        const propertyID1 = 1;
        const propertyID2 = 2;

        await propertyRedeem.startClaimingProcess(propertyID1, { from: admin });
        await propertyRedeem.startClaimingProcess(propertyID2, { from: admin });

        const inProgress1 = await propertyRedeem.claimingInProgress(propertyID1);
        const inProgress2 = await propertyRedeem.claimingInProgress(propertyID2);

        assert.equal(inProgress1, true, "Property 1 not in claiming process");
        assert.equal(inProgress2, true, "Property 2 not in claiming process");
    });

    xit("should correctly show the remaining amount to claim", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });
        
        const statsBefore = await propertyRedeem.getClaimStats(propertyID);
        assert.equal(statsBefore.remainingToClaim.toNumber(), amount, "Incorrect amount before claim");

        // Assuming user1 owns the NFT with propertyID
        await propertyRedeem.claim(propertyID, { from: user1 });

        const statsAfter = await propertyRedeem.getClaimStats(propertyID);
        assert.equal(statsAfter.remainingToClaim.toNumber(), 0, "Incorrect amount after claim");
    });


    
    xit("should not allow a property to start the claiming process if it's already in progress", async () => {
        const propertyID = 1;

        await propertyRedeem.startClaimingProcess(propertyID, { from: admin });

        // Attempting to start the claiming process again
        try {
            await propertyRedeem.startClaimingProcess(propertyID, { from: admin });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should not allow a property to end the claiming process if it's not in progress", async () => {
        const propertyID = 1;

        // Attempting to end the claiming process without starting it
        try {
            await propertyRedeem.endClaimingProcess(propertyID, { from: admin });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should not allow claims from a property that's in the claiming process", async () => {
        const propertyID = 1;
        const amount = 1000;

        await propertyRedeem.topUp(propertyID, amount, { from: admin });
        await propertyRedeem.startClaimingProcess(propertyID, { from: admin });

        // Attempting to claim during the claiming process
        try {
            await propertyRedeem.claim(propertyID, { from: user1 });
            assert.fail("Expected revert not received");
        } catch (error) {
            assert(error.message.search('revert') >= 0, "Expected revert, got another error: " + error.message);
        }
    });

    xit("should reflect the correct number of properties in the claiming process", async () => {
        const propertyID1 = 1;
        const propertyID2 = 2;
        const propertyID3 = 3;

        await propertyRedeem.startClaimingProcess(propertyID1, { from: admin });
        await propertyRedeem.startClaimingProcess(propertyID2, { from: admin });

        const result = await propertyRedeem.getClaimingInProgress();
        const count = result[0];

        assert.equal(count, 2, "Incorrect number of properties in claiming process");

        await propertyRedeem.startClaimingProcess(propertyID3, { from: admin });

        const updatedResult = await propertyRedeem.getClaimingInProgress();
        const updatedCount = updatedResult[0];

        assert.equal(updatedCount, 3, "Incorrect updated number of properties in claiming process");
    });

});
