// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockERC20Token
 * @notice Mock token with faucet functionality for testing
 */
contract MockERC20Token is ERC20, Ownable {
    uint8 private _decimals;
    

    uint256 public faucetAmount;
    mapping(address => uint256) public lastFaucetTime;
    uint256 public faucetCooldown = 1 hours;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_,
        uint256 initialSupply,
        uint256 _faucetAmount
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        faucetAmount = _faucetAmount;
        _mint(msg.sender, initialSupply);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    /**
     * @notice Mint tokens to any address (for testing)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @notice Faucet function - users can claim tokens periodically
     */
    function faucet() external {
        require(
            block.timestamp >= lastFaucetTime[msg.sender] + faucetCooldown,
            "Faucet cooldown not elapsed"
        );
        
        lastFaucetTime[msg.sender] = block.timestamp;
        _mint(msg.sender, faucetAmount);
    }
    
    /**
     * @notice Update faucet amount
     */
    function setFaucetAmount(uint256 _amount) external onlyOwner {
        faucetAmount = _amount;
    }
    
    /**
     * @notice Update faucet cooldown
     */
    function setFaucetCooldown(uint256 _cooldown) external onlyOwner {
        faucetCooldown = _cooldown;
    }
}