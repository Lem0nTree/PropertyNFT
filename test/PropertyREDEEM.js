const PropertyREDEEM = artifacts.require("PropertyREDEEM");
const PropertyNFT = artifacts.require("PropertyNFT");
const MockERC20 = artifacts.require("MockERC20");

contract("PropertyREDEEM", accounts => {

    let propertyREDEEM;
    let propertyNFT;
    let mockERC20;
    
    const admin = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];

    beforeEach(async () => {
        mockERC20 = await MockERC20.new({ from: admin });
        propertyNFT = await PropertyNFT.new({ from: admin });
        propertyREDEEM = await PropertyREDEEM.new(propertyNFT.address, mockERC20.address, { from: admin });
        await propertyNFT.setMinter(admin, { from: admin });
        await propertyNFT.setRedeemer(propertyREDEEM.address, {from:admin});
    });

    describe("Contract Initialization", () => {
        it("should correctly initialize the PropertyREDEEM contract", async () => {
            const adminAddress = await propertyREDEEM.admin();
            const nftAddress = await propertyREDEEM.propertyNFT();
            const rewardTokenAddress = await propertyREDEEM.rewardToken();

            assert.equal(adminAddress, admin, "Admin address is not set correctly");
            assert.equal(nftAddress, propertyNFT.address, "PropertyNFT address is not set correctly");
            assert.equal(rewardTokenAddress, mockERC20.address, "Reward token address is not set correctly");
        });
    });

    describe("Reward Management", () => {
        it("should allow admin to top-up rewards for a property", async () => {
            const propertyID = 1; // Assuming a property with ID 1 exists
            const rewardAmount = web3.utils.toWei('10', 'ether'); // 10 tokens

            // Approve and transfer tokens to PropertyREDEEM contract
            await mockERC20.mint(admin, rewardAmount);
            await mockERC20.approve(propertyREDEEM.address, rewardAmount, { from: admin });

            // Top-up rewards
            const receipt = await propertyREDEEM.topUp(propertyID, rewardAmount, { from: admin });

            const propertyRewards = await propertyREDEEM.rewards(propertyID);
            assert.equal(propertyRewards.rewardAmount.toString(), rewardAmount, "Reward amount not topped up correctly");

            // Check event
            assert.equal(receipt.logs[0].event, "TopUp", "TopUp event not emitted");
            assert.equal(receipt.logs[0].args.propertyID, propertyID, "TopUp event propertyID not correct");
            assert.equal(receipt.logs[0].args.amount.toString(), rewardAmount, "TopUp event rewardAmount not correct");
            
        });


        it("should allow users to claim rewards", async () => {
            const propertyID = 1;
            const claimAmount = web3.utils.toWei('2', 'ether');

            // Mint PropertyNFT to user1 using mintProperty
            await propertyNFT.mintProperty(
                user1,
                "Sample Property",
                5, // Sample APR
                web3.utils.toWei('100', 'ether'), // Sample totalPropertyRaised
                web3.utils.toWei('10', 'ether'), // Sample propertyParticipation
                propertyID,
                10, // Sample redeemFees
                1, // Sample sellFees
                web3.utils.toWei('5', 'ether'), // Sample totalEarned
                { from: admin }
            );

            const NFTOwner = await propertyNFT.ownerOf(1);
            assert.equal(NFTOwner, user1, "user1 should be the owner of NFT id 1");
           
            // Ensure there are rewards available for the property
            const rewardAmount = web3.utils.toWei('1000', 'ether');
            await mockERC20.mint(admin, rewardAmount);
            await mockERC20.approve(propertyREDEEM.address, rewardAmount, { from: admin });
            await propertyREDEEM.topUp(propertyID, rewardAmount, { from: admin });

            const propertyRewards = await propertyREDEEM.rewards(propertyID);
            assert.equal(propertyRewards.rewardAmount.toString(), web3.utils.toWei('1000', 'ether'));


            // User gives approval for the PropertyREDEEM contract to burn their NFT
            await propertyNFT.approve(propertyREDEEM.address, 1, { from: user1 });

            // Calling function and creating receipt for degub
            const receipt = await propertyREDEEM.claimReward(propertyID, { from: user1 });
            const userBalance = await mockERC20.balanceOf(user1);
            

            // Extract netReward from the Claimed event in the receipt
            const event = receipt.logs.find(e => e.event === 'Claimed');
            const netRewardFromEvent = event.args.amount;
            // Check if event exists
            assert.ok(event, "Expected Claimed event not found in the receipt logs.");
            // Log the entire event for debugging
            assert.equal(userBalance.toString(), netRewardFromEvent.toString(), "User's balance after claim does not match net reward from event");


            // Check if NFT was burned
            try {
                await propertyNFT.ownerOf(1);
                assert.fail("Token with ID 1 should have been burned, but it still exists");
            } catch (error) {
                assert(error.message.includes("ERC721: invalid token ID"), "Expected an invalid token ID error, but got another error");
            }
        });



        // ... more tests for claiming, etc.
    });

    // Additional test cases ...

});

