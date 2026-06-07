// SPDX-License-Identifier: MIT
pragma solidity ^0.8.35;

import {IERC4626} from "@openzeppelin/contracts/interfaces/IERC4626.sol";

/// @title INovaPayStakingVault
/// @notice ERC-4626 staking vault interface for NovaUSD deposits and sNovaUSD shares.
/// @dev `sNovaUSD` yield is represented through share price appreciation, which
///      keeps the first staking model close to the ERC-4626 standard.
interface INovaPayStakingVault is IERC4626 {
    /// @notice Current APR configuration used by the vault for reward previews.
    /// @param aprBps Annual percentage rate expressed in basis points.
    /// @param yearInSeconds Accounting year length used by reward previews.
    struct RateConfig {
        uint256 aprBps;
        uint256 yearInSeconds;
    }

    /// @notice Frontend-readable vault configuration.
    /// @param asset NovaUSD asset address.
    /// @param rewardReserve Source or accounting address for reward funding.
    /// @param minDeposit Minimum accepted NovaUSD deposit.
    /// @param aprBps Current target APR in basis points.
    /// @param yearInSeconds Accounting year length used by reward previews.
    /// @param paused Whether deposits are currently paused.
    struct VaultConfig {
        address asset;
        address rewardReserve;
        uint256 minDeposit;
        uint256 aprBps;
        uint256 yearInSeconds;
        bool paused;
    }

    /// @notice Computed reward preview for a principal and elapsed interval.
    /// @param principal Amount of assets used as the reward base.
    /// @param aprBps Annual percentage rate expressed in basis points.
    /// @param elapsedTime Time interval in seconds.
    /// @param reward Expected reward for the interval.
    struct RewardPreview {
        uint256 principal;
        uint256 aprBps;
        uint256 elapsedTime;
        uint256 reward;
    }

    /// @notice Reward tier used for per-user staking positions.
    /// @param id Tier identifier used by frontend displays.
    /// @param minPrincipal Minimum principal required for the tier.
    /// @param aprBps Annual percentage rate for the tier in basis points.
    struct RewardTier {
        uint8 id;
        uint256 minPrincipal;
        uint256 aprBps;
    }

    /// @notice Frontend-readable on-chain user staking position.
    /// @param principalAssets Principal NovaUSD tracked for the account.
    /// @param accruedRewards Estimated rewards already checkpointed for the account.
    /// @param pendingRewards Additional rewards accrued since the last checkpoint.
    /// @param totalRewards Total estimated rewards if the account were checkpointed now.
    /// @param aprBps Active APR for the current tier.
    /// @param tier Active reward tier id.
    /// @param lastAccruedAt Last timestamp at which rewards were checkpointed.
    struct UserPosition {
        uint256 principalAssets;
        uint256 accruedRewards;
        uint256 pendingRewards;
        uint256 totalRewards;
        uint256 aprBps;
        uint8 tier;
        uint64 lastAccruedAt;
    }

    /// @notice Aggregated vault statistics for dashboards.
    /// @param totalAssets Total NovaUSD assets controlled by the vault.
    /// @param totalShares Total sNovaUSD shares issued by the vault.
    /// @param sharePrice Current asset value per share, scaled by token decimals.
    /// @param aprBps Current target APR in basis points.
    struct VaultStats {
        uint256 totalAssets;
        uint256 totalShares;
        uint256 sharePrice;
        uint256 aprBps;
    }

    /// @notice Emitted when rewards are added to the vault.
    event RewardsFunded(address indexed funder, uint256 amount);

    /// @notice Emitted when the owner updates the target APR.
    event AprUpdated(uint256 oldAprBps, uint256 newAprBps);

    /// @notice Emitted when a reward tier is updated.
    event RewardTierUpdated(uint8 indexed tier, uint256 minPrincipal, uint256 aprBps);

    /// @notice Emitted when a user's rewards are checkpointed.
    event PositionAccrued(address indexed account, uint256 accruedRewards, uint256 aprBps, uint8 tier);

    /// @notice Returns the current vault configuration.
    function vaultConfig() external view returns (VaultConfig memory config);

    /// @notice Returns the APR configuration used for reward previews.
    function rateConfig() external view returns (RateConfig memory config);

    /// @notice Returns dashboard-oriented vault statistics.
    function vaultStats() external view returns (VaultStats memory stats);

    /// @notice Returns the active target APR in basis points.
    function aprBps() external view returns (uint256);

    /// @notice Returns the current NovaUSD value per sNovaUSD share.
    function sharePrice() external view returns (uint256);

    /// @notice Previews simple-interest reward for a principal and interval.
    /// @dev Uses the tier APR selected by the provided principal amount.
    /// @param principal Amount of assets used as the reward base.
    /// @param elapsedTime Time interval in seconds.
    /// @return preview Reward preview including inputs and computed reward.
    function previewReward(uint256 principal, uint256 elapsedTime) external view returns (RewardPreview memory preview);

    /// @notice Adds reward assets to the vault, increasing share value.
    /// @param assets Amount of NovaUSD rewards to add.
    function fundRewards(uint256 assets) external;

    /// @notice Returns a configured reward tier by id.
    function rewardTier(uint8 tier) external view returns (RewardTier memory tierConfig);

    /// @notice Returns the on-chain staking position for an account.
    function positionOf(address account) external view returns (UserPosition memory position);

    /// @notice Returns total estimated rewards if the account were checkpointed now.
    function previewAccrued(address account) external view returns (uint256);
}
