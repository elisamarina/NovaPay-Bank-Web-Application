// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Test} from "forge-std/Test.sol";

import {IPriceOracle} from "../src/interfaces/IPriceOracle.sol";
import {ChainlinkPriceOracle} from "../src/oracles/ChainlinkPriceOracle.sol";
import {MockChainlinkAggregator} from "./mocks/MockChainlinkAggregator.sol";

contract ChainlinkPriceOracleTest is Test {
    MockChainlinkAggregator private priceFeed;
    MockChainlinkAggregator private sequencerFeed;
    ChainlinkPriceOracle private oracle;

    function setUp() public {
        vm.warp(10 days);

        priceFeed = new MockChainlinkAggregator(8);
        sequencerFeed = new MockChainlinkAggregator(0);
        priceFeed.setRoundData(10, 2_000e8, block.timestamp - 1 hours, block.timestamp - 1 hours, 10);
        sequencerFeed.setRoundData(1, 0, block.timestamp - 2 hours, block.timestamp - 2 hours, 1);
        oracle = new ChainlinkPriceOracle(address(priceFeed), 1 days, address(sequencerFeed), 1 hours);
    }

    function testReturnsValidatedLatestPrice() public view {
        IPriceOracle.PriceData memory price = oracle.latestPrice();

        assertEq(price.answer, 2_000e8);
        assertEq(price.decimals, 8);
        assertEq(price.updatedAt, block.timestamp - 1 hours);
        assertEq(price.maxAge, 1 days);
    }

    function testRevertsForInvalidPrice() public {
        priceFeed.setRoundData(10, 0, block.timestamp - 1 hours, block.timestamp - 1 hours, 10);

        vm.expectRevert(IPriceOracle.InvalidOraclePrice.selector);
        oracle.latestPrice();
    }

    function testRevertsForIncompleteRound() public {
        priceFeed.setRoundData(10, 2_000e8, block.timestamp - 1 hours, block.timestamp - 1 hours, 9);

        vm.expectRevert(ChainlinkPriceOracle.IncompleteOracleRound.selector);
        oracle.latestPrice();
    }

    function testRevertsForStalePrice() public {
        priceFeed.setRoundData(10, 2_000e8, block.timestamp - 2 days, block.timestamp - 2 days, 10);

        vm.expectRevert(abi.encodeWithSelector(IPriceOracle.StaleOraclePrice.selector, block.timestamp - 2 days, 1 days));
        oracle.latestPrice();
    }

    function testRevertsWhenSequencerIsDown() public {
        sequencerFeed.setRoundData(1, 1, block.timestamp - 2 hours, block.timestamp - 2 hours, 1);

        vm.expectRevert(IPriceOracle.SequencerDown.selector);
        oracle.latestPrice();
    }

    function testRevertsDuringSequencerGracePeriod() public {
        sequencerFeed.setRoundData(1, 0, block.timestamp - 30 minutes, block.timestamp - 30 minutes, 1);

        vm.expectRevert(IPriceOracle.SequencerGracePeriodNotOver.selector);
        oracle.latestPrice();
    }

    function testCanRunWithoutSequencerFeed() public {
        ChainlinkPriceOracle oracleWithoutSequencer =
            new ChainlinkPriceOracle(address(priceFeed), 1 days, address(0), 0);

        IPriceOracle.PriceData memory price = oracleWithoutSequencer.latestPrice();

        assertEq(price.answer, 2_000e8);
    }
}
