## `PropertyPAD`



A launchpad contract for raising funds to mint PropertyNFTs.

### `onlyAdmin()`



Modifier to check if the caller is the admin.


### `constructor(address _propertyNFTAddress)` (public)



Constructor sets the initial admin and PropertyNFT contract reference.


### `setRaiseParameters(address _raiseToken, uint256 _amountToRaise, uint256 _raiseStartTime, uint256 _raiseEndTime, uint256 _minContribution, uint256 _maxContribution)` (external)



Set the raise parameters.


### `setPropertyAttributes(string _propertyName, uint256 _propertyID, uint256 _apr, uint256 _redeemFees, uint256 _sellFees)` (external)



Set the property attributes.


### `participate(uint256 amount)` (external)



Participate in the raise.


### `claimBack()` (external)



Claim back tokens if the raise was unsuccessful.

### `claimPropertyNFT()` (external)



Claim PropertyNFT if the raise was successful.

### `finalizeRaise()` (internal)



Determine if the raise was successful after the end time.

### `withdrawFunds()` (external)



Allows the admin to withdraw the raised tokens after a successful raise.


### `Participated(address user, uint256 amount)`





### `ClaimedBack(address user, uint256 amount)`





### `PropertyNFTClaimed(address user, uint256 tokenId)`





### `FundsWithdrawn(address admin, uint256 amount)`







