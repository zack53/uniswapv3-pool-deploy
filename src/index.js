require('dotenv').config()
const { config } = require('hardhat')
const express = require('express')
const HDWalletProvider = require('@truffle/hdwallet-provider')
const Web3 = require('web3')
const { abi: nERC20ABI } = require('./artifacts/contracts/NERC20.sol/NERC20.json')
const { abi: advancedCollectibleABI } = require('./artifacts/contracts/NFT/AdvancedCollectible.sol/AdvancedCollectible.json')
const { BigNumber } = require('bignumber.js')
const bodyParser = require('body-parser')
const app = express()
const port = 3001
const web3 = new Web3(new HDWalletProvider(process.env.PRIVATE_KEY_1, process.env.DEV_RPC_URL))
const nERC20Contract = new web3.eth.Contract(nERC20ABI, config.EVMAddresses.mumbai.NFTLoanAddress)
const advancedCollectible = new web3.eth.Contract(advancedCollectibleABI, config.EVMAddresses.mumbai.AdvancedCollectibleAddress)



app.use(bodyParser.json())

const breedValue = {
    0: 4,
    1: 10,
    2: 8
}

app.post('/api/borrow-token', async (req, res) => {
    console.log(req.body)
    const { borrower, amount, nftAddress, tokenId } = req.body
    if (borrower == undefined || amount == undefined || nftAddress == undefined || tokenId == undefined) {
        res.status('400').send(JSON.stringify({ message: "Required body parameters are not present!" }))
    } else {
        let breed = await advancedCollectible.methods.tokenIdToBreed(tokenId).call()
        let collateralValue = breedValue[breed]
        if (collateralValue / 4 >= amount) {
            try {
                await nERC20Contract.methods.borrowTokens(borrower, BigNumber(amount).shiftedBy(18).toString(), collateralValue, nftAddress, tokenId).send({ from: web3.utils.toChecksumAddress(process.env.PUBLIC_KEY_1) })
                res.send(JSON.stringify({ message: "Borrow amount has been accepted." }))
            } catch (error) {
                res.status('400').send(JSON.stringify(error))
                console.log(error)
            }
        } else {
            res.status('400').send(JSON.stringify({ message: "NFT Collateral is not high enough for loan." }))
        }
    }
})

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
