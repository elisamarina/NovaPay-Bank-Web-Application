# NovaPay Bank Web Application

NovaPay is a hybrid finance dashboard and Base Sepolia staking MVP. The app combines a traditional banking interface powered by Appwrite, Plaid, and Dwolla with an EVM staking system built in Solidity and integrated through wagmi, TanStack Query, viem, and Alchemy smart accounts.

The project is currently a testnet/demo application. App USD balances are treated as application funds for the MVP, while on-chain NovaUSD and staking flows run on Base Sepolia.

## Current Architecture

```text
User
  -> Next.js app
  -> Appwrite auth/session
  -> Plaid-linked bank accounts
  -> App USD checkout API
  -> NovaUSD settlement relayer
  -> Base Sepolia NovaUSD
  -> NovaPayStakingVault
  -> sNovaUSD shares
```

The application has two main domains:

- Banking app: authentication, linked bank accounts, balances, transfers, dashboard, transaction history.
- Web3 staking: NovaUSD minting, ERC-4626 staking, sNovaUSD redemption, Base Sepolia reads/writes, and Alchemy account abstraction support.

## Main User Flows

### Banking

1. User signs up or signs in through Appwrite.
2. The app links bank accounts through Plaid.
3. Dwolla funding sources are created for transfer-like flows.
4. Dashboard pages display linked account balances and transactions.
5. Payment transfer pages create Dwolla transfers when available and persist local transaction records.

### App USD To NovaUSD

This is the MVP flow for "pay with own funds" from the banking application:

1. User selects an app funding account on the staking page.
2. User enters a USD amount.
3. Frontend calls `POST /api/novapay/checkout`.
4. API verifies the logged-in user and selected bank account.
5. API checks the selected account has enough available USD balance.
6. API signs a Base Sepolia transaction with a server-side settlement relayer key.
7. Relayer calls `NovaUSD.mint(recipient, amount)`.
8. Frontend refetches token balances and staking previews.

This flow is deliberately a demo settlement flow. It does not move real USD on-chain. The real-world version would need actual payment capture, reconciliation, and compliance logic before minting.

### ETH Gateway To NovaUSD

The deployed gateway also supports a direct testnet ETH flow:

```text
Base Sepolia ETH -> NovaPayGateway.depositEth() -> NovaUSD
```

The gateway uses the Chainlink ETH/USD feed to quote NovaUSD output. This is useful for testing the on-chain path independently from app USD settlement.

### Staking

```text
NovaUSD -> approve vault -> deposit into ERC-4626 vault -> receive sNovaUSD
```

The vault is an ERC-4626 vault:

- Asset: `NovaUSD`
- Share token: `sNovaUSD`
- Yield model: share price appreciation
- Reward preview: deterministic APR math through `InterestRateMath`
- No separate claim function in the current version

Users redeem by burning `sNovaUSD` shares and receiving NovaUSD according to the current share price.

### Account Abstraction

The staking page supports an Alchemy smart account flow:

1. User authorizes an owner wallet.
2. App creates or recovers an Alchemy smart account.
3. Smart account address is stored locally.
4. Smart account can receive ETH and NovaUSD.
5. Staking actions can be sent through Alchemy wallet APIs.

For the app USD checkout, the recommended recipient is the smart account when it exists, because staking actions are performed from that account.

## Deployed Base Sepolia Contracts

Owner and reward reserve:

```text
0xC3616f92ecEEabb61fa0BC7f14b70aC531c8D63d
```

Contracts:

```text
NovaUSD:                0x2cf4ACf94391CDdF3B842B0641995d0F83483764
ChainlinkPriceOracle:   0x9C5F561bF190D1be653F95D5C3586E90D24102FA
NovaPayGateway:         0xF4968D34E8D1FA3Ff33AFE3c7c4F3B17D9aD902E
NovaPayStakingVault:    0x5AF2aE30b9855d87f95194631F2ED966cfF8654a
```

Oracle feed:

```text
Base Sepolia ETH/USD Chainlink feed:
0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1
```

The app USD checkout uses a server-side settlement relayer. The relayer address and role management are operational details and should be kept out of public documentation.

## Repository Structure

```text
src/app
  Next.js App Router pages and API routes

src/app/api/novapay/checkout/route.ts
  App USD checkout endpoint that verifies app balances and relays NovaUSD minting

src/components
  Banking UI, auth UI, sidebar, dashboard, transactions, staking dashboard

src/lib/actions
  Server actions for Appwrite users, banks, transactions, Plaid, and Dwolla

src/lib/web3
  Base Sepolia chain config, wagmi config, contract addresses, ABIs, formatting helpers

contracts
  Foundry workspace with Solidity contracts, tests, deployment scripts

docs
  Architecture and AI handoff notes
```

## Smart Contracts

