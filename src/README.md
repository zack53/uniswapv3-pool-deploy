# NFT Loan Platform Smart Contracts
The NFT Loan platform ERC20 tokens to be invested for earning interest and borrow the ERC20 tokens by providing an NFT as collateral. The current limitation at the moment is that only one loan can be provided per account. The one loan per account is an intentional limitation. The idea would be that one contract would need to be deployed per ERC20 token that would be supported. 

The NFT collateral provided is currently hard coded to only accept one NFT. Future improvements would be to implement the OpenSea API in a server side back-end call to get the last NFT sell price. The loan amount has to be lower or equal to 25% of the NFT collateral. The position will be liquidated once the NFT loan amount has gained an interest that is half of the collateral last sold value. There is a tool in place that will allow to force liquidate a position if it is over the threshold. To implement this force liquidation, you would need to parse through the logs on chain to find borrowers. You can check borrowed amounts via calls to the smart contract. The loan amount ca be force liquidated only when the loan amount has reached 2x the initial value.


## Future plans
Implement OpenSea API for latest sell price to allow for any NFT collateral to be provided. Create a factory contract that can deploy and keep track of the NERC20 smart contracts. The factory contract should contain a mapping of ERC20 token to the respective NERC20 counterpart. 

## Deployed Contracts
The AdvancedCollectible smart contract is mentioned here due to the dependency at the moment for borrowing ERC20 tokens. This is the only NFT contract supported at the moment for borrowing until the OpenSea API can be implemented for price checking.

