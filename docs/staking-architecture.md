# NovaPay Staking Architecture

## 1. Scope

This document defines the first technical version of the NovaPay staking system. The goal is to model a real EVM-based staking product that can be deployed on a testnet, integrated into the existing NovaPay application, and later extended with account abstraction.

The first implementation target is Base Sepolia or another EVM testnet with low operational cost. The system should not depend on a locally running blockchain node.

## 2. Design Goals

- Provide a real on-chain staking flow using Solidity smart contracts.
- Use OpenZeppelin contracts where possible instead of custom primitives.
- Keep the first staking product simple enough to test and explain clearly.
- Support a walletless user experience later through ERC-4337 smart accounts.
- Keep interest rate logic deterministic and easy to verify.
- Avoid promising real economic yield before a real reward source exists.

## 3. Non-Goals

- No mainnet deployment in the first phase.
- No dynamic lending-market yield in the first phase.
- No utilization-based rate model until there is a real capital use case.
- No custom account abstraction implementation from scratch.
- No production-grade tokenomics before testnet behavior is validated.

## 4. High-Level Architecture

```mermaid
flowchart TB
  User["NovaPay user"] --> Appwrite["Appwrite auth"]
  Appwrite --> NovaPay["NovaPay Next.js app"]
  NovaPay --> SmartAccount["ERC-4337 smart account"]
  SmartAccount --> Gateway["NovaPayGateway"]
  Gateway --> Asset["NovaUSD ERC-20"]
  SmartAccount --> Vault["NovaPayStakingVault ERC-4626"]
  Asset --> Vault
  Vault --> Shares["sNovaUSD ERC-20 shares"]
  Vault --> Position["On-chain user position"]
  Admin["NovaPay admin"] --> Gateway
  Admin --> Vault
  Admin --> RewardReserve["Reward reserve"]
  RewardReserve --> VaultYield["Funded vault yield"]
  VaultYield --> Vault
  Paymaster["Paymaster"] --> SmartAccount
```

The application remains the user's main interface. Blockchain interactions are introduced behind the NovaPay staking page, then progressively moved toward ERC-4337 smart accounts for a smoother user experience.

## 5. Contract Components

### 5.0 Token Flow

The first version uses two application tokens:

- `NovaUSD`: the base ERC-20 asset used inside NovaPay.
- `sNovaUSD`: the ERC-4626 vault share token received when a user stakes `NovaUSD`.

The intended user flow is:

```text
deposit test ETH -> mint NovaUSD -> stake NovaUSD -> receive sNovaUSD
```

`sNovaUSD` is an ERC-4626 share token. It represents a proportional claim on the assets held by the staking vault. The vault also tracks a per-user staking position for reward tiers and accrued rewards.

Example:

```text
Initial state:
1000 NovaUSD in vault
1000 sNovaUSD issued
1 sNovaUSD = 1 NovaUSD

After rewards are added:
1100 NovaUSD in vault
1000 sNovaUSD issued
1 sNovaUSD = 1.1 NovaUSD
```

This design keeps the staking token standard and composable while making per-user tiers explicit on-chain. The share token remains the withdrawal primitive; the position ledger is the source of truth for principal, tier, APR, and accrued rewards.

### 5.0.1 Interfaces And Shared Structs

Contract-facing interfaces live in `contracts/src/interfaces/`.

The interfaces define the structs that are useful for both contract composition and frontend/backend reads:

- `IPriceOracle.PriceData`
- `INovaPayGateway.GatewayConfig`
- `INovaPayGateway.MintQuote`
- `INovaPayStakingVault.VaultConfig`
- `INovaPayStakingVault.VaultStats`
- `INovaPayStakingVault.RateConfig`
- `INovaPayStakingVault.RewardPreview`
- `INovaPayStakingVault.RewardTier`
- `INovaPayStakingVault.UserPosition`

This keeps getter return types explicit and avoids forcing the frontend to reconstruct dashboard data from many unrelated calls.

Interest-rate logic is deliberately kept small:

- `INovaPayStakingVault`: exposes the vault's APR configuration, reward tiers, user positions, and reward previews.
- `InterestRateMath`: pure library for deterministic APR/reward calculations.
  The library should use OpenZeppelin `Math.mulDiv` for percentage and time-based
  reward calculations instead of raw chained multiplication.

Rationale:

A Solidity library is the right place for stateless math. The current tier policy is stored directly in the vault because it is small and does not need a separate interest-rate model contract yet. This avoids unnecessary external calls and keeps the ERC-4626 vault as the single contract users interact with for staking.

### 5.1 NovaUSD

