// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import {INovaPayStakingVault} from "./interfaces/INovaPayStakingVault.sol";
import {InterestRateMath} from "./libraries/InterestRateMath.sol";

/// @title NovaPayStakingVault
/// @notice ERC-4626 vault that accepts NovaUSD and issues sNovaUSD shares.
/// @dev Rewards are funded as real NovaUSD assets, so yield is represented by
///      ERC-4626 share price appreciation instead of synthetic accounting.
contract NovaPayStakingVault is
    INovaPayStakingVault,
    ERC4626,
    Ownable,
    Pausable,
    ReentrancyGuard
{
    using SafeERC20 for IERC20;

    address public rewardReserve;
    uint256 public minDeposit;
    uint256 private _aprBps;
    uint256 private _yearInSeconds;

    error ZeroAddress();
    error InvalidYearInSeconds();
    error BelowMinimumDeposit(uint256 amount, uint256 minimum);
    error UnauthorizedRewardFunder(address funder);

    event RewardReserveUpdated(
        address indexed oldReserve,
        address indexed newReserve
    );
    event MinDepositUpdated(uint256 oldMinimum, uint256 newMinimum);
    event YearInSecondsUpdated(
        uint256 oldYearInSeconds,
        uint256 newYearInSeconds
    );

    constructor(
        IERC20 asset_,
        address rewardReserve_,
        uint256 minDeposit_,
        uint256 aprBps_,
        uint256 yearInSeconds_,
        address initialOwner
    )
        ERC4626(asset_)
        ERC20("Staked NovaUSD", "sNovaUSD")
        Ownable(initialOwner)
    {
        if (address(asset_) == address(0) || rewardReserve_ == address(0)) {
            revert ZeroAddress();
        }
        if (yearInSeconds_ == 0) revert InvalidYearInSeconds();

        rewardReserve = rewardReserve_;
        minDeposit = minDeposit_;
        _aprBps = aprBps_;
        _yearInSeconds = yearInSeconds_;
    }

    /// @inheritdoc INovaPayStakingVault
    function vaultConfig() external view returns (VaultConfig memory config) {
        return
            VaultConfig({
                asset: asset(),
                rewardReserve: rewardReserve,
                minDeposit: minDeposit,
                aprBps: _aprBps,
                yearInSeconds: _yearInSeconds,
                paused: paused()
            });
    }

    /// @inheritdoc INovaPayStakingVault
    function rateConfig() external view returns (RateConfig memory config) {
        return RateConfig({aprBps: _aprBps, yearInSeconds: _yearInSeconds});
    }

    /// @inheritdoc INovaPayStakingVault
    function vaultStats() external view returns (VaultStats memory stats) {
        return
            VaultStats({
                totalAssets: totalAssets(),
                totalShares: totalSupply(),
                sharePrice: sharePrice(),
                aprBps: _aprBps
            });
    }

    /// @inheritdoc INovaPayStakingVault
    function aprBps() external view returns (uint256) {
        return _aprBps;
    }

    /// @inheritdoc INovaPayStakingVault
    function sharePrice() public view returns (uint256) {
        return convertToAssets(10 ** decimals());
    }

    /// @inheritdoc INovaPayStakingVault
    function previewReward(
        uint256 principal,
        uint256 elapsedTime
    ) external view returns (RewardPreview memory preview) {
        uint256 reward = InterestRateMath.calculateReward(
            principal,
            _aprBps,
            elapsedTime,
            _yearInSeconds
        );

        return
            RewardPreview({
                principal: principal,
                aprBps: _aprBps,
                elapsedTime: elapsedTime,
                reward: reward
            });
    }

    /// @inheritdoc INovaPayStakingVault
    function fundRewards(uint256 assets) external nonReentrant {
        if (msg.sender != rewardReserve)
            revert UnauthorizedRewardFunder(msg.sender);

        IERC20(asset()).safeTransferFrom(msg.sender, address(this), assets);
        emit RewardsFunded(msg.sender, assets);
    }

    /// @notice Updates the target APR used by reward previews.
    function setAprBps(uint256 newAprBps) external onlyOwner {
        uint256 oldAprBps = _aprBps;
        _aprBps = newAprBps;
        emit AprUpdated(oldAprBps, newAprBps);
    }

    /// @notice Updates the accounting year used by reward previews.
    function setYearInSeconds(uint256 newYearInSeconds) external onlyOwner {
        if (newYearInSeconds == 0) revert InvalidYearInSeconds();

        uint256 oldYearInSeconds = _yearInSeconds;
        _yearInSeconds = newYearInSeconds;
        emit YearInSecondsUpdated(oldYearInSeconds, newYearInSeconds);
    }

    /// @notice Updates the reward reserve allowed to fund the vault.
    function setRewardReserve(address newRewardReserve) external onlyOwner {
        if (newRewardReserve == address(0)) revert ZeroAddress();

        address oldReserve = rewardReserve;
        rewardReserve = newRewardReserve;
        emit RewardReserveUpdated(oldReserve, newRewardReserve);
    }

    /// @notice Updates the minimum accepted NovaUSD deposit.
    function setMinDeposit(uint256 newMinimum) external onlyOwner {
        uint256 oldMinimum = minDeposit;
        minDeposit = newMinimum;
        emit MinDepositUpdated(oldMinimum, newMinimum);
    }

    /// @notice Pauses deposits, mints, withdrawals, and redemptions.
    function pause() external onlyOwner {
        _pause();
    }

    /// @notice Unpauses deposits, mints, withdrawals, and redemptions.
    function unpause() external onlyOwner {
        _unpause();
    }

    /// @inheritdoc ERC4626
    function maxDeposit(
        address receiver
    ) public view override(ERC4626, IERC4626) returns (uint256) {
        return paused() ? 0 : super.maxDeposit(receiver);
    }

    /// @inheritdoc ERC4626
    function maxMint(
        address receiver
    ) public view override(ERC4626, IERC4626) returns (uint256) {
        return paused() ? 0 : super.maxMint(receiver);
    }

    /// @inheritdoc ERC4626
    function maxRedeem(
        address owner
    ) public view override(ERC4626, IERC4626) returns (uint256) {
        return paused() ? 0 : super.maxRedeem(owner);
    }

    /// @inheritdoc ERC4626
    function _deposit(
        address caller,
        address receiver,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant whenNotPaused {
        if (assets < minDeposit) revert BelowMinimumDeposit(assets, minDeposit);

        super._deposit(caller, receiver, assets, shares);
    }

    /// @inheritdoc ERC4626
    function _withdraw(
        address caller,
        address receiver,
        address owner,
        uint256 assets,
        uint256 shares
    ) internal override nonReentrant whenNotPaused {
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    /// @dev A small decimals offset follows OpenZeppelin's ERC-4626 guidance for
    ///      reducing inflation/donation attack profitability in near-empty vaults.
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }
}
