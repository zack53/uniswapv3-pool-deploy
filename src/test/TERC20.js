// https://trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts.html
// The link above is a good resource for everything related to truffle contracts.

const { web3, assert, network } = require("hardhat")
const { UniSwapV3RouterAddress, UniSwapV3FactoryAddress, UniSwapV3FactoryABI, UniSwapPoolABI, UniSwapV3NPositionManagerAddress, UniSwapV3NPositionManagerABI } = config.EVMAddresses
const { BigNumber } = require('bignumber.js')
const { calculateSqrtPriceX96, calculatePriceFromX96 } = require('../util/TokenUtil')

// Creates a truffe contract from compiled artifacts.
const nERC20 = artifacts.require("TERC20")
const UniSwapSingleSwap = artifacts.require("UniSwapSingleSwap")

// Creates uniswap V3 Factory  and Position Manager contract using web3
const uniswapV3Factory = new web3.eth.Contract(UniSwapV3FactoryABI, UniSwapV3FactoryAddress)
const uniswapV3NPositionManager = new web3.eth.Contract(UniSwapV3NPositionManagerABI, UniSwapV3NPositionManagerAddress)


const decimals = 18
const TICK_MAX = 887272
const TICK_MIN = -887272
let t1ERC20Contract
let t2ERC20Contract
let accounts
let totalBalance = BigNumber(1000).shiftedBy(18)
let pairFee = 3000
let deployedPairAddress
let deployedPairContract
// Vanilla Mocha test. Increased compatibility with tools that integrate Mocha.
describe("Uniswap Pool Deploy", function () {

  before(async function () {
    accounts = await web3.eth.getAccounts()
    //Checks to see if the first account has ETH
    let balance = await web3.eth.getBalance(accounts[0])
    assert.notEqual(balance, 0)
    //deploy contracts
    t1ERC20Contract = await nERC20.new('Test1 ERC20', 'TS1', totalBalance)
    t2ERC20Contract = await nERC20.new('Test2 ERC20', 'TS2', totalBalance)
    //deploy UniSwap contract
    uniSwapSingleSwap = await UniSwapSingleSwap.new(UniSwapV3RouterAddress)

  })

  it("Should deploy with the name Test1 ERC20", async function () {
    assert.equal(await t1ERC20Contract.name(), 'Test1 ERC20')
  })

  it("Should deploy with the symbol TS1", async function () {
    assert.equal(await t1ERC20Contract.symbol(), 'TS1')
  })

  it(`Should have ${totalBalance.shiftedBy(-1 * decimals).toFixed(0)} totalSupply`, async function () {
    assert.equal(await t1ERC20Contract.totalSupply(), totalBalance.toFixed(0))
  })

  it(`Should have ${decimals} for decimals`, async function () {
    assert.equal(await t1ERC20Contract.decimals(), decimals)
  })

  it("Should deploy with the name Test2 ERC20", async function () {
    assert.equal(await t2ERC20Contract.name(), 'Test2 ERC20')
  })

  it("Should deploy with the symbol TS2", async function () {
    assert.equal(await t2ERC20Contract.symbol(), 'TS2')
  })

  it(`Should have ${totalBalance.shiftedBy(-1 * decimals).toFixed(0)} totalSupply`, async function () {
    assert.equal(await t2ERC20Contract.totalSupply(), totalBalance.toFixed(0))
  })

  it(`Should have ${decimals} for decimals`, async function () {
    assert.equal(await t2ERC20Contract.decimals(), decimals)
  })

  it('Should initialize if the pool does not exist', async function () {
    let erc20Address = [t1ERC20Contract.address, t2ERC20Contract.address]
    erc20Address = erc20Address.sort()
    // Creates pool if doesn't already exist
    await uniswapV3NPositionManager.methods.createAndInitializePoolIfNecessary(erc20Address[0], erc20Address[1], pairFee, calculateSqrtPriceX96(1).toFixed(0)).send({ from: accounts[0] })
    // Gets the deployed Pool address for the Pair and creates a web3 contract

    deployedPairAddress = await uniswapV3Factory.methods.getPool(erc20Address[0], erc20Address[1], pairFee).call()
    deployedPairContract = new web3.eth.Contract(UniSwapPoolABI, deployedPairAddress)
    assert.notEqual(deployedPairAddress, undefined)
  })

  /**
   * Currently working on implementing automated method of providing liquidity
   */
  it('Should provide liquidity to pool', async function () {
    // Get tick and tick spacing
    let slot0 = await deployedPairContract.methods.slot0().call()
    let tickSpacing = parseInt(await deployedPairContract.methods.tickSpacing().call())
    // Get correct token order for deployed contract pair
    let token0 = await deployedPairContract.methods.token0().call()
    let token1 = await deployedPairContract.methods.token1().call()
    // Params needed for mint
    let params = {
      token0: token0,
      token1: token1,
      fee: pairFee,
      tickLower: parseInt(slot0.tick) - tickSpacing * 2,
      tickUpper: parseInt(slot0.tick) + tickSpacing * 2,
      amount0Desired: 10,
      amount1Desired: 10,
      amount0Min: 0,
      amount1Min: 0,
      recipient: accounts[0],
      deadline: 5000000000
    }
    await t1ERC20Contract.approve(UniSwapV3NPositionManagerAddress, BigNumber(1000).shiftedBy(decimals).toFixed(0), { from: accounts[0] })
    await t2ERC20Contract.approve(UniSwapV3NPositionManagerAddress, BigNumber(1000).shiftedBy(decimals).toFixed(0), { from: accounts[0] })
    await uniswapV3NPositionManager.methods.mint(params).send({ from: accounts[0] })
  })

  /**
   * TODO: Implement trades using the pool once liquidity has been provided for testing
   */
})

