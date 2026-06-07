// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC4626} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
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

    uint8 private constant _STARTER_TIER = 0;
    uint8 private constant _GROWTH_TIER = 1;
    uint8 private constant _PRIME_TIER = 2;
    uint8 private constant _TIER_COUNT = 3;
    uint256 private constant _GROWTH_MIN_PRINCIPAL = 100 ether;
    uint256 private constant _PRIME_MIN_PRINCIPAL = 1_000 ether;
    uint16 private constant _STARTER_APR_BPS = 400;
    uint16 private constant _GROWTH_APR_BPS = 700;
    uint16 private constant _PRIME_APR_BPS = 1_000;

    struct Position {
        uint256 principalAssets;
        uint256 accruedRewards;
        uint64 lastAccruedAt;
        uint16 aprBps;
        uint8 tier;
    }

    mapping(address account => Position position) private _positions;
    RewardTier[_TIER_COUNT] private _rewardTiers;

    error ZeroAddress();
    error InvalidYearInSeconds();
    error InvalidRewardTier(uint8 tier);
    error InvalidTierThreshold();
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
        _setRewardTier(_STARTER_TIER, 0, _STARTER_APR_BPS);
        _setRewardTier(_GROWTH_TIER, _GROWTH_MIN_PRINCIPAL, _GROWTH_APR_BPS);
        _setRewardTier(_PRIME_TIER, _PRIME_MIN_PRINCIPAL, _PRIME_APR_BPS);
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
        RewardTier memory tier = _tierForPrincipal(principal);
        uint256 reward = InterestRateMath.calculateReward(
            principal,
            tier.aprBps,
            elapsedTime,
            _yearInSeconds
        );

        return
            RewardPreview({
                principal: principal,
                aprBps: tier.aprBps,
                elapsedTime: elapsedTime,
                reward: reward
            });
    }

    /// @inheritdoc INovaPayStakingVault
    function rewardTier(
        uint8 tier
    ) external view returns (RewardTier memory tierConfig) {
        if (tier >= _TIER_COUNT) revert InvalidRewardTier(tier);

        return _rewardTiers[tier];
    }

    /// @inheritdoc INovaPayStakingVault
    function positionOf(
        address account
    ) external view returns (UserPosition memory position) {
        Position memory storedPosition = _positions[account];
        uint256 pendingRewards = _pendingRewards(storedPosition);
        RewardTier memory tier = _tierForPrincipal(storedPosition.principalAssets);
        uint256 positionAprBps = storedPosition.aprBps == 0
            ? tier.aprBps
            : storedPosition.aprBps;

        return
            UserPosition({
                principalAssets: storedPosition.principalAssets,
                accruedRewards: storedPosition.accruedRewards,
                pendingRewards: pendingRewards,
                totalRewards: storedPosition.accruedRewards + pendingRewards,
                aprBps: positionAprBps,
                tier: tier.id,
                lastAccruedAt: storedPosition.lastAccruedAt
            });
    }

    /// @inheritdoc INovaPayStakingVault
    function previewAccrued(address account) external view returns (uint256) {
        Position memory storedPosition = _positions[account];

        return storedPosition.accruedRewards + _pendingRewards(storedPosition);
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

    /// @notice Updates one reward tier used by user positions and previews.
    function setRewardTier(
        uint8 tier,
        uint256 minPrincipal,
        uint16 newAprBps
    ) external onlyOwner {
        if (tier >= _TIER_COUNT) revert InvalidRewardTier(tier);
        if (tier == _STARTER_TIER && minPrincipal != 0) {
            revert InvalidTierThreshold();
        }
        if (
            tier > _STARTER_TIER &&
            minPrincipal <= _rewardTiers[tier - 1].minPrincipal
        ) {
            revert InvalidTierThreshold();
        }
        if (
            tier < _PRIME_TIER &&
            _rewardTiers[tier + 1].minPrincipal != 0 &&
            minPrincipal >= _rewardTiers[tier + 1].minPrincipal
        ) {
            revert InvalidTierThreshold();
        }

        _setRewardTier(tier, minPrincipal, newAprBps);
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

        _increasePrincipal(receiver, assets);
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
        _decreasePrincipal(owner, shares);
        super._withdraw(caller, receiver, owner, assets, shares);
    }

    /// @inheritdoc ERC20
    function _update(
        address from,
        address to,
        uint256 value
    ) internal override {
        if (from != address(0) && to != address(0) && value != 0) {
            _movePrincipalOnShareTransfer(from, to, value);
        }

        super._update(from, to, value);
    }

    /// @dev A small decimals offset follows OpenZeppelin's ERC-4626 guidance for
    ///      reducing inflation/donation attack profitability in near-empty vaults.
    function _decimalsOffset() internal pure override returns (uint8) {
        return 6;
    }

    function _setRewardTier(
        uint8 tier,
        uint256 minPrincipal,
        uint16 tierAprBps
    ) private {
        _rewardTiers[tier] = RewardTier({
            id: tier,
            minPrincipal: minPrincipal,
            aprBps: tierAprBps
        });

        emit RewardTierUpdated(tier, minPrincipal, tierAprBps);
    }

    function _tierForPrincipal(
        uint256 principal
    ) private view returns (RewardTier memory tier) {
        tier = _rewardTiers[_STARTER_TIER];

        for (uint8 i = _GROWTH_TIER; i < _TIER_COUNT; i++) {
            if (principal >= _rewardTiers[i].minPrincipal) {
                tier = _rewardTiers[i];
            }
        }
    }

    function _pendingRewards(
        Position memory position
    ) private view returns (uint256) {
        if (
            position.principalAssets == 0 ||
            position.lastAccruedAt == 0 ||
            block.timestamp <= position.lastAccruedAt
        ) {
            return 0;
        }

        uint256 elapsedTime = block.timestamp - position.lastAccruedAt;
        uint256 positionAprBps = position.aprBps;

        if (positionAprBps == 0) {
            positionAprBps = _tierForPrincipal(position.principalAssets).aprBps;
        }

        return
            InterestRateMath.calculateReward(
                position.principalAssets,
                positionAprBps,
                elapsedTime,
                _yearInSeconds
            );
    }

    function _accruePosition(address account) private {
        Position storage position = _positions[account];
        uint256 pendingRewards = _pendingRewards(position);
        RewardTier memory tier = _tierForPrincipal(position.principalAssets);

        if (pendingRewards != 0) {
            position.accruedRewards += pendingRewards;
        }

        position.lastAccruedAt = uint64(block.timestamp);
        position.aprBps = uint16(tier.aprBps);
        position.tier = tier.id;

        if (pendingRewards != 0) {
            emit PositionAccrued(
                account,
                position.accruedRewards,
                tier.aprBps,
                tier.id
            );
        }
    }

    function _increasePrincipal(address account, uint256 assets) private {
        _accruePosition(account);

        Position storage position = _positions[account];

        position.principalAssets += assets;
        _refreshPositionTier(position);
    }

    function _decreasePrincipal(address account, uint256 shares) private {
        _accruePosition(account);

        Position storage position = _positions[account];
        uint256 shareBalance = balanceOf(account);

        if (position.principalAssets == 0 || shareBalance == 0) return;

        uint256 principalToRemove = shares >= shareBalance
            ? position.principalAssets
            : Math.mulDiv(position.principalAssets, shares, shareBalance);

        if (principalToRemove >= position.principalAssets) {
            position.principalAssets = 0;
        } else {
            position.principalAssets -= principalToRemove;
        }

        _refreshPositionTier(position);
    }

    function _movePrincipalOnShareTransfer(
        address from,
        address to,
        uint256 shares
    ) private {
        _accruePosition(from);
        _accruePosition(to);

        Position storage fromPosition = _positions[from];
        Position storage toPosition = _positions[to];
        uint256 shareBalance = balanceOf(from);

        if (fromPosition.principalAssets == 0 || shareBalance == 0) return;

        uint256 principalToMove = shares >= shareBalance
            ? fromPosition.principalAssets
            : Math.mulDiv(fromPosition.principalAssets, shares, shareBalance);

        if (principalToMove == 0) return;

        if (principalToMove >= fromPosition.principalAssets) {
            fromPosition.principalAssets = 0;
        } else {
            fromPosition.principalAssets -= principalToMove;
        }

        toPosition.principalAssets += principalToMove;
        _refreshPositionTier(fromPosition);
        _refreshPositionTier(toPosition);
    }

    function _refreshPositionTier(Position storage position) private {
        RewardTier memory tier = _tierForPrincipal(position.principalAssets);

        position.aprBps = uint16(tier.aprBps);
        position.tier = tier.id;
    }
}
