// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

import {INovaPayGateway} from "./interfaces/INovaPayGateway.sol";
import {IPriceOracle} from "./interfaces/IPriceOracle.sol";
import {NovaUSD} from "./NovaUSD.sol";

/// @title NovaPayGateway
/// @notice Accepts test ETH deposits and mints NovaUSD using a validated price oracle.
/// @dev This is a testnet gateway, not a production stablecoin collateral system.
contract NovaPayGateway is INovaPayGateway, Ownable, Pausable, ReentrancyGuard {
    NovaUSD public immutable novaUSD;
    IPriceOracle public priceOracle;
    uint256 public minEthDeposit;

    error ZeroAddress();
    error InvalidEthAmount();
    error BelowMinimumDeposit(uint256 amount, uint256 minimum);
    error EthTransferFailed();

    event PriceOracleUpdated(address indexed oldOracle, address indexed newOracle);
    event MinEthDepositUpdated(uint256 oldMinimum, uint256 newMinimum);
    event EthWithdrawn(address indexed recipient, uint256 amount);

    constructor(address novaUSD_, address priceOracle_, uint256 minEthDeposit_, address initialOwner)
        Ownable(initialOwner)
    {
        if (novaUSD_ == address(0) || priceOracle_ == address(0)) {
            revert ZeroAddress();
        }

        novaUSD = NovaUSD(novaUSD_);
        priceOracle = IPriceOracle(priceOracle_);
        minEthDeposit = minEthDeposit_;
    }

    /// @inheritdoc INovaPayGateway
    function gatewayConfig() external view returns (GatewayConfig memory config) {
        return GatewayConfig({
            novaUSD: address(novaUSD), priceOracle: address(priceOracle), minEthDeposit: minEthDeposit, paused: paused()
        });
    }

    /// @inheritdoc INovaPayGateway
    function quoteNovaUSD(uint256 ethAmount) public view returns (MintQuote memory quote) {
        if (ethAmount == 0) revert InvalidEthAmount();

        IPriceOracle.PriceData memory price = priceOracle.latestPrice();
        uint256 ethUsdPrice = uint256(price.answer);
        uint256 novaUSDAmount = Math.mulDiv(ethAmount, ethUsdPrice, 10 ** price.decimals);

        return MintQuote({
            ethAmount: ethAmount, ethUsdPrice: ethUsdPrice, priceDecimals: price.decimals, novaUSDAmount: novaUSDAmount
        });
    }

    /// @inheritdoc INovaPayGateway
    function depositEth() external payable nonReentrant whenNotPaused returns (uint256 novaUSDAmount) {
        if (msg.value < minEthDeposit) {
            revert BelowMinimumDeposit(msg.value, minEthDeposit);
        }

        MintQuote memory quote = quoteNovaUSD(msg.value);
        novaUSDAmount = quote.novaUSDAmount;
        novaUSD.mint(msg.sender, novaUSDAmount);

        emit EthDeposited(msg.sender, msg.value, novaUSDAmount);
    }

    /// @notice Updates the oracle used for ETH/USD quotes.
    function setPriceOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert ZeroAddress();

        address oldOracle = address(priceOracle);
        priceOracle = IPriceOracle(newOracle);
        emit PriceOracleUpdated(oldOracle, newOracle);
    }

    /// @notice Updates the minimum accepted ETH deposit.
    function setMinEthDeposit(uint256 newMinimum) external onlyOwner {
        uint256 oldMinimum = minEthDeposit;
        minEthDeposit = newMinimum;
        emit MinEthDepositUpdated(oldMinimum, newMinimum);
    }

    /// @notice Pauses ETH deposits.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses ETH deposits.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Withdraws accumulated test ETH from the gateway.
    /// @dev Kept owner-only so testnet ETH can be recovered without affecting
    ///      NovaUSD balances already minted to users.
    function withdrawEth(address recipient, uint256 amount) external onlyOwner nonReentrant {
        if (recipient == address(0)) revert ZeroAddress();

        (bool success,) = recipient.call{value: amount}("");
        if (!success) revert EthTransferFailed();

        emit EthWithdrawn(recipient, amount);
    }
}
