type ContractAddress = `0x${string}`;

const getAddress = (value: string | undefined) => {
  if (!value || !/^0x[a-fA-F0-9]{40}$/.test(value)) return undefined;

  return value as ContractAddress;
};

export const novaPayAddresses = {
  novaUSD: getAddress(process.env.NEXT_PUBLIC_NOVAPAY_NOVAUSD_ADDRESS),
  gateway: getAddress(process.env.NEXT_PUBLIC_NOVAPAY_GATEWAY_ADDRESS),
  stakingVault: getAddress(process.env.NEXT_PUBLIC_NOVAPAY_STAKING_VAULT_ADDRESS),
};

export const isNovaPayConfigured =
  Boolean(novaPayAddresses.novaUSD) &&
  Boolean(novaPayAddresses.gateway) &&
  Boolean(novaPayAddresses.stakingVault);

export const novaUSDAbi = [
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "decimals",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    type: "function",
    name: "mint",
    stateMutability: "nonpayable",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "symbol",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

export const novaPayGatewayAbi = [
  {
    type: "function",
    name: "depositEth",
    stateMutability: "payable",
    inputs: [],
    outputs: [{ name: "novaUSDAmount", type: "uint256" }],
  },
  {
    type: "function",
    name: "gatewayConfig",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "novaUSD", type: "address" },
          { name: "priceOracle", type: "address" },
          { name: "minEthDeposit", type: "uint256" },
          { name: "paused", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "quoteNovaUSD",
    stateMutability: "view",
    inputs: [{ name: "ethAmount", type: "uint256" }],
    outputs: [
      {
        name: "quote",
        type: "tuple",
        components: [
          { name: "ethAmount", type: "uint256" },
          { name: "ethUsdPrice", type: "uint256" },
          { name: "priceDecimals", type: "uint8" },
          { name: "novaUSDAmount", type: "uint256" },
        ],
      },
    ],
  },
] as const;

export const novaPayStakingVaultAbi = [
  {
    type: "function",
    name: "balanceOf",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "nonpayable",
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    outputs: [{ name: "shares", type: "uint256" }],
  },
  {
    type: "function",
    name: "maxWithdraw",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewDeposit",
    stateMutability: "view",
    inputs: [{ name: "assets", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewRedeem",
    stateMutability: "view",
    inputs: [{ name: "shares", type: "uint256" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "previewReward",
    stateMutability: "view",
    inputs: [
      { name: "principal", type: "uint256" },
      { name: "elapsedTime", type: "uint256" },
    ],
    outputs: [
      {
        name: "preview",
        type: "tuple",
        components: [
          { name: "principal", type: "uint256" },
          { name: "aprBps", type: "uint256" },
          { name: "elapsedTime", type: "uint256" },
          { name: "reward", type: "uint256" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "redeem",
    stateMutability: "nonpayable",
    inputs: [
      { name: "shares", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    outputs: [{ name: "assets", type: "uint256" }],
  },
  {
    type: "function",
    name: "vaultConfig",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "config",
        type: "tuple",
        components: [
          { name: "asset", type: "address" },
          { name: "rewardReserve", type: "address" },
          { name: "minDeposit", type: "uint256" },
          { name: "aprBps", type: "uint256" },
          { name: "yearInSeconds", type: "uint256" },
          { name: "paused", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "vaultStats",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "stats",
        type: "tuple",
        components: [
          { name: "totalAssets", type: "uint256" },
          { name: "totalShares", type: "uint256" },
          { name: "sharePrice", type: "uint256" },
          { name: "aprBps", type: "uint256" },
        ],
      },
    ],
  },
] as const;