Main contracts:

- `NovaUSD`: ERC-20 testnet asset with owner-managed minters.
- `NovaPayGateway`: accepts Base Sepolia ETH and mints NovaUSD using an ETH/USD oracle.
- `NovaPayStakingVault`: ERC-4626 vault that accepts NovaUSD and issues `sNovaUSD`.
- `ChainlinkPriceOracle`: validates Chainlink price data and optional L2 sequencer status.
- `InterestRateMath`: pure APR reward preview library.

Contract docs and deployment commands live in `contracts/README.md`.

## Environment Variables

Create `.env.local` in the project root. Do not commit it.

### Appwrite

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT=
APPWRITE_SECRET=
APPWRITE_DATABASE_ID=
APPWRITE_USER_COLLECTION_ID=
APPWRITE_BANK_COLLECTION_ID=
APPWRITE_TRANSACTION_COLLECTION_ID=
```

### Plaid

```env
PLAID_CLIENT_ID=
PLAID_SECRET=
PLAID_ENV=sandbox
PLAID_PRODUCTS=auth,transactions
PLAID_COUNTRY_CODES=US
```

### Dwolla

```env
DWOLLA_KEY=
DWOLLA_SECRET=
DWOLLA_BASE_URL=https://api-sandbox.dwolla.com
DWOLLA_ENV=sandbox
```

### Web3

```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
NEXT_PUBLIC_ALCHEMY_API_KEY=
NEXT_PUBLIC_NOVAPAY_NOVAUSD_ADDRESS=0x2cf4ACf94391CDdF3B842B0641995d0F83483764
NEXT_PUBLIC_NOVAPAY_GATEWAY_ADDRESS=0xF4968D34E8D1FA3Ff33AFE3c7c4F3B17D9aD902E
NEXT_PUBLIC_NOVAPAY_STAKING_VAULT_ADDRESS=0x5AF2aE30b9855d87f95194631F2ED966cfF8654a
```

### Settlement Relayer

The app USD checkout requires a server-only settlement signer configured in the deployment environment. Do not expose relayer private keys or role-management commands in public docs or `NEXT_PUBLIC_*` variables.

## Setup

Install dependencies:

```bash
npm install
```

Run the Next.js app:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

Run TypeScript checks:

```bash
npx tsc --noEmit
```

Run lint:

```bash
npx eslint src/app src/components src/lib
```

The broad `npm run lint` may also scan vendored Solidity dependencies under `contracts/lib` depending on local ESLint behavior. Prefer targeted lint commands for frontend files.

## Foundry Commands

From the `contracts` folder:

```bash
forge build
forge test
forge fmt
```

Deploy to Base Sepolia:

```bash
forge script script/DeployNovaPay.s.sol:DeployNovaPay \
  --rpc-url https://sepolia.base.org \
  --account <foundry-keystore-account> \
  --broadcast
```

## Operational Notes

- The settlement relayer is a separate server-side wallet used by the backend to mint NovaUSD after app USD checkout.
- Never use the protocol owner private key as the settlement relayer key.
- Restart the Next.js dev server after changing `.env.local`.
- App USD balances are currently read from Plaid account data and are treated as demo funds.
- App USD checkout does not currently debit a real bank balance. It validates available balance and mints NovaUSD for the MVP.
- Production settlement would need real payment capture, idempotency keys, reconciliation, fraud controls, and delayed minting until payment finality.

## Current Limitations

- Base Sepolia only.
- App USD checkout is demo settlement, not real fiat settlement.
- The settlement relayer is trusted and can mint NovaUSD while it has minting permission.
- Smart account address is stored in browser local storage.
- Staking yield is previewed by APR math, but real share price appreciation requires the vault to be funded with rewards.
- No production paymaster policy is configured yet.

## Recommended Next Steps

1. Add idempotency to `POST /api/novapay/checkout` so refresh/retry cannot mint twice.
2. Persist NovaUSD checkout status in Appwrite with `pending`, `confirmed`, and `failed` states.
3. Add toast notifications for checkout, approve, stake, and redeem.
4. Add event-driven or block-driven refetch after `Transfer`, `Approval`, `Deposit`, and `Withdraw` events.
5. Add a dedicated admin script for granting and revoking `NovaUSD` minter roles.
6. Add tests for the checkout route and settlement edge cases.
7. Decide whether production NovaUSD should be backed by real payment settlement, USDC, or remain a demo token.

## Security Notes

- Settlement private keys must stay server-only. They must never be exposed through `NEXT_PUBLIC_*`.
- The relayer wallet should hold only enough Base Sepolia ETH for gas.
- Owner operations should use encrypted Foundry keystore accounts.
- Minter permissions should be revoked from any unused relayer.
- Mainnet deployment would require a real economic model and a separate audit.
