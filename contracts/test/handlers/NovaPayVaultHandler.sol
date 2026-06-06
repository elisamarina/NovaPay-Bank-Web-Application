// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Test} from "forge-std/Test.sol";

import {NovaPayStakingVault} from "../../src/NovaPayStakingVault.sol";
import {NovaUSD} from "../../src/NovaUSD.sol";

contract NovaPayVaultHandler is Test {
    NovaUSD public immutable novaUSD;
    NovaPayStakingVault public immutable vault;
    address public immutable rewardReserve;

    address[] private _actors;

    uint256 public depositCalls;
    uint256 public redeemCalls;
    uint256 public fundRewardCalls;

    constructor(NovaUSD novaUSD_, NovaPayStakingVault vault_, address rewardReserve_, address[] memory actors_) {
        novaUSD = novaUSD_;
        vault = vault_;
        rewardReserve = rewardReserve_;
        _actors = actors_;
    }

    function deposit(uint256 actorSeed, uint256 amount) external {
        address actor = _actor(actorSeed);
        uint256 balance = novaUSD.balanceOf(actor);
        if (balance == 0) return;

        amount = bound(amount, vault.minDeposit(), balance);

        vm.startPrank(actor);
        novaUSD.approve(address(vault), amount);
        vault.deposit(amount, actor);
        vm.stopPrank();

        depositCalls++;
    }

    function redeem(uint256 actorSeed, uint256 shareAmount) external {
        address actor = _actor(actorSeed);
        uint256 balance = vault.balanceOf(actor);
        if (balance == 0) return;

        shareAmount = bound(shareAmount, 1, balance);

        vm.prank(actor);
        vault.redeem(shareAmount, actor, actor);

        redeemCalls++;
    }

    function fundRewards(uint256 amount) external {
        uint256 balance = novaUSD.balanceOf(rewardReserve);
        if (balance == 0) return;

        amount = bound(amount, 1, balance);

        vm.startPrank(rewardReserve);
        novaUSD.approve(address(vault), amount);
        vault.fundRewards(amount);
        vm.stopPrank();

        fundRewardCalls++;
    }

    function actorsLength() external view returns (uint256) {
        return _actors.length;
    }

    function _actor(uint256 seed) private view returns (address) {
        return _actors[seed % _actors.length];
    }
}
