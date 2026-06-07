# 🔐 Security Review — NovaPay-Bank-Web-Application

Completeness: 9 unique raw `(Contract, function)` tuples evaluated, 9 covered by final finding/lead/rejection decisions.

---

## Scope

|                                  |                                                        |
| -------------------------------- | ------------------------------------------------------ |
| **Mode**                         | contracts/src |
| **Files reviewed**               | `NovaPayGateway.sol` · `NovaPayStakingVault.sol` · `NovaUSD.sol`<br>`InterestRateMath.sol` · `ChainlinkPriceOracle.sol` |
| **Confidence threshold (1-100)** | 80 |

---

## Findings

[95] **1. Rewards Are Paid Twice Through Share Appreciation And Direct Claims**

`NovaPayStakingVault.claimRewards` · Confidence: 95

**Description**
`fundRewards()` adds reward assets into ERC-4626 `totalAssets()` while `claimRewards()` separately pulls the same APR reward from `rewardReserve`, so a staker can redeem funded share-price yield and claim the same reward again.

**Proof**
With a `1_000 ether` Prime position at `1_000` bps, one year accrues `100 ether`. If `rewardReserve` calls `fundRewards(100 ether)`, the vault balance rises from `1_000 ether` to `1_100 ether`, so the staker's shares redeem against the funded reward. `claimRewards()` then clears `position.accruedRewards` and executes `IERC20(asset()).safeTransferFrom(rewardReserve, receiver, reward)`, paying another `100 ether` from the reserve.

**Fix**

```diff
-        IERC20(asset()).safeTransferFrom(rewardReserve, receiver, reward);
+        IERC20(asset()).safeTransfer(receiver, reward);
```

The broader fix is to choose one reward model: either remove direct reward claims and rely only on ERC-4626 share-price appreciation, or keep claimable rewards in accounting that is excluded from `totalAssets()`.

---

Findings List

| # | Confidence | Title |
|---|---|---|
| 1 | [95] | Rewards Are Paid Twice Through Share Appreciation And Direct Claims |

---

## Leads

_Vulnerability trails with concrete code smells where the full exploit path could not be completed in one analysis pass. These are not false positives — they are high-signal leads for manual review. Not scored._

- **JIT Reward Capture** — `NovaPayStakingVault.fundRewards` — Code smells: reward funding raises ERC-4626 share price for current holders with no snapshot, cooldown, or time-weighting. A depositor can enter before a known funding and exit after to capture funded yield, but external predictability and profitability were not proven beyond standard ERC-4626 timing risk.
- **Paused Withdraw Limit Mismatch** — `NovaPayStakingVault.maxWithdraw` — Code smells: `maxDeposit`, `maxMint`, and `maxRedeem` return `0` while paused, but `maxWithdraw` is inherited even though `_withdraw` is `whenNotPaused`. This can mislead ERC-4626 integrators during pause, but direct asset loss was not proven.
- **Dust Principal Drift On Share Transfers** — `NovaPayStakingVault._movePrincipalOnShareTransfer` — Code smells: `Math.mulDiv(fromPrincipal, shares, shareBalance)` rounds down and returns early when `principalToMove == 0`. Tiny share transfers can move shares without principal, but a practical profit path was not proven because each zero-principal chunk is dust at the current share precision.
- **Displayed APR Can Diverge From Accrued Tier APR** — `NovaPayStakingVault.setAprBps` — Code smells: `_aprBps` is exposed by config/stat views, while actual reward math uses `_rewardTiers[tier].aprBps`. This can mislead UI/accounting surfaces, but it is not an on-chain extraction path by itself.
- **Incomplete Or Optional Sequencer Validation** — `ChainlinkPriceOracle._validateSequencer` — Code smells: sequencer validation checks only `answer` and `startedAt`, does not validate `startedAt != 0`, `updatedAt != 0`, or `answeredInRound >= roundId`, and silently skips validation when the sequencer feed is unset. This is a Base/L2 hardening gap, but attacker control over the feed response or deployed missing-feed impact was not proven from in-scope code.

---

## Rejected During Gating

- `NovaPayStakingVault.setYearInSeconds` retroactive denominator issue: rejected as a finding because exploitation requires owner action and no unprivileged amplifier was identified.
- `NovaPayGateway.setPriceOracle` malicious-oracle mint issue: rejected as a finding because oracle replacement is owner-only and no unprivileged amplifier was identified.
- `NovaPayGateway.quoteNovaUSD` oracle decimals overflow: rejected as a finding because reaching hostile decimals depends on owner-selected oracle configuration.

---

> ⚠️ This review was performed by an AI assistant. AI analysis can never verify the complete absence of vulnerabilities and no guarantee of security is given. Team security reviews, bug bounty programs, and on-chain monitoring are strongly recommended. For a consultation regarding your projects' security, visit [https://www.pashov.com](https://www.pashov.com)
