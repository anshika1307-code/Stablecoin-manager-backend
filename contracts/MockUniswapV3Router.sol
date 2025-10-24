// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUniswapV3Router
 * @notice Mock router that simulates Uniswap V3 swaps with configurable exchange rates
 */
contract MockUniswapV3Router is Ownable {
    using SafeERC20 for IERC20;
    
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    
    // Exchange rates: tokenIn => tokenOut => rate (in basis points, 10000 = 1:1)
    mapping(address => mapping(address => uint256)) public exchangeRates;
    
    // Slippage simulation (in basis points, default 50 = 0.5%)
    uint256 public slippageBps = 50;
    
    // Fee taken by the router (in basis points, default 30 = 0.3%)
    uint256 public routerFeeBps = 30;
    
    event SwapExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        address indexed recipient,
        uint256 amountIn,
        uint256 amountOut
    );
    
    event ExchangeRateSet(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 rate
    );
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Set exchange rate between two tokens
     * @param tokenIn Input token address
     * @param tokenOut Output token address
     * @param rate Exchange rate in basis points (10000 = 1:1)
     */
    function setExchangeRate(
        address tokenIn,
        address tokenOut,
        uint256 rate
    ) external onlyOwner {
        require(rate > 0, "Rate must be positive");
        exchangeRates[tokenIn][tokenOut] = rate;
        emit ExchangeRateSet(tokenIn, tokenOut, rate);
    }
    
    /**
     * @notice Set multiple exchange rates at once
     */
    function setExchangeRates(
        address[] calldata tokensIn,
        address[] calldata tokensOut,
        uint256[] calldata rates
    ) external onlyOwner {
        require(
            tokensIn.length == tokensOut.length && 
            tokensIn.length == rates.length,
            "Array length mismatch"
        );
        
        for (uint256 i = 0; i < tokensIn.length; i++) {
            require(rates[i] > 0, "Rate must be positive");
            exchangeRates[tokensIn[i]][tokensOut[i]] = rates[i];
            emit ExchangeRateSet(tokensIn[i], tokensOut[i], rates[i]);
        }
    }
    
    /**
     * @notice Set slippage simulation
     */
    function setSlippage(uint256 _slippageBps) external onlyOwner {
        require(_slippageBps <= 1000, "Slippage too high"); // Max 10%
        slippageBps = _slippageBps;
    }
    
    /**
     * @notice Set router fee
     */
    function setRouterFee(uint256 _feeBps) external onlyOwner {
        require(_feeBps <= 1000, "Fee too high"); // Max 10%
        routerFeeBps = _feeBps;
    }
    
    /**
     * @notice Mock implementation of Uniswap V3's exactInputSingle
     */
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external payable returns (uint256 amountOut) {
        require(params.amountIn > 0, "Amount must be positive");
        
        uint256 rate = exchangeRates[params.tokenIn][params.tokenOut];
        require(rate > 0, "Exchange rate not set");
        
       
        IERC20(params.tokenIn).safeTransferFrom(
            msg.sender,
            address(this),
            params.amountIn
        );
        
     
        uint256 baseOutput = (params.amountIn * rate) / 10000;
        uint256 feeAmount = (baseOutput * routerFeeBps) / 10000;
        uint256 slippageAmount = (baseOutput * slippageBps) / 10000;
        
        amountOut = baseOutput - feeAmount - slippageAmount;
        
        require(
            amountOut >= params.amountOutMinimum,
            "Insufficient output amount"
        );
        
      
        IERC20(params.tokenOut).safeTransfer(params.recipient, amountOut);
        
        emit SwapExecuted(
            params.tokenIn,
            params.tokenOut,
            params.recipient,
            params.amountIn,
            amountOut
        );
        
        return amountOut;
    }
    
    /**
     * @notice Calculate expected output for a given input
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut) {
        uint256 rate = exchangeRates[tokenIn][tokenOut];
        require(rate > 0, "Exchange rate not set");
        
        uint256 baseOutput = (amountIn * rate) / 10000;
        uint256 feeAmount = (baseOutput * routerFeeBps) / 10000;
        uint256 slippageAmount = (baseOutput * slippageBps) / 10000;
        
        return baseOutput - feeAmount - slippageAmount;
    }
    
    /**
     * @notice Withdraw tokens (for emergency or maintenance)
     */
    function withdrawToken(
        address token,
        uint256 amount
    ) external onlyOwner {
        IERC20(token).safeTransfer(msg.sender, amount);
    }
    
    /**
     * @notice Fund router with tokens for swaps
     */
    function fundRouter(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }
}