`NovaUSD` is a testnet ERC-20 asset used as the staking token.

Responsibilities:

- Represent the token users deposit into the staking vault.
- Allow controlled minting on testnet for demos and development.
- Support standard ERC-20 transfers and approvals.

Recommended base contracts:

- `ERC20`
- `Ownable` or `AccessControl`
- Optional: `ERC20Permit`

Initial functions:

- `mint(address to, uint256 amount)`
- standard ERC-20 methods inherited from OpenZeppelin

Security notes:

- Minting must be admin-only.
- On testnet, minting is acceptable for demo liquidity.
- On mainnet, this would need a real asset or a clearly defined economic model.

### 5.2 NovaPayGateway

`NovaPayGateway` is the testnet on-ramp contract. It accepts test ETH and mints `NovaUSD` at a fixed demo rate.

Responsibilities:

- Accept test ETH deposits.
- Mint `NovaUSD` to the depositor.
- Keep the ETH-to-NovaUSD rate configurable by the owner.

Recommended base contracts:

- `Ownable`
- `Pausable`
- `ReentrancyGuard`

Initial functions:

- `depositEth() payable`
- `setMintRate(uint256 newRate)`
- `pause()`
- `unpause()`

Testnet-only rule:

- The first version may use a fixed rate such as `1 ETH = 1000 NovaUSD`.

Mainnet note:

- This gateway is not a production stablecoin design. On mainnet, NovaPay should use a real asset such as USDC, or a separately designed collateral and oracle system.

### 5.3 NovaPayStakingVault

`NovaPayStakingVault` is the main staking contract. It should be based on ERC-4626 where practical because ERC-4626 standardizes tokenized vault deposits, shares, withdrawals, and accounting.

Responsibilities:

- Accept NovaUSD deposits.
- Issue `sNovaUSD` vault shares.
- Track each user's principal, tier, APR, and accrued rewards on-chain.
- Receive reward funding from the reward reserve.
- Allow users to redeem `sNovaUSD` for `NovaUSD`.
- Prevent unsafe operations when paused.

Recommended base contracts:

- `ERC4626`
- `ERC20` through `ERC4626`
- `Ownable` or `AccessControl`
- `Pausable`
- `ReentrancyGuard`

Vault token metadata:

```text
name: Staked NovaUSD
symbol: sNovaUSD
asset: NovaUSD
```

Reward model:

- Tier 0, Starter: 0 NOVAUSD minimum principal, 4% APR.
- Tier 1, Growth: 100 NOVAUSD minimum principal, 7% APR.
- Tier 2, Prime: 1,000 NOVAUSD minimum principal, 10% APR.
- Rewards accrue linearly using `InterestRateMath`.
- `positionOf(address)` is the frontend source of truth for principal, tier, APR, and estimated accrued rewards.
- `fundRewards(uint256 assets)` is the economic reward delivery path: funded NovaUSD enters the vault and increases `sNovaUSD` share value.
- Users realize funded rewards by redeeming `sNovaUSD`; there is no separate reward-claim transfer from the reserve.

APR terminology:

- Reference APR: the global `_aprBps` retained for `vaultConfig()`, `vaultStats()`, and backwards-compatible vault-level previews.
- Tier APR: the per-user APR selected from the user's tracked principal and returned by `positionOf(account)`.
- User accrual estimates use Tier APR, not the global Reference APR.
- The frontend displays both values so operators can distinguish vault configuration from the user's active earning rate.

Rationale:

`sNovaUSD` should remain a standard ERC-4626 share token for deposits and withdrawals. Tier rewards are per-user state used for visibility and operator funding decisions, while actual yield is represented by funded share-price appreciation.

Security audit and mitigation:

| Finding or lead | Decision |
| --- | --- |
| Confirmed: double reward accounting from combining `fundRewards()` share-price yield with direct `claimRewards()` reserve transfers. | Removed the direct claim path. The only economic reward channel is now reward reserve funding into vault assets, followed by ERC-4626 redemption or withdrawal by users. |
| Lead: just-in-time reward capture around predictable `fundRewards()` calls. | Accepted for the MVP as standard ERC-4626 timing risk. A production design should add epochs, snapshots, cooldowns, or time-weighted distribution. |
| Lead: optional/incomplete L2 sequencer validation. | Keep optional for local/testnet flexibility. Production Base deployment should require a configured sequencer uptime feed and validate round completeness. |
| Lead: APR naming confusion. | UI/docs distinguish `Reference APR` from user-specific `Reward tier` APR. |

Regression tests:

- `testFundedRewardsAreRedeemedOnceThroughSharePrice()`
- `testClaimRewardsSelectorIsNotExposed()`

