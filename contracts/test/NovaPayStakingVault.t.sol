// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Test} from "forge-std/Test.sol";

import {INovaPayStakingVault} from "../src/interfaces/INovaPayStakingVault.sol";
import {NovaPayStakingVault} from "../src/NovaPayStakingVault.sol";
import {NovaUSD} from "../src/NovaUSD.sol";

contract NovaPayStakingVaultTest is Test {
    address private owner = address(0xA11CE);
    address private user = address(0xB0B);
    address private rewardReserve = address(0xCAFE);

    NovaUSD private novaUSD;
    NovaPayStakingVault private vault;

    function setUp() public {
        novaUSD = new NovaUSD(owner);

        vm.prank(owner);
        novaUSD.setMinter(owner, true);

        vm.startPrank(owner);
        novaUSD.mint(user, 1_000 ether);
        novaUSD.mint(rewardReserve, 500 ether);
        vm.stopPrank();

        vault = new NovaPayStakingVault(novaUSD, rewardReserve, 1 ether, 700, 365 days, owner);
    }

    function testVaultMetadataAndConfig() public view {
        assertEq(vault.name(), "Staked NovaUSD");
        assertEq(vault.symbol(), "sNovaUSD");
        assertEq(vault.asset(), address(novaUSD));
        assertEq(vault.decimals(), 24);

        INovaPayStakingVault.VaultConfig memory config = vault.vaultConfig();
        assertEq(config.asset, address(novaUSD));
        assertEq(config.rewardReserve, rewardReserve);
        assertEq(config.minDeposit, 1 ether);
        assertEq(config.aprBps, 700);
        assertEq(config.yearInSeconds, 365 days);
        assertFalse(config.paused);
    }

    function testDepositIssuesSNovaUSDShares() public {
        vm.startPrank(user);
        novaUSD.approve(address(vault), 100 ether);
        uint256 shares = vault.deposit(100 ether, user);
        vm.stopPrank();

        assertEq(vault.totalAssets(), 100 ether);
        assertEq(vault.balanceOf(user), shares);
        assertGt(shares, 0);
    }

    function testDepositBelowMinimumReverts() public {
        vm.startPrank(user);
        novaUSD.approve(address(vault), 0.5 ether);
        vm.expectRevert(abi.encodeWithSelector(NovaPayStakingVault.BelowMinimumDeposit.selector, 0.5 ether, 1 ether));
        vault.deposit(0.5 ether, user);
        vm.stopPrank();
    }

    function testRedeemReturnsNovaUSD() public {
        vm.startPrank(user);
        novaUSD.approve(address(vault), 100 ether);
        uint256 shares = vault.deposit(100 ether, user);
        uint256 assets = vault.redeem(shares, user, user);
        vm.stopPrank();

        assertEq(assets, 100 ether);
        assertEq(novaUSD.balanceOf(user), 1_000 ether);
        assertEq(vault.totalAssets(), 0);
    }

    function testRewardFundingIncreasesSharePrice() public {
        vm.startPrank(user);
        novaUSD.approve(address(vault), 100 ether);
        vault.deposit(100 ether, user);
        vm.stopPrank();

        uint256 sharePriceBefore = vault.sharePrice();

        vm.startPrank(rewardReserve);
        novaUSD.approve(address(vault), 10 ether);
        vault.fundRewards(10 ether);
        vm.stopPrank();

        assertGt(vault.sharePrice(), sharePriceBefore);
        assertEq(vault.totalAssets(), 110 ether);
    }

    function testOnlyRewardReserveCanFundRewards() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(NovaPayStakingVault.UnauthorizedRewardFunder.selector, user));
        vault.fundRewards(10 ether);
    }

    function testPreviewRewardUsesConfiguredApr() public view {
        INovaPayStakingVault.RewardPreview memory preview = vault.previewReward(1_000 ether, 365 days);

        assertEq(preview.principal, 1_000 ether);
        assertEq(preview.aprBps, 700);
        assertEq(preview.elapsedTime, 365 days);
        assertEq(preview.reward, 70 ether);
    }

    function testOwnerCanUpdateAprAndYear() public {
        vm.startPrank(owner);
        vault.setAprBps(500);
        vault.setYearInSeconds(360 days);
        vm.stopPrank();

        INovaPayStakingVault.RateConfig memory config = vault.rateConfig();
        assertEq(config.aprBps, 500);
        assertEq(config.yearInSeconds, 360 days);
    }

    function testNonOwnerCannotUpdateApr() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        vault.setAprBps(500);
    }

    function testCannotSetInvalidYear() public {
        vm.prank(owner);
        vm.expectRevert(NovaPayStakingVault.InvalidYearInSeconds.selector);
        vault.setYearInSeconds(0);
    }

    function testPausedVaultReportsZeroLimitsAndBlocksActions() public {
        vm.prank(owner);
        vault.pause();

        assertEq(vault.maxDeposit(user), 0);
        assertEq(vault.maxMint(user), 0);
        assertEq(vault.maxRedeem(user), 0);

        vm.startPrank(user);
        novaUSD.approve(address(vault), 100 ether);
        vm.expectRevert();
        vault.deposit(100 ether, user);
        vm.stopPrank();
    }

    function testPausedVaultBlocksRedeem() public {
        vm.startPrank(user);
        novaUSD.approve(address(vault), 100 ether);
        uint256 shares = vault.deposit(100 ether, user);
        vm.stopPrank();

        vm.prank(owner);
        vault.pause();

        vm.prank(user);
        vm.expectRevert();
        vault.redeem(shares, user, user);
    }

    function testOwnerCanUpdateRewardReserveAndMinDeposit() public {
        address newReserve = address(0xD00D);

        vm.startPrank(owner);
        vault.setRewardReserve(newReserve);
        vault.setMinDeposit(2 ether);
        vm.stopPrank();

        assertEq(vault.rewardReserve(), newReserve);
        assertEq(vault.minDeposit(), 2 ether);
    }
}
