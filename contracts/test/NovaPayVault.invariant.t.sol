// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Test} from "forge-std/Test.sol";

import {NovaPayStakingVault} from "../src/NovaPayStakingVault.sol";
import {NovaUSD} from "../src/NovaUSD.sol";
import {NovaPayVaultHandler} from "./handlers/NovaPayVaultHandler.sol";

contract NovaPayVaultInvariantTest is Test {
    address private owner = address(0xA11CE);
    address private rewardReserve = address(0xCAFE);
    address private alice = address(0xA1);
    address private bob = address(0xB2);
    address private carol = address(0xC3);

    NovaUSD private novaUSD;
    NovaPayStakingVault private vault;
    NovaPayVaultHandler private handler;

    uint256 private initialSharePrice;

    function setUp() public {
        novaUSD = new NovaUSD(owner);

        vm.prank(owner);
        novaUSD.setMinter(owner, true);

        address[] memory actors = new address[](3);
        actors[0] = alice;
        actors[1] = bob;
        actors[2] = carol;

        vm.startPrank(owner);
        for (uint256 i = 0; i < actors.length; i++) {
            novaUSD.mint(actors[i], 1_000 ether);
        }
        novaUSD.mint(rewardReserve, 10_000 ether);
        vm.stopPrank();

        vault = new NovaPayStakingVault(novaUSD, rewardReserve, 1 ether, 700, 365 days, owner);
        handler = new NovaPayVaultHandler(novaUSD, vault, rewardReserve, actors);
        initialSharePrice = vault.sharePrice();

        targetContract(address(handler));
    }

    function invariantVaultAssetsMatchTokenBalance() public view {
        assertEq(vault.totalAssets(), novaUSD.balanceOf(address(vault)));
    }

    function invariantSharePriceDoesNotFallBelowInitialPrice() public view {
        assertGe(vault.sharePrice(), initialSharePrice);
    }

    function invariantHandlerHasActors() public view {
        assertEq(handler.actorsLength(), 3);
    }
}
