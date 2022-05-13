//https://trufflesuite.com/docs/truffle/getting-started/interacting-with-your-contracts.html
//The link above is a good resource for everything related to truffle contracts.

//Creates a truffe contract from compiled artifacts.
const { network, config, web3 } = require('hardhat')
const UniSwapSingleSwap = artifacts.require("UniSwapSingleSwap")
const { WTOKEN, DAI } = config.EVMAddresses[network.name]
const { ERC20ABI, UniSwapV3RouterAddress } = config.EVMAddresses
const { wrapToken } = require('../util/TokenUtil')

const WTOKENContract = new web3.eth.Contract(ERC20ABI, WTOKEN)
const DAIContract = new web3.eth.Contract(ERC20ABI, DAI)

// Vanilla Mocha test. Increased compatibility with tools that integrate Mocha.
describe("UniSwapSingleSwap contract", function () {
  let accounts
  let uniSwapSingleSwap
  before(async function () {
    accounts = await web3.eth.getAccounts()
    //Checks to see if the first account has ETH
    let balance = await web3.eth.getBalance(accounts[0])
    assert.notEqual(balance, 0)
    //deploy contract
    uniSwapSingleSwap = await UniSwapSingleSwap.new(UniSwapV3RouterAddress)
  })

  it("Should deploy with the correct address", async function () {
    assert.equal(await uniSwapSingleSwap.swapRouter(), UniSwapV3RouterAddress)
  })

  it('Should swap token values WTOKEN for DAI', async function () {
    let WTokenAmountToTransfer = 15
    //Send ETH to WTOKEN contract in return for WTOKEN
    await wrapToken(WTokenAmountToTransfer, accounts[0], WTOKENContract)

    let wTokenAmount = await WTOKENContract.methods.balanceOf(accounts[0]).call()
    console.log(wTokenAmount.toString())

    await WTOKENContract.methods.approve(uniSwapSingleSwap.address, web3.utils.toWei(WTokenAmountToTransfer.toString(), 'ether')).send({ from: accounts[0] })

    //The link at the top of this file describes how to override 
    //the from value when dealing with transactions using truffle contracts.
    //I am sending the WTokenAmountToTransfer to the contract to be swapped on
    //UniSwap V3 Pool for DAI. The DAI is then transferred back to the account
    //that sent the request.
    await uniSwapSingleSwap.swapExactInputSingle(web3.utils.toWei(WTokenAmountToTransfer.toString(), 'ether'), 0, WTOKEN, DAI, 3000, { from: accounts[0] })
    // let DAIBal = await DAIContract.methods.balanceOf(accounts[0]).call()
    // assert.notEqual(DAIBal / 10 ** 8, 0)
  })
})