Initial user actions:

- `deposit(uint256 assets, address receiver)`
- `mint(uint256 shares, address receiver)`
- `withdraw(uint256 assets, address receiver, address owner)`
- `redeem(uint256 shares, address receiver, address owner)`
- `positionOf(address account)`
- `previewAccrued(address account)`

Initial admin actions:

- `pause()`
- `unpause()`
- `setAprBps(uint256 newAprBps)`
- `setRewardTier(uint8 tier, uint256 minPrincipal, uint16 aprBps)`
- `setRewardReserve(address newRewardReserve)`
- `fundRewards(uint256 assets)`

### 5.4 InterestRateMath

`InterestRateMath` contains the target reward math. It is a Solidity library, not an on-chain contract.

Responsibilities:

- Calculate the reward amount needed for a given vault principal, APR, and elapsed time.
- Keep reward math deterministic.
- Keep math separately testable from ERC-4626 deposit and withdrawal behavior.

Recommended first configuration:

- Three fixed tiers in the vault.
- Tier changes affect future accrual after the next position checkpoint.
- Existing `sNovaUSD` holders benefit from any rewards funded into the vault through share price appreciation, while tier rewards are tracked as estimates for UI and funding decisions.

Example APR:

| Tier | Principal threshold | APR | APR bps |
| --- | ---: | ---: | ---: |
| Starter | 0 NOVAUSD | 4% | 400 |
| Growth | 100 NOVAUSD | 7% | 700 |
| Prime | 1,000 NOVAUSD | 10% | 1000 |

Vault-facing structs:

```solidity
interface INovaPayStakingVault {
    struct RateConfig {
        uint256 aprBps;
        uint256 yearInSeconds;
    }

    struct RewardPreview {
        uint256 principal;
        uint256 aprBps;
        uint256 elapsedTime;
        uint256 reward;
    }

    struct UserPosition {
        uint256 principalAssets;
        uint256 accruedRewards;
        uint256 pendingRewards;
        uint256 totalRewards;
        uint256 aprBps;
        uint8 tier;
        uint64 lastAccruedAt;
    }

    function rateConfig() external view returns (RateConfig memory config);

    function aprBps() external view returns (uint256);

    function previewReward(
        uint256 principal,
        uint256 elapsedTime
    ) external view returns (RewardPreview memory preview);

    function positionOf(address account)
        external
        view
        returns (UserPosition memory position);

    function previewAccrued(address account)
        external
        view
        returns (uint256);
}
```

Reward formula:

```text
reward = principal * aprBps * elapsedTime / (10_000 * YEAR)
```

Constants:

```text
BPS = 10_000
YEAR = 365 days
```

Example:

```text
vault principal = 1000 NovaUSD
aprBps = 700
elapsedTime = 90 days

reward = 1000 * 700 * 90 / (10_000 * 365)
reward ~= 17.26 NovaUSD
```

### 5.5 RewardReserve

The reward reserve is the source of funded vault yield.

Responsibilities:

- Hold NovaUSD used to fund staking rewards.
- Make the system honest about where yield comes from.
- Prevent the vault from pretending yield exists without backing assets.

First version:

- Can be a dedicated address controlled by NovaPay.
- Can be implemented as contract logic later if needed.
- Must approve the vault before calling `fundRewards(uint256 assets)`.

Rules:

- Rewards are not created out of nothing.
- Tier rewards are tracked on-chain as estimates, not as a separate payable debt.
- The vault's share price increases only when rewards are funded into the vault with real `NovaUSD`.
- If the reserve cannot fund yield, users can still redeem their principal/share value but no new funded yield is added.

## 6. Interest Rate Model Decision

The current version uses fixed principal tiers inside the `sNovaUSD` vault.

Reasons:

- Easy to explain in the diploma paper.
- Easy to test with deterministic unit tests.
- No dependency on external protocols or oracles.
- No hidden assumptions about lending demand or capital utilization.
- Clear user experience: users know the active tier APR before staking.
- Compatible with one ERC-4626 share token because the economic reward channel is share-price appreciation.

Rejected for phase one:

- Utilization-based APR, because it requires a real borrowing/yield strategy.
- Oracle-based APR, because it introduces external dependencies.
- Rebasing rewards, because it complicates accounting and UI.
- Auto-compounding, because it introduces more state transitions and edge cases.
- Tier rewards paid through share price only, because a single vault share token has one exchange rate.

Future extension:

```text
utilization = borrowedAssets / totalAssets
apr = baseRate + utilization * slope
```

