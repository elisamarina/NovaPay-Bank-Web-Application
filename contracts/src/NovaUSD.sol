// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title NovaUSD
/// @notice Testnet ERC-20 asset used by NovaPay gateway and staking vault.
/// @dev Minting is role-gated by the owner so the gateway can mint without
///      receiving full ownership of the token contract.
contract NovaUSD is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    mapping(address minter => bool allowed) private _minters;

    error ZeroAddress();
    error UnauthorizedMinter(address account);

    event MinterUpdated(address indexed minter, bool allowed);

    constructor(address initialOwner) ERC20("NovaUSD", "NOVAUSD") ERC20Permit("NovaUSD") Ownable(initialOwner) {}

    /// @notice Returns whether an account can mint NovaUSD.
    function isMinter(address account) external view returns (bool) {
        return _minters[account];
    }

    /// @notice Allows or revokes minting rights for an account.
    /// @param minter Account whose minting permission is updated.
    /// @param allowed Whether the account is allowed to mint.
    function setMinter(address minter, bool allowed) external onlyOwner {
        if (minter == address(0)) revert ZeroAddress();

        _minters[minter] = allowed;
        emit MinterUpdated(minter, allowed);
    }

    /// @notice Mints NovaUSD to a recipient.
    /// @dev Intended for the gateway on testnet. Production minting would need a
    ///      real collateral model and governance process.
    /// @param to Recipient of the minted tokens.
    /// @param amount Amount of NovaUSD to mint.
    function mint(address to, uint256 amount) external {
        if (!_minters[msg.sender]) revert UnauthorizedMinter(msg.sender);

        _mint(to, amount);
    }
}
