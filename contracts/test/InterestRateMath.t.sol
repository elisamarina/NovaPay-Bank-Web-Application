// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Test} from "forge-std/Test.sol";
import {InterestRateMath} from "../src/libraries/InterestRateMath.sol";

contract InterestRateMathHarness {
    function calculateReward(uint256 principal, uint256 aprBps, uint256 elapsedTime) external pure returns (uint256) {
        return InterestRateMath.calculateReward(principal, aprBps, elapsedTime);
    }

    function calculateReward(uint256 principal, uint256 aprBps, uint256 elapsedTime, uint256 yearInSeconds)
        external
        pure
        returns (uint256)
    {
        return InterestRateMath.calculateReward(principal, aprBps, elapsedTime, yearInSeconds);
    }
}

contract InterestRateMathTest is Test {
    InterestRateMathHarness private mathHarness;

    function setUp() public {
        mathHarness = new InterestRateMathHarness();
    }

    function testCalculatesOneYearReward() public view {
        uint256 principal = 1_000 ether;
        uint256 aprBps = 500;

        uint256 reward = mathHarness.calculateReward(principal, aprBps, 365 days);

        assertEq(reward, 50 ether);
    }

    function testCalculatesPartialYearReward() public view {
        uint256 principal = 1_000 ether;
        uint256 aprBps = 500;

        uint256 reward = mathHarness.calculateReward(principal, aprBps, 182.5 days);

        assertEq(reward, 25 ether);
    }

    function testRevertsWhenYearInSecondsIsZero() public {
        vm.expectRevert(InterestRateMath.InvalidYearInSeconds.selector);

        mathHarness.calculateReward(1_000 ether, 500, 365 days, 0);
    }
}
