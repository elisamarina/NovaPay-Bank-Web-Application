// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Test} from "forge-std/Test.sol";

import {INovaPayGateway} from "../src/interfaces/INovaPayGateway.sol";
import {NovaPayGateway} from "../src/NovaPayGateway.sol";
import {NovaUSD} from "../src/NovaUSD.sol";
import {MockPriceOracle} from "./mocks/MockPriceOracle.sol";

contract NovaPayGatewayTest is Test {
    address private owner = address(0xA11CE);
    address private user = address(0xB0B);
    address private recipient = address(0xCAFE);

    NovaUSD private novaUSD;
    MockPriceOracle private oracle;
    NovaPayGateway private gateway;

    function setUp() public {
        novaUSD = new NovaUSD(owner);
        oracle = new MockPriceOracle();
        oracle.setPrice(2_000e8, 8, block.timestamp, 1 days);
        gateway = new NovaPayGateway(address(novaUSD), address(oracle), 0.01 ether, owner);

        vm.prank(owner);
        novaUSD.setMinter(address(gateway), true);
        vm.deal(user, 10 ether);
    }

    function testGatewayConfig() public view {
        INovaPayGateway.GatewayConfig memory config = gateway.gatewayConfig();

        assertEq(config.novaUSD, address(novaUSD));
        assertEq(config.priceOracle, address(oracle));
        assertEq(config.minEthDeposit, 0.01 ether);
        assertFalse(config.paused);
    }

    function testQuotesNovaUSDFromEthAmount() public view {
        INovaPayGateway.MintQuote memory quote = gateway.quoteNovaUSD(1 ether);

        assertEq(quote.ethAmount, 1 ether);
        assertEq(quote.ethUsdPrice, 2_000e8);
        assertEq(quote.priceDecimals, 8);
        assertEq(quote.novaUSDAmount, 2_000 ether);
    }

    function testCannotQuoteZeroEthAmount() public {
        vm.expectRevert(NovaPayGateway.InvalidEthAmount.selector);
        gateway.quoteNovaUSD(0);
    }

    function testDepositEthMintsNovaUSD() public {
        vm.prank(user);
        uint256 minted = gateway.depositEth{value: 1 ether}();

        assertEq(minted, 2_000 ether);
        assertEq(novaUSD.balanceOf(user), 2_000 ether);
        assertEq(address(gateway).balance, 1 ether);
    }

    function testDepositBelowMinimumReverts() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(NovaPayGateway.BelowMinimumDeposit.selector, 0.001 ether, 0.01 ether));
        gateway.depositEth{value: 0.001 ether}();
    }

    function testPausedGatewayBlocksDeposit() public {
        vm.prank(owner);
        gateway.pause();

        vm.prank(user);
        vm.expectRevert(Pausable.EnforcedPause.selector);
        gateway.depositEth{value: 1 ether}();
    }

    function testOnlyOwnerCanPause() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        gateway.pause();
    }

    function testOwnerCanUpdateOracle() public {
        MockPriceOracle newOracle = new MockPriceOracle();

        vm.prank(owner);
        gateway.setPriceOracle(address(newOracle));

        assertEq(address(gateway.priceOracle()), address(newOracle));
    }

    function testOwnerCanWithdrawEth() public {
        vm.prank(user);
        gateway.depositEth{value: 1 ether}();

        uint256 recipientBalanceBefore = recipient.balance;

        vm.prank(owner);
        gateway.withdrawEth(recipient, 0.5 ether);

        assertEq(recipient.balance - recipientBalanceBefore, 0.5 ether);
        assertEq(address(gateway).balance, 0.5 ether);
    }

    function testNonOwnerCannotWithdrawEth() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        gateway.withdrawEth(recipient, 1 ether);
    }
}
