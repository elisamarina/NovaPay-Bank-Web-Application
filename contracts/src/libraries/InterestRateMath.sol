// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @title InterestRateMath
/// @notice Pure helpers for deterministic APR-based reward calculations.
/// @dev The library keeps rate math stateless so it can be tested separately from
///      the vault and reused by future interest-rate model contracts.
library InterestRateMath {
    uint256 internal constant BPS = 10_000;
    uint256 internal constant YEAR = 365 days;

    error InvalidYearInSeconds();

    /// @notice Calculates simple-interest reward using a 365-day year.
    /// @param principal Amount of assets used as the reward base.
    /// @param aprBps Annual percentage rate expressed in basis points.
    /// @param elapsedTime Time interval in seconds.
    /// @return Reward amount for the provided interval.
    function calculateReward(uint256 principal, uint256 aprBps, uint256 elapsedTime) internal pure returns (uint256) {
        return calculateReward(principal, aprBps, elapsedTime, YEAR);
    }

    /// @notice Calculates simple-interest reward using a custom year length.
    /// @dev Uses OpenZeppelin `Math.mulDiv` instead of chained multiplication to
    ///      keep rounding explicit and reduce avoidable overflow risk.
    /// @param principal Amount of assets used as the reward base.
    /// @param aprBps Annual percentage rate expressed in basis points.
    /// @param elapsedTime Time interval in seconds.
    /// @param yearInSeconds Number of seconds treated as one accounting year.
    /// @return Reward amount for the provided interval.
    function calculateReward(uint256 principal, uint256 aprBps, uint256 elapsedTime, uint256 yearInSeconds)
        internal
        pure
        returns (uint256)
    {
        if (yearInSeconds == 0) revert InvalidYearInSeconds();

        uint256 annualReward = Math.mulDiv(principal, aprBps, BPS);

        return Math.mulDiv(annualReward, elapsedTime, yearInSeconds);
    }
}
