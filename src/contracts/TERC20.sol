//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
    Simple ERC20 contract that mints a certain amount during creation of
    the smart contract.
 */
contract TERC20 is ERC20 {
    /**
        Constructor to pass names to ERC20 parent and
        initialize ERC20 amount.
     */
    constructor(
        string memory name_,
        string memory symbol_,
        uint256 amount
    ) ERC20(name_, symbol_) {
        _mint(msg.sender, amount);
    }
}
