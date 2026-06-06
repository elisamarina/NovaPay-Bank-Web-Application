## NovaPay Contracts

Foundry workspace for the NovaPay EVM staking system.

Planned contracts:

- `NovaUSD`: ERC-20 testnet asset.
- `NovaPayGateway`: test ETH to NovaUSD gateway.
- `NovaPayStakingVault`: ERC-4626 vault issuing `sNovaUSD`.
- `InterestRateMath`: deterministic APR math library.

## Commands

Build:

```shell
forge build
```

Test:

```shell
forge test
```

Format:

```shell
forge fmt
```

Show remappings:

```shell
forge remappings
```

## Dependencies

- `forge-std`
- `openzeppelin-contracts`
