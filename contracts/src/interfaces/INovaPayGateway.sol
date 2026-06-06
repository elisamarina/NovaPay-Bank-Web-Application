// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

/// @title INovaPayGateway
/// @notice Gateway for converting test ETH deposits into NovaUSD.
/// @dev The first implementation is testnet-focused; production stablecoin
///      issuance would need a real collateral and compliance model.
interface INovaPayGateway {
    /// @notice Gateway configuration needed by frontend and monitoring tools.
    /// @param novaUSD NovaUSD token address.
    /// @param priceOracle Oracle used to price ETH deposits.
    /// @param minEthDeposit Minimum accepted ETH deposit.
    /// @param paused Whether deposits are currently paused.
    struct GatewayConfig {
        address novaUSD;
        address priceOracle;
        uint256 minEthDeposit;
        bool paused;
    }

    /// @notice Quote for a future NovaUSD mint.
    /// @param ethAmount ETH amount supplied by the user.
    /// @param ethUsdPrice ETH/USD oracle price used for the quote.
    /// @param priceDecimals Decimals of the oracle price.
    /// @param novaUSDAmount NovaUSD amount that would be minted.
    struct MintQuote {
        uint256 ethAmount;
        uint256 ethUsdPrice;
        uint8 priceDecimals;
        uint256 novaUSDAmount;
    }

    /// @notice Emitted when a user deposits ETH and receives NovaUSD.
    event EthDeposited(address indexed user, uint256 ethAmount, uint256 novaUSDAmount);

    /// @notice Returns the current gateway configuration.
    function gatewayConfig() external view returns (GatewayConfig memory config);

    /// @notice Calculates the NovaUSD amount for a given ETH amount.
    /// @param ethAmount ETH amount to quote.
    /// @return quote Mint quote with oracle metadata.
    function quoteNovaUSD(uint256 ethAmount) external view returns (MintQuote memory quote);

    /// @notice Deposits ETH and mints NovaUSD to the caller.
    /// @return novaUSDAmount Amount of NovaUSD minted.
    function depositEth() external payable returns (uint256 novaUSDAmount);
}
