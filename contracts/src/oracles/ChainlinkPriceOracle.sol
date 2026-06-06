// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IChainlinkAggregatorV3} from "../interfaces/IChainlinkAggregatorV3.sol";
import {IPriceOracle} from "../interfaces/IPriceOracle.sol";

/// @title ChainlinkPriceOracle
/// @notice Validated Chainlink price adapter for NovaPay gateway quotes.
/// @dev It checks invalid, incomplete, stale, and L2 sequencer-down responses
///      before exposing price data to the gateway.
contract ChainlinkPriceOracle is IPriceOracle {
    IChainlinkAggregatorV3 public immutable priceFeed;
    IChainlinkAggregatorV3 public immutable sequencerUptimeFeed;
    uint256 public immutable overrideMaxAge;
    uint256 public immutable sequencerGracePeriod;

    error ZeroAddress();
    error InvalidMaxAge();
    error IncompleteOracleRound();

    constructor(address priceFeed_, uint256 maxAge_, address sequencerUptimeFeed_, uint256 sequencerGracePeriod_) {
        if (priceFeed_ == address(0)) revert ZeroAddress();
        if (maxAge_ == 0) revert InvalidMaxAge();

        priceFeed = IChainlinkAggregatorV3(priceFeed_);
        sequencerUptimeFeed = IChainlinkAggregatorV3(sequencerUptimeFeed_);
        overrideMaxAge = maxAge_;
        sequencerGracePeriod = sequencerGracePeriod_;
    }

    /// @inheritdoc IPriceOracle
    function latestPrice() external view returns (PriceData memory price) {
        _validateSequencer();

        (uint80 roundId, int256 answer,, uint256 updatedAt, uint80 answeredInRound) = priceFeed.latestRoundData();

        if (answer <= 0) revert InvalidOraclePrice();
        if (updatedAt == 0 || answeredInRound < roundId) revert IncompleteOracleRound();
        if (block.timestamp - updatedAt > overrideMaxAge) {
            revert StaleOraclePrice(updatedAt, overrideMaxAge);
        }

        return PriceData({answer: answer, decimals: priceFeed.decimals(), updatedAt: updatedAt, maxAge: overrideMaxAge});
    }

    function _validateSequencer() private view {
        if (address(sequencerUptimeFeed) == address(0)) return;

        (, int256 answer, uint256 startedAt,,) = sequencerUptimeFeed.latestRoundData();

        if (answer != 0) revert SequencerDown();
        if (block.timestamp - startedAt <= sequencerGracePeriod) {
            revert SequencerGracePeriodNotOver();
        }
    }
}
