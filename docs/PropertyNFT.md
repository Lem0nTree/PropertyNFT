## `PropertyNFT`



An NFT representation of a property. This contract allows for minting property NFTs, updating their attributes,
and querying based on certain attributes like propertyID. It also provides role-based access control for various operations.

### `onlyAdmin()`



Ensures that the caller is the admin.

### `onlyMinter()`



Ensures that the caller has minting privileges.

### `onlyRedeemer()`



Ensures that the caller has redeeming privileges.

### `onlyOperator()`



Ensures that the caller has operational privileges.


### `constructor()` (public)



Sets up the main admin role on contract deployment.

### `setNewAdmin(address _newAdmin)` (public)



Assigns a new admin.


### `setMinter(address _minter)` (public)



Assigns a minter role to an address.


### `setRedeemer(address _redeemer)` (public)



Assigns a redeemer role to an address.


### `setOperator(address _operator)` (public)



Assigns an operator role to an address.


### `mintProperty(address to, string propertyName, uint256 apr, uint256 totalPropertyRaised, uint256 propertyParticipation, uint256 propertyID, uint256 redeemFees, uint256 sellFees, uint256 totalEarned) → uint256` (external)

Only callable by an address with the MinterPad role.

Mints a new property NFT.


### `getTokensBypropertyID(uint256 _propertyID) → uint256[]` (public)



Fetches all tokens associated with a particular propertyID.


### `updateSellFees(uint256 tokenId, uint256 _sellFees)` (external)

Only callable by an operator.

Updates the sellFees attribute for a single  tokenIds.


### `updateRedeemFees(uint256 tokenId, uint256 _redeemFees)` (external)

Only callable by an operator.

Updates the redeemfees attribute for a single  tokenIds.


### `updateBulkSellFees(uint256[] tokenIds, uint256 _sellFees)` (external)

Only callable by an operator.

Updates the sellFees attribute for a multiple tokenIds.


### `updateBulkRedeemFees(uint256[] tokenIds, uint256 _redeemFees)` (external)

Only callable by an operator.

Updates the redeemFees attribute for a multiple tokenIds.


### `distributeRewards(uint256 propertyID, uint256 amount, address TokenAddress)` (external)



Distributes rewards to NFT holders based on their properties' participation in a specified launchpad.
The rewards are distributed in USD token. The contract needs to be approved by the operator to spend the USDT before calling this function.



### `_burn(uint256 tokenId)` (internal)



Internal function to burn a token. Overrides the ERC721 burn functionality.


### `burnTokenWithApproval(uint256 tokenId)` (external)

Only callable by an address with the RedeemPad role.

Allows burning of a token after user's approval.


### `setTokenURI(uint256 tokenId, string _tokenURI)` (external)



Sets the URI for a given token ID. Overrides the ERC721URIStorage setTokenURI functionality.


### `tokenURI(uint256 tokenId) → string` (public)



Returns the URI associated with a specific token ID. Overrides ERC721's tokenURI functionality.


### `getProperty(uint256 tokenId) → struct PropertyNFT.Property` (external)



Fetches the Property details for a specific token ID.


### `balanceOf(address owner) → uint256` (public)



Returns the balance (number of tokens) of the specified owner. Overrides ERC721's balanceOf function.


### `ownerOf(uint256 tokenId) → address` (public)



Returns the owner of the specified token ID. Overrides ERC721's ownerOf function.


### `approve(address to, uint256 tokenId)` (public)



Approves another address to manage the specified token. Overrides ERC721's approve function.


### `transferFrom(address from, address to, uint256 tokenId)` (public)



Transfers the ownership of a token from one address to another. Overrides ERC721's transferFrom function.


### `safeTransferFrom(address from, address to, uint256 tokenId)` (public)



Safely transfers the ownership of a token from one address to another. Overrides ERC721's safeTransferFrom function.


### `safeTransferFrom(address from, address to, uint256 tokenId, bytes _data)` (public)



Safely transfers the ownership of a token from one address to another, with additional data. Overrides ERC721's safeTransferFrom function.


### `_beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)` (internal)

Additional Overrides to avoid library conflicts



### `supportsInterface(bytes4 interfaceId) → bool` (public)






### `PropertyMinted(uint256 tokenId, string propertyName, uint256 apr, uint256 totalPropertyRaised, uint256 propertyParticipation, uint256 propertyID, uint256 redeemFees, uint256 sellFees, uint256 totalEarned)`



Emitted when a new property NFT is minted.


### `Property`


string propertyName


uint256 apr


uint256 totalPropertyRaised


uint256 propertyParticipation


uint256 propertyID


uint256 redeemFees


uint256 sellFees


uint256 totalEarned



