const { ethers, web3 } = require("hardhat")
const { UniSwapV3FactoryAddress, UniSwapV3FactoryABI, UniSwapPoolABI, UniSwapV3NPositionManagerAddress, UniSwapV3NPositionManagerABI } = config.EVMAddresses
const { calculateSqrtPriceX96 } = require('../util/TokenUtil')
const { BigNumber } = require('bignumber.js')

const uniswapV3Factory = new web3.eth.Contract(UniSwapV3FactoryABI, UniSwapV3FactoryAddress)
const uniswapV3NPositionManager = new web3.eth.Contract(UniSwapV3NPositionManagerABI, UniSwapV3NPositionManagerAddress)
/**
 * Script to deploy contracts using hardhat
 */
async function main() {
  // Get needed accounts
  const accounts = await web3.eth.getAccounts()

  // Variables for ERC20 and Pool deploy
  const totalBalance = BigNumber(1000).shiftedBy(18)
  const pairFee = 3000

  // Get contract factory
  const TERC20 = await ethers.getContractFactory("TERC20")
  // Deploys two ERC20 tokens
  t1ERC20Contract = await TERC20.deploy('Test1 ERC20', 'TS1', totalBalance.toFixed(0))
  t2ERC20Contract = await TERC20.deploy('Test2 ERC20', 'TS2', totalBalance.toFixed(0))
  // Creates pool if doesn't already exist
  await uniswapV3NPositionManager.methods.createAndInitializePoolIfNecessary(t2ERC20Contract.address, t1ERC20Contract.address, pairFee, calculateSqrtPriceX96(50).toFixed(0)).send({ from: accounts[0] })
  // Gets the deployed Pool address for the Pair and creates a web3 contract
  deployedPairAddress = await uniswapV3Factory.methods.getPool(t1ERC20Contract.address, t2ERC20Contract.address, pairFee).call()
  deployedPairContract = new web3.eth.Contract(UniSwapPoolABI, deployedPairAddress)


  // Log deployed contract addresses to console
  console.log("TS1 deployed to:", t1ERC20Contract.address)
  console.log("TS2 deployed to:", t2ERC20Contract.address)
  console.log("Pool deployed to:", deployedPairAddress)
}

// Call the main function to run
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

