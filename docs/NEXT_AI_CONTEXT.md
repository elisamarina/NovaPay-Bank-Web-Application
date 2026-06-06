# NovaPay Project Context For Next AI

## Snapshot

This project is a Next.js finance dashboard named NovaPay with an EVM staking protocol being added under `contracts/`.

The current major checkpoint added:

- A Foundry workspace in `contracts/`.
- Solidity contracts for the NovaPay staking MVP.
- Unit, integration, and invariant/fuzz-style tests.
- Token metadata images and JSON files for `NovaUSD` and `sNovaUSD`.
- Architecture documentation in `docs/staking-architecture.md`.

The user wants careful, surgical work:

- Ask before installing packages, deleting files, or making large decisions.
- Do not auto-fix audit findings without user approval.
- Prefer small documented phases.
- Use NatSpec and short explanatory comments where implementation choices matter.
- Keep the protocol real, not mocked. Mocks are acceptable only in tests.

## EVM Protocol Architecture

The chosen protocol flow is:

```text
test ETH -> NovaPayGateway -> NovaUSD -> NovaPayStakingVault -> sNovaUSD
```

Token decisions:

- `NovaUSD` is the base ERC-20 asset.
- `sNovaUSD` is the ERC-4626 share token issued by the staking vault.
- `sNovaUSD` yield is represented through ERC-4626 share price appreciation.
- There is no separate claim function in the first version.
- `InterestRateMath` is a Solidity library, not an on-chain interest-rate model contract.

Important design correction:

- Do not recreate `IInterestRateModel`.
- APR state belongs to the vault.
- Pure reward math belongs in `InterestRateMath`.
- Relevant state structs live in interfaces for real contracts, especially `INovaPayStakingVault`.

## Solidity Files

Main contracts:

- `contracts/src/NovaUSD.sol`
- `contracts/src/NovaPayGateway.sol`
- `contracts/src/NovaPayStakingVault.sol`
- `contracts/src/oracles/ChainlinkPriceOracle.sol`

Interfaces:

- `contracts/src/interfaces/IChainlinkAggregatorV3.sol`
- `contracts/src/interfaces/INovaPayGateway.sol`
- `contracts/src/interfaces/INovaPayStakingVault.sol`
- `contracts/src/interfaces/IPriceOracle.sol`

Libraries:

- `contracts/src/libraries/InterestRateMath.sol`

Implementation notes:

- OpenZeppelin v5 contracts are used.
- `NovaUSD` uses `ERC20`, `ERC20Permit`, and `Ownable`.
- `NovaPayGateway` uses `Ownable`, `Pausable`, `ReentrancyGuard`, and oracle-based ETH pricing.
- `NovaPayStakingVault` uses `ERC4626`, `Ownable`, `Pausable`, `ReentrancyGuard`, and `SafeERC20`.
- `ChainlinkPriceOracle` validates price feed responses and optionally checks an L2 sequencer uptime feed.
- `InterestRateMath` uses OpenZeppelin `Math.mulDiv`.

Foundry commands:

```shell
C:\Users\vnecu\.foundry\bin\forge.exe build
C:\Users\vnecu\.foundry\bin\forge.exe test
C:\Users\vnecu\.foundry\bin\forge.exe fmt
```

PowerShell may not find `forge` on PATH. Use the full path above.

## Tests

Test files:

- `contracts/test/InterestRateMath.t.sol`
- `contracts/test/NovaUSD.t.sol`
- `contracts/test/NovaPayGateway.t.sol`
- `contracts/test/NovaPayStakingVault.t.sol`
- `contracts/test/ChainlinkPriceOracle.t.sol`
- `contracts/test/NovaPayFlow.integration.t.sol`
- `contracts/test/NovaPayVault.invariant.t.sol`
- `contracts/test/handlers/NovaPayVaultHandler.sol`
- `contracts/test/mocks/MockChainlinkAggregator.sol`
- `contracts/test/mocks/MockPriceOracle.sol`

Last full verified result before this context file:

```text
46 tests passed, 0 failed, 0 skipped
```

The invariant suite runs 256 runs with 128000 calls per invariant and may take around 90-110 seconds on this machine.

Known non-blocking warnings:

- Foundry may warn that it cannot write signature cache under `C:\Users\vnecu\.foundry\cache\signatures`.
- OpenZeppelin ECDSA warnings appear because `solc 0.8.35` warns that `error` will become a keyword.
- Foundry lint warns about `block.timestamp` in oracle freshness checks. This is intentional for Chainlink staleness and sequencer grace-period validation.