This should be added only after NovaPay defines how staked capital is productively used.

Lock tiers can still be added later by deploying separate ERC-4626 vaults:

```text
sNovaUSD30  -> 30 day vault
sNovaUSD90  -> 90 day vault
sNovaUSD180 -> 180 day vault
```

Each vault would have its own APR and its own share token. This preserves ERC-4626 accounting correctness.

## 7. Staking Rules

Initial rules:

- A user deposits `NovaUSD` into the vault.
- The vault issues `sNovaUSD` shares.
- The vault checkpoints the user's position before deposits, withdrawals, redemptions, and share transfers.
- Rewards are tracked per user through principal tiers.
- Users receive funded rewards through the `sNovaUSD` share price when they redeem or withdraw.
- Users redeem or withdraw to convert `sNovaUSD` back into `NovaUSD`.
- Admin APR/tier changes affect future accrual after each position checkpoint.
- Rewards are not minted by the vault; the reward reserve must fund real NovaUSD into the vault.

Optional later rules:

- Early withdrawal with penalty.
- Auto-compounding.
- NFT receipt for each position.
- Transferable stake positions.
- Separate lock-tier vaults.

## 8. Account Abstraction Integration

The staking contracts should be compatible with normal EOAs first. Account abstraction is an application integration layer added after contract behavior is verified.

Planned flow:

```mermaid
sequenceDiagram
  participant U as User
  participant A as NovaPay App
  participant S as Smart Account
  participant P as Paymaster
  participant V as Staking Vault

  U->>A: Click Stake
  A->>S: Build UserOperation
  S->>P: Request gas sponsorship
  P-->>S: Sponsorship data
  S->>V: Execute stake
  V-->>A: Transaction confirmed
  A-->>U: Show active position
```

The smart account layer should not be required for contract tests. This keeps the contract system independently verifiable.

## 9. Security Considerations

- Use OpenZeppelin implementations for ERC-20, ERC-4626, `Ownable`, `Pausable`, and `ReentrancyGuard`.
- Add minimum deposit checks to reduce rounding problems.
- Consider ERC-4626 inflation attack mitigations before production.
- Use `nonReentrant` around ETH deposits, reward funding, deposits, withdrawals, and redemptions where custom logic wraps token movement.
- Use `SafeERC20` for transfers.
- Avoid hidden reward creation; rewards must be funded explicitly.
- Keep reward funding explicit.
- Add pause controls for emergency response.

## 10. Test Plan

Unit tests:

- `NovaUSD` mints only from authorized account.
- `NovaUSD` holders can burn their own balance to exit the app USD flow.
- `NovaPayGateway` mints the expected `NovaUSD` amount for deposited test ETH.
- `NovaPayStakingVault` returns the configured tier APR.
- `calculateReward` returns expected values for 30, 90, 180, and 365 day examples.
- vault deposit issues `sNovaUSD`.
- vault redeem returns `NovaUSD`.
- vault deposit updates `positionOf`.
- vault previews tier rewards.
- partial redeem reduces tracked principal proportionally.
- share transfers move tracked principal between accounts.
- funding rewards increases `convertToAssets(1 sNovaUSD)`.
- paused gateway blocks ETH deposits.
- paused vault blocks deposits, withdrawals, and redemptions.

Integration tests:

- deploy token, gateway, and vault.
- mint NovaUSD to user.
- approve vault.
- deposit into vault.
- read `positionOf`.
- preview tier rewards.
- fund rewards from the reward reserve.
- redeem shares.

Testnet checks:

- deploy to Base Sepolia.
- verify contracts.
- run one full ETH deposit, NovaUSD mint, vault deposit, reward funding, redeem flow.
- read position data from NovaPay UI.

## 11. Implementation Order

1. Create Foundry contracts workspace.
2. Install OpenZeppelin Contracts.
3. Implement `NovaUSD`.
4. Implement `NovaPayGateway`.
5. Implement `NovaPayStakingVault`.
6. Write unit tests for reward math.
7. Write unit tests for gateway and vault lifecycle.
8. Deploy to Base Sepolia.
9. Integrate NovaPay UI and backend.
10. Add ERC-4337 smart account flow.
11. Add app USD redeem flow: burn NovaUSD and credit the app ledger.

## 12. Open Questions

- Which EVM testnet should be the primary target: Base Sepolia or Polygon Amoy?
- Should NovaPay sponsor gas from day one, or only after basic staking works?
- Should `NovaPayGateway` be included in the first deploy, or should users receive `NovaUSD` through a faucet action?
- Should the production cash-out path use USDC escrow, a banking rail, or a compliance-gated redemption provider?
