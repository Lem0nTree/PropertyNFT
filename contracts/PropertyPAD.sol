
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./PropertyNFT.sol";

/**
 * @title PropertyPAD
 * @dev A launchpad contract for raising funds to mint PropertyNFTs.
 */
contract PropertyPAD is ReentrancyGuard {

    // State variables
    IERC20 public raiseToken;
    uint256 public amountToRaise;
    uint256 public raiseStartTime;
    uint256 public raiseEndTime;
    uint256 public minContribution;
    uint256 public maxContribution;
    uint256 public totalRaised;
    uint256 public propertyID;
    bool public raiseSuccessful = false;
    bool public isRaiseFinalized = false;


    string public propertyName;
    uint public apr;
    uint public redeemFees;
    uint public sellFees;

    mapping(address => uint256) public userContributions;

    address public admin;
    PropertyNFT public propertyNFT;

    // Events
    event Participated(address indexed user, uint256 amount);
    event ClaimedBack(address indexed user, uint256 amount);
    event PropertyNFTClaimed(address indexed user, uint256 tokenId);
    event FundsWithdrawn(address indexed admin, uint256 amount);


    /**
     * @dev Modifier to check if the caller is the admin.
     */
    modifier onlyAdmin() {
        require(msg.sender == admin, "Caller is not an admin");
        _;
    }

    /**
     * @dev Constructor sets the initial admin and PropertyNFT contract reference.
     * @param _propertyNFTAddress Address of the PropertyNFT contract.
     */
    constructor(address _propertyNFTAddress) {
        admin = msg.sender;
        propertyNFT = PropertyNFT(_propertyNFTAddress);
    }

    /**
     * @dev Set the raise parameters.
     * @param _raiseToken Address of the ERC20 token used for raising.
     * @param _amountToRaise Total amount to raise.
     * @param _raiseStartTime Start time of the raise.
     * @param _raiseEndTime End time of the raise.
     * @param _minContribution Minimum contribution per user.
     * @param _maxContribution Maximum contribution per user.
     */
    function setRaiseParameters(
        address _raiseToken, 
        uint256 _amountToRaise, 
        uint256 _raiseStartTime, 
        uint256 _raiseEndTime, 
        uint256 _minContribution, 
        uint256 _maxContribution
    ) external onlyAdmin {
        raiseToken = IERC20(_raiseToken);
        amountToRaise = _amountToRaise;
        raiseStartTime = _raiseStartTime;
        raiseEndTime = _raiseEndTime;
        minContribution = _minContribution;
        maxContribution = _maxContribution;
    }

    /**
     * @dev Set the property attributes.
     * @param _propertyName Name of the property.
     * @param _propertyID ID of the proeprty.
     * @param _apr APR guaranteed by the property.
     * @param _redeemFees Redeem fees.
     * @param _sellFees Sell fees.
     */
    function setPropertyAttributes(
        string memory _propertyName,
        uint _propertyID,
        uint _apr,
        uint _redeemFees,
        uint _sellFees
    ) external onlyAdmin {
        propertyName = _propertyName;
        propertyID = _propertyID;
        apr = _apr;
        redeemFees = _redeemFees;
        sellFees = _sellFees;
    }

    /**
     * @dev Participate in the raise.
     * @param amount Amount of tokens to contribute.
     */
    function participate(uint256 amount) external {
        require(block.timestamp >= raiseStartTime && block.timestamp <= raiseEndTime, "Not in raise time window");
        require(userContributions[msg.sender] + amount <= maxContribution, "Exceeds max contribution");
        require(userContributions[msg.sender] + amount >= minContribution, "Below min contribution");
        
        raiseToken.transferFrom(msg.sender, address(this), amount);
        userContributions[msg.sender] += amount;
        totalRaised += amount;

        emit Participated(msg.sender, amount);
    }

    /**
     * @dev Claim back tokens if the raise was unsuccessful.
     */
    function claimBack() external {
        require(block.timestamp > raiseEndTime, "Raise not yet finished");
        if (!isRaiseFinalized) {
        finalizeRaise();
        }
        require(!raiseSuccessful, "Raise was successful");
        uint256 contribution = userContributions[msg.sender];
        require(contribution > 0, "No contributions found");

        
        userContributions[msg.sender] = 0;
        raiseToken.transfer(msg.sender, contribution);

        emit ClaimedBack(msg.sender, contribution);
    }
    
    /**
     * @dev Claim PropertyNFT if the raise was successful.
     */
    function claimPropertyNFT() external nonReentrant{
        require(block.timestamp > raiseEndTime, "Raise not yet finished");
        if (!isRaiseFinalized) {
        finalizeRaise();
        }
        require(raiseSuccessful, "Raise was unsuccessful");
        
        uint256 contribution = userContributions[msg.sender];
        require(contribution > 0, "No contributions found");

        // Mint the PropertyNFT for the user with the specified attributes
        uint256 tokenId = propertyNFT.mintProperty(
            msg.sender, 
            propertyName,
            apr,
            amountToRaise,
            contribution,
            propertyID,
            redeemFees,
            sellFees,
            0
        );
        
        userContributions[msg.sender] = 0;
        emit PropertyNFTClaimed(msg.sender, tokenId);
    }



    /**
     * @dev Determine if the raise was successful after the end time.
     */
    function finalizeRaise() internal {
        require(block.timestamp > raiseEndTime, "Raise not yet finished");
        require(!isRaiseFinalized, "Raise already finalized");

        if(totalRaised >= amountToRaise) {
            raiseSuccessful = true;
        }
        isRaiseFinalized = true;

    }

    /**
    * @dev Allows the admin to withdraw the raised tokens after a successful raise.
    */
    function withdrawFunds() external onlyAdmin {
        require(isRaiseFinalized, "Raise not yet finalized");
        require(raiseSuccessful, "Raise was not successful");
        
        uint256 balance = raiseToken.balanceOf(address(this));
        require(balance > 0, "No funds to withdraw");

        raiseToken.transfer(admin, balance);
        
        emit FundsWithdrawn(admin, balance);
    }
}