## Pashov Solidity Auditor

The user asked to run Pashov audit only after implementation and tests, and not to fix anything without approval.

The skill was installed manually because global Python was unavailable:

```text
C:\Users\vnecu\.codex\skills\solidity-auditor
```

Remote and local skill version were both `3`.

Audit was started but interrupted/deferred by the user. Do not continue the audit unless the user asks.

Leads already reported before audit was paused:

- `InterestRateMath.calculateReward`: possible precision loss because annual reward is floored before elapsed-time scaling.
- `NovaPayGateway.quoteNovaUSD`: should locally validate oracle answer and bound decimals before exponentiation/cast.
- `NovaPayStakingVault.sharePrice`: `10 ** decimals()` is safe for NovaUSD but unbounded for arbitrary high-decimal assets.
- `NovaPayStakingVault.maxWithdraw`: pause-aware `maxWithdraw` override is missing, while `_withdraw` is paused.
- `NovaPayStakingVault._deposit`: possible zero-share deposit after large prefund/donation edge case.
- `ChainlinkPriceOracle._validateSequencer`: sequencer uptime feed should validate incomplete/stale rounds, not only `answer` and `startedAt`.
- `NovaPayStakingVault._deposit`: generic asset constructor could be unsafe with fee-on-transfer assets; current intended `NovaUSD` is standard ERC-20.

These are leads, not confirmed final findings. Do not patch them unless the user approves.

## Token Metadata

Generated token assets are stored under:

- `public/token-metadata/novausd-token.png`
- `public/token-metadata/snovausd-token.png`
- `public/token-metadata/novausd.json`
- `public/token-metadata/snovausd.json`

`NovaUSD` metadata:

- name: `NovaUSD`
- symbol: `NOVAUSD`
- decimals: `18`

`sNovaUSD` metadata:

- name: `Staked NovaUSD`
- symbol: `sNovaUSD`
- decimals: `24`

The `sNovaUSD` decimals are 24 because the vault uses a 6-decimal ERC-4626 offset over an 18-decimal asset.

## Frontend Integration Status

Frontend integration is not complete.

Important state:

- The staking page currently exists at `src/app/(root)/staking/page.tsx`.
- It was still a placeholder before the user paused package installation work.
- The user wants to integrate the staking protocol on frontend.
- The user requested `wagmi`.
- Do not install packages without asking first.

Package installation situation:

- `package.json` and `package-lock.json` do not currently include `wagmi`, `viem`, or `@tanstack/react-query`.
- A previous `npm install wagmi viem @tanstack/react-query` attempt timed out and was not saved to `package.json`.
- Partial `node_modules/wagmi`, `node_modules/viem`, and `node_modules/@tanstack/react-query` folders were cleaned.
- The follow-up `npm install wagmi` command was started but aborted by the user. Verify the current package state before continuing.

User preference:

- Use `wagmi` for frontend integration.
- The user reacted strongly against explicitly installing/importing `viem`.
- If wagmi requires peer/internal viem, explain before proceeding.
- In application code, prefer imports from `wagmi`, not direct `viem` usage, unless the user approves.

Recommended next frontend steps:

1. Ask permission to install only the package set required for wagmi.
2. Verify what wagmi version requires in this Next.js/React version.
3. Add a small provider component for wagmi/query client.
4. Add contract config and ABI files.
5. Replace staking placeholder with a read-only dashboard first.
6. Add write actions only after read-only integration is stable.

## Git Notes

Previous checkpoint commit before staking work:

```text
bc28513 checkpoint before Canton staking integration
```

Current commit should include:

- Foundry contracts workspace.
- EVM staking contracts.
- Tests.
- Token metadata.
- Architecture and context docs.
- `.gitignore` additions for Foundry cache/out.

Do not commit:

- `.audit-*` folders.
- `contracts/out/`
- `contracts/cache/`
- dependency installation leftovers not reflected in package files.

## User Style And Working Rules

The user is Romanian and prefers direct Romanian communication.

Important behavioral requirements:

- Explain first when something is unclear.
- Ask before package installs, destructive actions, or larger changes.
- Use small phases and clear verification.
- Do not silently pick broad architecture choices.
- Do not patch audit findings unless the user explicitly says to fix them.
- Keep changes surgical.
- For contract work: use OpenZeppelin best practices, NatSpec, unit tests, integration tests, and invariant/fuzz handlers.
