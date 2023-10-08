// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


/**
 * @title Interface for the PropertyNFT contract
 */
interface IPropertyNFT {
    struct Property {
        string propertyName;
        uint apr;
        uint totalPropertyRaised;
        uint propertyParticipation;
        uint propertyID;
        uint redeemFees;
        uint sellFees;
        uint totalEarned;
    }
    
    /**
     * @notice Fetch the owner of the NFT with the given token ID.
     * @param tokenId The ID of the NFT
     * @return Address of the NFT owner
     */
    function ownerOf(uint256 tokenId) external view returns (address);
    
    /**
     * @notice Fetch property details associated with the NFT.
     * @param tokenId The ID of the NFT
     * @return Property data structure with all the property details
     */
    function properties(uint256 tokenId) external view returns (Property memory);
    
    /**
     * @notice Burn (destroy) an NFT with the given token ID.
     * @param tokenId The ID of the NFT to be burned
     */
    function burn(uint256 tokenId) external;
}

/**
 * @title PropertyREDEEM contract for managing and redeeming property NFTs
 * @dev This contract allows the admin to top up funds for property NFTs and users to claim their share.
 */
contract PropertyREDEEM is ReentrancyGuard {
    using SafeMath for uint;

    address public admin;
    IPropertyNFT public propertyNFT;
    
    // State variables
    mapping(uint => uint) public claimAmounts;
    mapping(uint => uint) public totalClaimedAmounts;
    mapping(uint => uint) public numberOfClaims;
    mapping(uint => bool) public claimingInProgress;
    uint[] public propertyIDs;


    // Events
    event TopUpEvent(uint indexed propertyID, uint amount, address tokenAddress);
    event ClaimEvent(uint256 indexed tokenId, uint indexed propertyID, uint claimAmount, uint fees, address tokenAddress);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    /**
     * @notice Ensure only the admin can perform certain tasks.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not the admin");
        _;
    }

    /**
     * @notice Constructor to set the PropertyNFT contract address and initialize the admin.
     * @param _propertyNFT Address of the PropertyNFT contract
     */
    constructor(address _propertyNFT) {
        admin = msg.sender;
        propertyNFT = IPropertyNFT(_propertyNFT);
    }

    /**
     * @notice Top up the claim amount for a specific property.
     * @dev Only callable by the admin.
     * @param _propertyID The ID of the property
     * @param _amount The amount to top up
     * @param _tokenAddress The address of the ERC20 token to use for the top-up
     */
    function topUp(uint _propertyID, uint _amount, address _tokenAddress) external onlyAdmin nonReentrant {
        IERC20 token = IERC20(_tokenAddress);
        require(token.transferFrom(msg.sender, address(this), _amount), "Transfer failed");
        claimAmounts[_propertyID] = claimAmounts[_propertyID].add(_amount);
        claimingInProgress[_propertyID] = true;
        
        // Check if the property ID exists in propertyIDs
        bool exists = false;
        for (uint i = 0; i < propertyIDs.length; i++) {
            if (propertyIDs[i] == _propertyID) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            propertyIDs.push(_propertyID);
        }
        
        emit TopUpEvent(_propertyID, _amount, _tokenAddress);
    }


    /**
     * @notice Claim the share associated with the user's NFT.
     * @param _tokenId The ID of the user's NFT
     * @param _tokenAddress The address of the ERC20 token to receive the claim in
     */
    function claim(uint256 _tokenId, address _tokenAddress) external nonReentrant {
        IPropertyNFT.Property memory property = propertyNFT.properties(_tokenId);
        require(propertyNFT.ownerOf(_tokenId) == msg.sender, "Caller is not the owner of the NFT");
        
        uint userClaim = (claimAmounts[property.propertyID].mul(property.propertyParticipation)).div(property.totalPropertyRaised);
        uint fees = (userClaim.mul(property.redeemFees)).div(100);
        
        IERC20 token = IERC20(_tokenAddress);
        require(token.transfer(msg.sender, userClaim.sub(fees)), "Transfer to user failed");
        require(token.transfer(admin, fees), "Transfer of fees to admin failed");
        
        // Update the state variables
        totalClaimedAmounts[property.propertyID] = totalClaimedAmounts[property.propertyID].add(userClaim);
        numberOfClaims[property.propertyID] = numberOfClaims[property.propertyID].add(1);
        if (claimAmounts[property.propertyID] == totalClaimedAmounts[property.propertyID]) {
            claimingInProgress[property.propertyID] = false;  // Mark the property ID as done if all funds are claimed
        }

        // Emit ClaimEvent
        emit ClaimEvent(_tokenId, property.propertyID, userClaim, fees, _tokenAddress);

        // Burn the NFT after successful claim
        propertyNFT.burn(_tokenId);
    }


    /**
     * @notice Refund the top-up amount for a specific property.
     * @dev Only callable by the admin. Resets the claim amount for the given property ID.
     * @param _propertyID The ID of the property
     * @param _tokenAddress The address of the ERC20 token in which the refund will be received
     */
    function refundTopUp(uint _propertyID, address _tokenAddress) external onlyAdmin nonReentrant {
        IERC20 token = IERC20(_tokenAddress);
        uint refundAmount = claimAmounts[_propertyID];
        require(token.transfer(admin, refundAmount), "Refund transfer failed");
        claimAmounts[_propertyID] = 0; // Reset the claim amount for the property ID
        claimingInProgress[_propertyID] = false;  // Mark the property ID as no longer in the "claiming process"
    }

    /**
     * @notice Withdraw a specified amount of tokens from the contract (emergency function).
     * @dev Only callable by the admin.
     * @param _tokenAddress The address of the ERC20 token to withdraw
     * @param _amount The amount to withdraw
     */
    function emergencyWithdraw(address _tokenAddress, uint _amount) external onlyAdmin nonReentrant {
        IERC20 token = IERC20(_tokenAddress);
        require(token.transfer(admin, _amount), "Emergency withdrawal failed");
    }

    /**
     * @notice Fetch the claim statistics for a given property.
     * @param _propertyID The ID of the property
     * @return claims The number of claims made for the property
     * @return totalClaimed The total amount claimed for the property
     * @return remainingToClaim The amount remaining to be claimed for the property
     */
    function getClaimStats(uint _propertyID) external view returns (uint claims, uint totalClaimed, uint remainingToClaim) {
        claims = numberOfClaims[_propertyID];
        totalClaimed = totalClaimedAmounts[_propertyID];
        remainingToClaim = claimAmounts[_propertyID] - totalClaimed;
    }

    /**
    * @notice Retrieves the properties that are currently in the "claiming process".
    * @dev Iterates through the propertyIDs array to determine which properties are being claimed.
    * @return count The number of properties currently in the "claiming process".
    * @return activePropertyIDs An array of property IDs that are currently being claimed.
    */
    function getClaimingInProgress() external view returns (uint count, uint[] memory activePropertyIDs) {
        uint[] memory tempPropertyIDs = new uint[](propertyIDs.length);
        uint index = 0;
        for (uint i = 0; i < propertyIDs.length; i++) {
            if (claimingInProgress[propertyIDs[i]]) {
                tempPropertyIDs[index] = propertyIDs[i];
                index++;
            }
        }
        activePropertyIDs = new uint[](index);
        for (uint i = 0; i < index; i++) {
            activePropertyIDs[i] = tempPropertyIDs[i];
        }
        return (index, activePropertyIDs);
    }

    
    /**
     * @notice Transfer the admin rights to a new address.
     * @param newAdmin Address of the new admin.
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "New admin is the zero address");
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

}