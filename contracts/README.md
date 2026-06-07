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

## Base Sepolia Deployment

Create a new encrypted Foundry keystore wallet:

```shell
mkdir -p ~/.foundry/keystores
cast wallet new ~/.foundry/keystores <name> 
```

Or import an existing private key without putting it in shell history:

```shell
cast wallet import <name> --interactive
```

Check the account address:

```shell
cast wallet address --account <name>
```

The deploy script defaults the owner and reward reserve to:

```text
0xC3616f92ecEEabb61fa0BC7f14b70aC531c8D63d
```

Set the Chainlink ETH/USD feed before deployment. Optional values can override
the defaults if needed.

```shell
export CHAINLINK_ETH_USD_FEED=0x...
export CHAINLINK_SEQUENCER_UPTIME_FEED=0x0000000000000000000000000000000000000000
export NOVAPAY_OWNER=<address>
export NOVAPAY_REWARD_RESERVE=<address>
```

Dry-run the script first:

```shell
forge script script/DeployNovaPay.s.sol:DeployNovaPay \
  --rpc-url https://sepolia.base.org \
  --account <name>
```

Broadcast to Base Sepolia:

```shell
forge script script/DeployNovaPay.s.sol:DeployNovaPay \
  --rpc-url https://sepolia.base.org \
  --account <name> \
  --broadcast
```

The script prints the frontend variables to copy into the app environment:

```text
NEXT_PUBLIC_NOVAPAY_NOVAUSD_ADDRESS=...
NEXT_PUBLIC_NOVAPAY_GATEWAY_ADDRESS=...
NEXT_PUBLIC_NOVAPAY_STAKING_VAULT_ADDRESS=...
```

## Dependencies

- `forge-std`
- `openzeppelin-contracts`
