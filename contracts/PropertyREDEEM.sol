// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropertyNFT.sol";


/**
 * @title PropertyREDEEM
 * @dev This contract allows for the management and claiming of rewards related to property NFTs.
 *      It facilitates the distribution of rewards for NFT property owners.
 */
contract PropertyREDEEM is ReentrancyGuard {

    
/// @notice Address of the contract administrator.
address public admin;

    
/// @notice Address of the PropertyNFT contract.
PropertyNFT public propertyNFT;

    
/// @notice Address of the ERC20 token used for rewards.
IERC20 public rewardToken;


    struct PropertyRewards {
        uint256 rewardAmount;
        uint256 totalClaimedAmount;
        uint256 totalClaimedUsers;
    }

    
/// @notice Mapping of property ID to its associated rewards.
mapping(uint => PropertyRewards) public rewards;


    // Events
    
/**
 * @dev Emitted when a top-up for a property's rewards is made.
 * @param propertyID ID of the property being topped up.
 * @param amount Amount of tokens added to the property's rewards.
 */
event TopUp(uint propertyID, uint256 amount);

    
/**
 * @dev Emitted when a user claims their rewards.
 * @param propertyID ID of the associated property.
 * @param tokenID ID of the NFT token being used to claim the reward.
 * @param amount Amount of rewards claimed by the user.
 */
event Claimed(uint propertyID, uint256 tokenID, uint256 amount);


    
/**
 * @dev Initializes the contract with the given PropertyNFT and reward token addresses.
 * @param _propertyNFT Address of the PropertyNFT contract.
 * @param _rewardToken Address of the ERC20 token used for rewards.
 */
constructor(address _propertyNFT, address _rewardToken) {

        admin = msg.sender;
        propertyNFT = PropertyNFT(_propertyNFT);
        rewardToken = IERC20(_rewardToken);
    }

    
/**
 * @dev Modifier to ensure that only the admin can call certain functions.
 */
modifier onlyAdmin() {

        require(msg.sender == admin, "Caller is not an admin");
        _;
    }

    
/**
 * @dev Allows the admin to set a new admin address.
 * @param _newAdmin Address of the new administrator.
 */
function setNewAdmin(address _newAdmin) external onlyAdmin {

        admin = _newAdmin;
    }

    function topUp(uint propertyID, uint256 amount) external onlyAdmin {
        require(rewards[propertyID].rewardAmount == 0, "Property already has funds");
        rewardToken.transferFrom(msg.sender, address(this), amount);
        rewards[propertyID].rewardAmount += amount;
        emit TopUp(propertyID, amount);
    }

    
/**
 * @dev Allows a user to claim rewards based on their NFT token.
 * @param tokenID ID of the NFT token being used to claim the reward.
 */
function claimReward(uint tokenID) external nonReentrant {

        uint propertyID = propertyNFT.getProperty(tokenID).propertyID;
        require(rewards[propertyID].rewardAmount > 0, "No rewards available");
        require(propertyNFT.ownerOf(tokenID) == msg.sender, "Caller is not the owner of the NFT");

        PropertyNFT.Property memory property = propertyNFT.getProperty(tokenID);
        uint256 reward = (rewards[propertyID].rewardAmount / property.totalPropertyRaised) * property.propertyParticipation;
        uint256 fees = (reward * property.redeemFees) / 100;
        uint256 netReward = reward - fees;

        require(rewardToken.transfer(msg.sender, netReward),"Transfer to user failed");
        require(rewardToken.transfer(admin, fees),"Transfer of fees to admin failed");

        rewards[propertyID].totalClaimedAmount += netReward;
        rewards[propertyID].totalClaimedUsers += 1;
        
        propertyNFT.burnTokenWithApproval(tokenID);

        emit Claimed(propertyID, tokenID, netReward);
    }

    
/**
 * @dev Allows the admin to refund the remaining rewards of a property.
 * @param propertyID ID of the property to be refunded.
 */
function refund(uint propertyID) external onlyAdmin {

        uint256 remainingAmount = rewards[propertyID].rewardAmount - rewards[propertyID].totalClaimedAmount;
        require(rewardToken.transfer(admin, remainingAmount),"Refund to admin failed");
        rewards[propertyID].rewardAmount = 0;
        rewards[propertyID].totalClaimedAmount = 0;
        rewards[propertyID].totalClaimedUsers = 0;
    }

    
/**
 * @dev Allows the admin to withdraw a specified amount from the contract in emergency situations.
 * @param amount Amount of tokens to withdraw.
 */
function emergencyWithdraw(uint256 amount) external onlyAdmin {

        rewardToken.transfer(admin, amount);
    }

    
/**
 * @dev Returns a list of properties with rewards in progress.
 */
function getClaimingInProgress() external view returns (uint[] memory) {

        uint count = 0;
        for (uint i = 1; i <= 10000; i++) {  // Assume maximum of 10,000 propertyIDs
            if (rewards[i].rewardAmount > 0 && rewards[i].rewardAmount > rewards[i].totalClaimedAmount) {
                count += 1;
            }
        }
        
        uint[] memory propertiesInProgress = new uint[](count);
        uint index = 0;
        for (uint i = 1; i <= 10000; i++) {
            if (rewards[i].rewardAmount > 0 && rewards[i].rewardAmount > rewards[i].totalClaimedAmount) {
                propertiesInProgress[index] = i;
                index += 1;
            }
        }
        
        return propertiesInProgress;
    }


    
/**
 * @dev Provides details about the total rewards claimed for a specific property.
 * @param propertyID ID of the property.
 * @return totalUsers Total number of users who claimed rewards for this property.
 * @return totalAmount Total amount of rewards claimed for this property.
 * @return remainingAmount Remaining amount of rewards for this property.
 */
function totalClaimed(uint propertyID) external view returns (uint256 totalUsers, uint256 totalAmount, uint256 remainingAmount) {

        totalUsers = rewards[propertyID].totalClaimedUsers;
        totalAmount = rewards[propertyID].totalClaimedAmount;
        remainingAmount = rewards[propertyID].rewardAmount - rewards[propertyID].totalClaimedAmount;
    }
}
