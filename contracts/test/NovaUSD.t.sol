// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Test} from "forge-std/Test.sol";

import {NovaUSD} from "../src/NovaUSD.sol";

contract NovaUSDTest is Test {
    address private owner = address(0xA11CE);
    address private minter = address(0xB0B);
    address private user = address(0xCAFE);

    NovaUSD private novaUSD;

    function setUp() public {
        novaUSD = new NovaUSD(owner);
    }

    function testMetadata() public view {
        assertEq(novaUSD.name(), "NovaUSD");
        assertEq(novaUSD.symbol(), "NOVAUSD");
        assertEq(novaUSD.decimals(), 18);
        assertEq(novaUSD.owner(), owner);
    }

    function testOwnerCanAuthorizeMinter() public {
        vm.prank(owner);
        novaUSD.setMinter(minter, true);

        assertTrue(novaUSD.isMinter(minter));
    }

    function testNonOwnerCannotAuthorizeMinter() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user));
        novaUSD.setMinter(minter, true);
    }

    function testCannotAuthorizeZeroAddressMinter() public {
        vm.prank(owner);
        vm.expectRevert(NovaUSD.ZeroAddress.selector);
        novaUSD.setMinter(address(0), true);
    }

    function testAuthorizedMinterCanMint() public {
        vm.prank(owner);
        novaUSD.setMinter(minter, true);

        vm.prank(minter);
        novaUSD.mint(user, 100 ether);

        assertEq(novaUSD.balanceOf(user), 100 ether);
        assertEq(novaUSD.totalSupply(), 100 ether);
    }

    function testUnauthorizedMinterCannotMint() public {
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSelector(NovaUSD.UnauthorizedMinter.selector, user));
        novaUSD.mint(user, 100 ether);
    }

    function testOwnerCanRevokeMinter() public {
        vm.startPrank(owner);
        novaUSD.setMinter(minter, true);
        novaUSD.setMinter(minter, false);
        vm.stopPrank();

        assertFalse(novaUSD.isMinter(minter));
    }
}
