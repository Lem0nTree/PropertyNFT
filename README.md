# PropertyNFT
Allow to partecipate in a launchpad to acquire a real property and receive NFT that will be used to split rewards and profits.


**SMART CONTRACTS**

**PropertyPAD** 

HARDCAP mode. Admin sets a target to raise, time to contribute, minimum contribution amount and max contribution amount. Users can participate in the launchpad allocating USDT. At the end of the launchpad , if the hardcap is not reached users can claim back their USDT token. If the hardcap is reached users will be able to mint NFT linked to this specific launchpad with data of the invested amount and ROI.

**PropertyNFT**
the NFT should have some custom data build inside such as:
  * Real Estate data
  * APR guarantee
  * Amount participated in the launchpad
  * Total raised in the launchpad that get this NFT minted
  * Property ID
  * Redeem Commission to the platform
  * Sell Commission in the marketplace 
  * NFT Registry for airdrop
  * Total Commission Paid

It also feature a function “DistribuiteRewards” function that allow admin to distribute monthly APR rewards to specific propertyID based on users partecipations.


**Redeem Contract **
Where users can burn their NFT to get back appreciation. Fees are applied. Admin will topup the contract with the USDT from the sale of the property, and users will be able to claim their % based on the invested amount in the launchpad. 


A future release of the platform can include an NFT Marketplace, allowing users to trade their real estate NFTs, although the marketplace itself should be something very simple and intuitive. There is no need for too many features for it.
