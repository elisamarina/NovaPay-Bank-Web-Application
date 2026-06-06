// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

/// @title IPriceOracle
/// @notice Normalized price oracle interface used by the NovaPay gateway.
/// @dev Keeping this boundary small lets the gateway support Chainlink or a
///      fixed test oracle without changing minting logic.
interface IPriceOracle {
    /// @notice Normalized latest price response.
    /// @param answer Oracle price answer.
    /// @param decimals Number of decimals used by the price answer.
    /// @param updatedAt Timestamp when the price was last updated.
    /// @param maxAge Maximum accepted age for the returned answer.
    struct PriceData {
        int256 answer;
        uint8 decimals;
        uint256 updatedAt;
        uint256 maxAge;
    }

    error InvalidOraclePrice();
    error StaleOraclePrice(uint256 updatedAt, uint256 maxAge);
    error SequencerDown();
    error SequencerGracePeriodNotOver();

    /// @notice Returns the latest validated price data.
    /// @return price Validated price response.
    function latestPrice() external view returns (PriceData memory price);
}
