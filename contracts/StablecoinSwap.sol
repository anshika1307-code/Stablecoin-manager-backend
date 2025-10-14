// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract StablecoinSwap {
    using SafeERC20 for IERC20;

    function swap(address fromToken, address toToken, uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        IERC20(fromToken).safeTransferFrom(msg.sender, address(this), amount);
        // for now: 1:1 swap, ignoring fees/slippage 
        IERC20(toToken).safeTransfer(msg.sender, amount);
    }
}
