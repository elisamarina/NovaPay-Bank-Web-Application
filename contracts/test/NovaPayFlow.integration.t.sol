// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Test} from "forge-std/Test.sol";

import {INovaPayGateway} from "../src/interfaces/INovaPayGateway.sol";
import {INovaPayStakingVault} from "../src/interfaces/INovaPayStakingVault.sol";
import {NovaPayGateway} from "../src/NovaPayGateway.sol";
import {NovaPayStakingVault} from "../src/NovaPayStakingVault.sol";
import {NovaUSD} from "../src/NovaUSD.sol";
import {MockPriceOracle} from "./mocks/MockPriceOracle.sol";

contract NovaPayFlowIntegrationTest is Test {
    address private owner = address(0xA11CE);
    address private user = address(0xB0B);
    address private rewardReserve = address(0xCAFE);

    NovaUSD private novaUSD;
    MockPriceOracle private oracle;
    NovaPayGateway private gateway;
    NovaPayStakingVault private vault;

    function setUp() public {
        vm.warp(30 days);
        vm.deal(user, 10 ether);

        novaUSD = new NovaUSD(owner);
        oracle = new MockPriceOracle();
        oracle.setPrice(2_000e8, 8, block.timestamp, 1 days);
        gateway = new NovaPayGateway(address(novaUSD), address(oracle), 0.01 ether, owner);
        vault = new NovaPayStakingVault(novaUSD, rewardReserve, 1 ether, 700, 365 days, owner);

        vm.startPrank(owner);
        novaUSD.setMinter(address(gateway), true);
        novaUSD.setMinter(owner, true);
        novaUSD.mint(rewardReserve, 500 ether);
        vm.stopPrank();
    }

    function testFullDepositStakeRewardRedeemFlow() public {
        vm.prank(user);
        uint256 minted = gateway.depositEth{value: 1 ether}();

        assertEq(minted, 2_000 ether);
        assertEq(novaUSD.balanceOf(user), 2_000 ether);

        INovaPayGateway.MintQuote memory quote = gateway.quoteNovaUSD(1 ether);
        assertEq(quote.novaUSDAmount, minted);

        uint256 stakeAmount = 1_000 ether;

        vm.startPrank(user);
        novaUSD.approve(address(vault), stakeAmount);
        uint256 shares = vault.deposit(stakeAmount, user);
        vm.stopPrank();

        assertGt(shares, 0);
        assertEq(vault.totalAssets(), stakeAmount);
        assertEq(vault.balanceOf(user), shares);

        INovaPayStakingVault.RewardPreview memory preview = vault.previewReward(stakeAmount, 365 days);
        assertEq(preview.reward, 70 ether);

        uint256 sharePriceBefore = vault.sharePrice();

        vm.startPrank(rewardReserve);
        novaUSD.approve(address(vault), preview.reward);
        vault.fundRewards(preview.reward);
        vm.stopPrank();

        assertGt(vault.sharePrice(), sharePriceBefore);
        assertEq(vault.totalAssets(), stakeAmount + preview.reward);

        uint256 userBalanceBeforeRedeem = novaUSD.balanceOf(user);

        vm.prank(user);
        uint256 redeemedAssets = vault.redeem(shares, user, user);

        assertGt(redeemedAssets, stakeAmount);
        assertGt(novaUSD.balanceOf(user), userBalanceBeforeRedeem + stakeAmount);
    }

    function testMintWithdrawERC4626Flow() public {
        vm.prank(user);
        gateway.depositEth{value: 1 ether}();

        uint256 sharesToMint = 100 * 10 ** vault.decimals();
        uint256 requiredAssets = vault.previewMint(sharesToMint);

        vm.startPrank(user);
        novaUSD.approve(address(vault), requiredAssets);
        uint256 depositedAssets = vault.mint(sharesToMint, user);
        uint256 burnedShares = vault.withdraw(depositedAssets, user, user);
        vm.stopPrank();

        assertEq(burnedShares, sharesToMint);
        assertEq(vault.balanceOf(user), 0);
    }

    function testOwnerCanRecoverGatewayEthAfterUserMint() public {
        vm.prank(user);
        gateway.depositEth{value: 1 ether}();

        uint256 ownerBalanceBefore = owner.balance;

        vm.prank(owner);
        gateway.withdrawEth(owner, 1 ether);

        assertEq(owner.balance - ownerBalanceBefore, 1 ether);
        assertEq(address(gateway).balance, 0);
    }
}
