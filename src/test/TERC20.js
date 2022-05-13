// https://trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts.html
// The link above is a good resource for everything related to truffle contracts.

const { web3, assert, network } = require("hardhat")
const { UniSwapV3RouterAddress, UniSwapV3FactoryAddress, UniSwapV3FactoryABI, UniSwapPoolABI, UniSwapV3NPositionManagerAddress, UniSwapV3NPositionManagerABI } = config.EVMAddresses
const { BigNumber } = require('bignumber.js')
const { calculateSqrtPriceX96, calculatePriceFromX96 } = require('../util/TokenUtil')

// Creates a truffe contract from compiled artifacts.
const nERC20 = artifacts.require("TERC20")
const UniSwapSingleSwap = artifacts.require("UniSwapSingleSwap")

// Creates uniswap V3 Factory contract using web3
const uniswapV3Factory = new web3.eth.Contract(UniSwapV3FactoryABI, UniSwapV3FactoryAddress)
const uniswapV3NPositionManager = new web3.eth.Contract(UniSwapV3NPositionManagerABI, UniSwapV3NPositionManagerAddress)


const decimals = 18
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
    //deploy contract
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

  // it('Should deploy two tokens to new Uniswap V3 Pool', async function () {
  //   // Creates the pool for the two test tokens
  //   await uniswapV3Factory.methods.createPool(t1ERC20Contract.address, t2ERC20Contract.address, pairFee).send({ from: accounts[0] })
  //   // Gets the deployed Pool address for the Pair and creates a web3 contract
  //   deployedPairAddress = await uniswapV3Factory.methods.getPool(t1ERC20Contract.address, t2ERC20Contract.address, pairFee).call()
  //   deployedPairContract = new web3.eth.Contract(UniSwapPoolABI, deployedPairAddress)
  //   assert.notEqual(deployedPairAddress, undefined)

  //   let slot0 = await deployedPairContract.methods.slot0().call()
  //   assert.equal(slot0.unlocked, false)
  // })

  // it('Should initialize deployed pool sqrt price', async function () {
  //   // Calculates initial sqrt Price x96 for pool
  //   let price = 50
  //   let sqrtPriceX96 = calculateSqrtPriceX96(price)
  //   // Initializes the pool with sqrt price x96
  //   await deployedPairContract.methods.initialize(sqrtPriceX96.toFixed(0)).send({ from: accounts[0] })
  //   // Calls slot0 to ensure pool is unlocked and sqrt price matches what we initalized
  //   let slot0 = await deployedPairContract.methods.slot0().call()
  //   assert.equal(slot0.unlocked, true)
  //   assert.equal(slot0.sqrtPriceX96.toString(), sqrtPriceX96.toFixed(0))
  //   // Checks to ensure the sqrt math is working correctly
  //   assert.equal(price.toFixed(8), calculatePriceFromX96(slot0.sqrtPriceX96.toString(), decimals, decimals).toFixed(8))

  // })


  // it('Should mint liquidity', async function () {
  //   let slot0 = await deployedPairContract.methods.slot0().call()
  //   console.log(slot0)
  //   let tickLower = (slot0.tick / 2).toFixed(0)
  //   let tickUpper = (slot0.tick * 1.5).toFixed(0)
  //   deployedPairContract.methods.mint(accounts[0], tickLower, tickUpper, BigNumber(100).shiftedBy(decimals).toFixed(0), '')
  //   console.log(await deployedPairContract.methods.slot0().call())
  // })

  it('Should initialize if the pool does not exist', async function () {
    // Creates pool if doesn't already exist
    await uniswapV3NPositionManager.methods.createAndInitializePoolIfNecessary(t2ERC20Contract.address, t1ERC20Contract.address, pairFee, calculateSqrtPriceX96(50).toFixed(0)).send({ from: accounts[0] })
    // Gets the deployed Pool address for the Pair and creates a web3 contract
    deployedPairAddress = await uniswapV3Factory.methods.getPool(t1ERC20Contract.address, t2ERC20Contract.address, pairFee).call()
    deployedPairContract = new web3.eth.Contract(UniSwapPoolABI, deployedPairAddress)
    assert.notEqual(deployedPairAddress, undefined)
    console.log(deployedPairAddress)
  })

  it('Should provide liquidity to pool', async function () {
    let slot0 = await deployedPairContract.methods.slot0().call()
    let tickLower = (slot0.tick / 2).toFixed(0)
    let tickUpper = (slot0.tick * 1.5).toFixed(0)
    let token0 = await deployedPairContract.methods.token0().call()
    let token1 = await deployedPairContract.methods.token1().call()
    let params = {
      token0: token0,
      token1: token1,
      fee: pairFee,
      tickLower: tickLower,
      tickUpper: tickUpper,
      amount0Desired: 500,
      amount1Desired: 1,
      amount0Min: 0,
      amount1Min: 0,
      recipient: accounts[0],
      deadline: 5000000000
    }
    await t1ERC20Contract.approve(UniSwapV3NPositionManagerAddress, BigNumber(20).shiftedBy(decimals).toFixed(0))
    await t2ERC20Contract.approve(UniSwapV3NPositionManagerAddress, BigNumber(20).shiftedBy(decimals).toFixed(0))
    await uniswapV3NPositionManager.methods.mint(params).send({ from: accounts[0] })
  })
})