| **Polygon Mumbai Address** | |
| ----------- | ----------- |
| **NERC20** | [0x7B427D442d5cCe45b9e6FB984206605B3c97f64D](https://mumbai.polygonscan.com/address/0x7B427D442d5cCe45b9e6FB984206605B3c97f64D) |
| **AdvancedCollectible** | [0xae87e56a9dF1Baf99F77B7A75F6EFDFD03bc41e5](https://mumbai.polygonscan.com/address/0xae87e56a9dF1Baf99F77B7A75F6EFDFD03bc41e5) |

### NERC20
| Write Functions | Functions that anyone can call on the contract |
| ----------- | ----------- |
| approve | ERC20 Approve function. |
| borrowTokens | Takes in borrow address, amount uint256, nftCollateralAmount uint256, NFTContract address, tokenId uint256. The borrowTokens function requires approval of transferring NFT. The smart contract transfers the NFT to the address and in return gives the ERC20 counterpart token that is linked to this Address. The nftCollateralAmount will be provided via a back-end Rest-API by using the OpenSea API to get the latest price of the NFT. The latest price determines the amount that can be borrowed. The borrow amount has to be less than or equal nftCollateralAmount / 4. Emits BorrowedToken(address indexed borrower, uint256 amountBorrowed)  |
| claimAccruedTokens | Allows the msg.sender to claim the amount of accrued tokens from their ERC20 investment. The claimed tokens are in the NERC20 format until the user calls the withdrawsTokens function. Emits InvestedTokenClaimed(address indexed investor, uint256 amountInvested) |
| decreaseAllowance | ERC20 function |
| forceLiquidateIdleNFT | Takes in nftOwner address. Calling this function will try to force liquidate a nft owner's position. This will only execute if the criteria for liquidation is met. The liquidation will only execute if the outstanding balance of the borrower's position is greater than or equal to half of the NFT value. This is a safety precaution to ensure NFTs aren't lost on the smart contract forever. The liquidation process moves them to a mapping that allows for them to be sold. Emits NFTLiquidated(address indexed NFTContract, uint256 tokenId) |
| increaseAllowance | ERC20 function. |
| repayBorrowAmount | Takes in borrower address and amount uint256. Repays the amount on the borrower's account. The repayFullBorrowAmount is called from within repayBorrowAmount if the payment exceeds the full repayment amount. Emits PayedOnLoan(address indexed borrower, uint256 amountPaid) |
| repayFullBorrowAmount | Takes in borrower address. This will calculate the full repayment amount and transfers that to the smart contract in return for the NFT. |
| sellLiquidNFT | Takes in purchaser address, purchaseAmount uint256, nftContract address, tokenId uint256. This is only callable by owner. This will sell a liquidated NFT to the purchaser. There are checks in place to ensure we sell the NFT for a minimum amount. This may be taken out of the smart contract logic and put into the back-end API. Emits NFTLiquiditySold(address purchaser, uint256 purchaseAmount, address NFTContract, uint256 tokenId) |
| setCurrentBorrowInterestRatePerBlock | Takes in amount uint8. Requires owner to set. Sets the current interest rate per block for borrowers. Future improvement would be to automate this using supply and demand. |
| setCurrentInterestRatePerBlock | Takes in amount uint8. Requires owner to set. Sets the current interest rate per block for investors. Future improvement would be to automate this using supply and demand. |
| shutdownContract | Requires owner. Shuts down the contract halting anything from happening in case of an emergency. |
| startContract | Requires owner. Starts the contract back-up. |
| supplyTokens | Takes in amount uint256. Supplies the amount of the ERC20 token in return for NERC20 token. The NERC20 token is used to identify how much an investor has in the contract. Emits InvestedToken(address indexed investor, uint256 amountInvested) |
| transfer | ERC20 function. |
| transferFrom | ERC20 function. |
| withdrawTokens | Takes in amount uint256. Withdraws transfers ERC20 token back to investor and burns the NERC20 token supply. Emits WithdrawInvestedTokens(address indexed investor,uint256 amountWithdrawn) |

| Read Functions | Functions that anyone can read on the contract |
| ----------- | ----------- |
| NFTOwnerMapping | Takes in owner address. Returns NFT Contract address, Token Id, and NFT Collateral Amount linked to the owner. |
| allowance | ERC20 function. |
| balanceOf | ERC20 function. |
| decimals | ERC20 function. |
| getAmountBorrowed | Takes in borrower address. Returns the amount borrowed for the borrower given. |
| getAmountInvested | Returns the amount invested for the msg.sender. |
| getBorrowedRepayAmount | Takes in borrower address. Returns total amount needed to pay off amount borrowed. |
| name | ERC20 function. |
| nftPurchasePrice | Takes in nftContract address and tokenId uint256. Returns the minimum purchase price of a liquid NFT. |
| onERC721Received | ERC721 function. Required to transfer NFTs to smart contract. |
| symbol | ERC20 function. |
| totalAmountBorrowed | Returns total amount borrowed from smart contract. |
| totalAmountInvested | Returns total amount invested on smart contract. |
| totalAmountInvestedInterest | Returns total outstanding invested interest balance. claimAccruedTokens function claims the outstanding invested interest balance and subtracts the user's portion from the totalAmountInvestedInterest and adds to the totalAmountInvested. |
| totalBorrowedInterest | Returns the outstanding borrowed interest for smart contract. Once a user pays a piece of their loan, the borrowed interest is updated and added to the totalAmountBorrowed. |
| totalSupply | ERC20 function. Should always match totalAmountInvested. |
| viewAccruedTokensAmount | Returns the msg.sender accrued tokens. claimAccruedTokens function claims the outstanding invested interest balance and moves to getAmountInvested value. |
| viewBorrowAccruedTokensAmount | Takes in borrower address. Returns the borrowed accrued tokens. Paying on a loan function claims the outstanding borrowed interest and adds to the getAmountBorrowed value. |

### AdvancedCollectible

| Write Functions | Functions that owner can call on the contract |
| ----------- | ----------- |
| CreateDoggies | Starts the process to mint a new NFT. The process calls requestRandomness from the VRFConsumerBase contract. The call requires LINK to work. The requestRandomness returns a random number to fulfillRandomness function. Emits requestedCollectible(address indexed minter, bytes32 indexed requestId)   |
| fulfillRandomness | The fulfillRandomness function mints the NFT and sets the breed to a 1 of 3 choices. Emits mintCollectible(bytes32 indexed requestId, uint256 tokenId, Breed breed) |
| safeTransferFrom | ERC721 function. |
| safeTransferFrom | ERC721 function. |
| setApprovalForAll | ERC721 function. |
| setTokenURI | Takes in tokenId uint256 and tokenURI string. Sets the tokenId's tokenURI to the tokenURI value provided. |
| transferFrom | ERC721 function. |

| Read Functions | Functions that anyone can read on the contract |
| ----------- | ----------- |
| balanceOf | Takes in owner address. Returns number of Doggies owned. |
| getApproved | ERC721 function. |
| isApprovedForAll | ERC721 function. |
| name | ERC721 function. |
| ownerOf | ERC721 function. |
| requestIdToSender | Takes in requestId. Returns the msg.sender of the CreateDoggies request. |
| requestIdToTokenId | Takes in requestId. Returns the tokenId related to the requestId. |
| supportsInterface | ERC721 function. |
| symbol | ERC721 function. |
| tokenCounter | Returns total number of minted Doggies. |
| tokenIdToBreed | Takes in tokenId uint256. Returns the breed of the tokenId. |
| tokenURI | ERC721 function. |

# Useful Resources

## How to set-up hardhat
https://hardhat.org/getting-started/

I am using hardhat to fork polygon mainnet for testing swapping contracts. The hardhat also provides good documentation for automating testing and deployment, which I am using in this project.

I was able to easily verify my smart contract on polygonscan by following the steps located [here at coinsbench](https://coinsbench.com/verify-smart-contract-on-polygonscan-using-hardhat-9b8331dbd888).
