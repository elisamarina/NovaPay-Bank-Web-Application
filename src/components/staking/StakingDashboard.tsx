"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  alchemyWalletTransport,
  createSmartWalletClient,
  type SmartWalletClient,
} from "@alchemy/wallet-apis";
import {
  ArrowDownUp,
  Coins,
  KeyRound,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  useAccount,
  useBalance,
  useConnect,
  useDisconnect,
  useReadContracts,
  useSwitchChain,
  useWalletClient,
  useWriteContract,
} from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";
import { encodeFunctionData, type Address, type Hex } from "viem";

import { Button } from "@/components/ui/button";
import {
  isNovaPayConfigured,
  novaPayAddresses,
  novaPayGatewayAbi,
  novaPayStakingVaultAbi,
  novaUSDAbi,
} from "@/lib/web3/contracts";
import { baseSepolia, baseSepoliaChainId } from "@/lib/web3/chains";
import { wagmiConfig } from "@/lib/web3/wagmi";
import {
  compactAddress,
  formatBps,
  formatScaledAmount,
  formatTokenAmount,
  NOVAUSD_DECIMALS,
  parseTokenAmount,
  SNOVAUSD_DECIMALS,
} from "@/lib/web3/format";
import { cn, formatAmount } from "@/lib/utils";

type ReadResult<T> = {
  result?: T;
  status?: "success" | "failure";
};

type SmartCall = {
  to: Address;
  data?: Hex;
  value?: bigint;
};

type MintPaymentSource = "appUsd" | "connectedWallet" | "smartAccount";

type StakingDashboardProps = {
  accounts: Account[];
};

type OffchainStakePosition = {
  accrued: string;
  accruedNow: string;
  aprBps: string;
  configured: boolean;
  lastAccruedAt: string;
  positionValue: string;
  principal: string;
  smartAccount: string;
  tier: string;
  tierLabel: string;
  updatedAt: number;
};

type OnchainStakePosition = {
  principalAssets: bigint;
  accruedRewards: bigint;
  pendingRewards: bigint;
  totalRewards: bigint;
  aprBps: bigint;
  tier: number;
  lastAccruedAt: number;
};

const ZERO = BigInt(0);
const BPS = BigInt(10_000);
const YEAR_IN_SECONDS = BigInt(365 * 24 * 60 * 60);
const ALCHEMY_API_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const SMART_ACCOUNT_STORAGE_KEY = "novapay.stakingSmartAccount";
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000" as const;
const REWARD_TIER_LABELS = ["Starter", "Growth", "Prime"] as const;

const getResult = <T,>(data: unknown, index: number) =>
  Array.isArray(data) ? (data[index] as ReadResult<T> | undefined)?.result : undefined;

const isPositive = (value: bigint | null | undefined): value is bigint =>
  value !== null && value !== undefined && value > ZERO;

const getStoredSmartAccountAddress = () => {
  if (typeof window === "undefined") return null;

  const storedAddress = window.localStorage.getItem(SMART_ACCOUNT_STORAGE_KEY);

  return /^0x[a-fA-F0-9]{40}$/.test(storedAddress ?? "")
    ? (storedAddress as Address)
    : null;
};

const parseBigIntValue = (value: string | undefined) => {
  try {
    return BigInt(value ?? "0");
  } catch {
    return ZERO;
  }
};

const calculateAccruedInterest = (
  position: OffchainStakePosition,
  nowSeconds: number,
) => {
  const principal = parseBigIntValue(position.principal);
  const accrued = parseBigIntValue(position.accruedNow ?? position.accrued);
  const aprBps = parseBigIntValue(position.aprBps);
  const elapsedSeconds = Math.max(nowSeconds - position.updatedAt, 0);

  if (principal === ZERO || aprBps === ZERO || elapsedSeconds === 0) {
    return accrued;
  }

  return (
    accrued +
    (principal * aprBps * BigInt(elapsedSeconds)) / (BPS * YEAR_IN_SECONDS)
  );
};

const StakingDashboard = ({ accounts }: StakingDashboardProps) => {
  const router = useRouter();
  const [ethAmount, setEthAmount] = useState("0.001");
  const [usdAmount, setUsdAmount] = useState("10");
  const [sellAmount, setSellAmount] = useState("10");
  const [stakeAmount, setStakeAmount] = useState("10");
  const [redeemAmount, setRedeemAmount] = useState("");
  const [mintPaymentSource, setMintPaymentSource] =
    useState<MintPaymentSource>("appUsd");
  const [selectedBankId, setSelectedBankId] = useState(
    accounts[0]?.appwriteItemId ?? "",
  );
  const [localUsdDebits, setLocalUsdDebits] = useState<Record<string, number>>({});
  const [localUsdCredits, setLocalUsdCredits] = useState<Record<string, number>>({});
  const [stakingAccountRequested, setStakingAccountRequested] = useState(false);
  const [smartAccountAddress, setSmartAccountAddress] = useState<Address | null>(null);
  const [smartWalletClient, setSmartWalletClient] =
    useState<SmartWalletClient | null>(null);
  const [stakingPosition, setStakingPosition] =
    useState<OffchainStakePosition | null>(null);
  const [nowSeconds, setNowSeconds] = useState(() => Math.floor(Date.now() / 1000));
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [lastNotice, setLastNotice] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const { address, chainId, isConnected } = useAccount();
  const {
    connectAsync,
    connectors,
    isPending: isConnecting,
  } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync } = useWriteContract();
  const { data: walletClient } = useWalletClient({
    chainId: baseSepoliaChainId,
    query: {
      enabled: isConnected && chainId === baseSepoliaChainId,
    },
  });

  const fetchStakingPosition = useCallback(async () => {
    if (!smartAccountAddress) {
      setStakingPosition(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/novapay/staking/position?account=${smartAccountAddress}`,
      );
      const result = (await response.json()) as {
        error?: string;
        position?: OffchainStakePosition;
      };

      if (!response.ok || !result.position) {
        throw new Error(result.error ?? "Could not load staking position.");
      }

      setStakingPosition(result.position);
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : "Could not load staking position.",
      );
    }
  }, [smartAccountAddress]);

  useEffect(() => {
    const storedSmartAccountAddress = getStoredSmartAccountAddress();

    if (!storedSmartAccountAddress) return;

    setStakingAccountRequested(true);
    setSmartAccountAddress(storedSmartAccountAddress);
  }, []);

  useEffect(() => {
    void fetchStakingPosition();
  }, [fetchStakingPosition]);

  useEffect(() => {
    if (!smartAccountAddress) return;

    const interval = window.setInterval(() => {
      void fetchStakingPosition();
    }, 15_000);

    return () => window.clearInterval(interval);
  }, [fetchStakingPosition, smartAccountAddress]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowSeconds(Math.floor(Date.now() / 1000));
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  const ethAmountParsed = useMemo(
    () => parseTokenAmount(ethAmount, NOVAUSD_DECIMALS),
    [ethAmount],
  );
  const usdAmountParsed = useMemo(
    () => parseTokenAmount(usdAmount, NOVAUSD_DECIMALS),
    [usdAmount],
  );
  const sellAmountParsed = useMemo(
    () => parseTokenAmount(sellAmount, NOVAUSD_DECIMALS),
    [sellAmount],
  );
  const stakeAmountParsed = useMemo(
    () => parseTokenAmount(stakeAmount, NOVAUSD_DECIMALS),
    [stakeAmount],
  );
  const redeemAmountParsed = useMemo(
    () => parseTokenAmount(redeemAmount, SNOVAUSD_DECIMALS),
    [redeemAmount],
  );
  const isCorrectChain = chainId === baseSepoliaChainId;
  const canReadContracts = isNovaPayConfigured;
  const accountForReads = smartAccountAddress ?? EMPTY_ADDRESS;
  const quoteEthAmount = isPositive(ethAmountParsed) ? ethAmountParsed : undefined;
  const depositPreviewAmount = isPositive(stakeAmountParsed)
    ? stakeAmountParsed
    : undefined;
  const redeemPreviewAmount = isPositive(redeemAmountParsed)
    ? redeemAmountParsed
    : undefined;
  const selectedBankAccount =
    accounts.find((account) => account.appwriteItemId === selectedBankId) ??
    accounts[0];

  const { data, isLoading, refetch } = useReadContracts({
    allowFailure: true,
    chainId: baseSepoliaChainId,
    contracts: [
      {
        address: novaPayAddresses.gateway,
        abi: novaPayGatewayAbi,
        functionName: "gatewayConfig",
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "vaultConfig",
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "vaultStats",
      },
      {
        address: novaPayAddresses.novaUSD,
        abi: novaUSDAbi,
        functionName: "balanceOf",
        args: [accountForReads],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "balanceOf",
        args: [accountForReads],
      },
      {
        address: novaPayAddresses.novaUSD,
        abi: novaUSDAbi,
        functionName: "allowance",
        args:
          novaPayAddresses.stakingVault
            ? [accountForReads, novaPayAddresses.stakingVault]
            : undefined,
      },
      {
        address: novaPayAddresses.gateway,
        abi: novaPayGatewayAbi,
        functionName: "quoteNovaUSD",
        args: [quoteEthAmount ?? ZERO],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "previewDeposit",
        args: [depositPreviewAmount ?? ZERO],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "previewRedeem",
        args: [redeemPreviewAmount ?? ZERO],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "previewReward",
        args: [depositPreviewAmount ?? ZERO, YEAR_IN_SECONDS],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "positionOf",
        args: [accountForReads],
      },
      {
        address: novaPayAddresses.stakingVault,
        abi: novaPayStakingVaultAbi,
        functionName: "previewAccrued",
        args: [accountForReads],
      },
    ],
    query: {
      enabled: canReadContracts,
      refetchInterval: 15_000,
    },
  });

  const { data: ethBalance } = useBalance({
    address: smartAccountAddress ?? undefined,
    chainId: baseSepoliaChainId,
    query: {
      enabled: Boolean(smartAccountAddress),
      refetchInterval: 15_000,
    },
  });
  const { data: walletEthBalance } = useBalance({
    address,
    chainId: baseSepoliaChainId,
    query: {
      enabled: Boolean(address),
      refetchInterval: 15_000,
    },
  });

  const gatewayConfig = getResult<{
    minEthDeposit: bigint;
    paused: boolean;
  }>(data, 0);
  const vaultConfig = getResult<{
    minDeposit: bigint;
    aprBps: bigint;
    paused: boolean;
    rewardReserve: string;
  }>(data, 1);
  const vaultStats = getResult<{
    totalAssets: bigint;
    totalShares: bigint;
    sharePrice: bigint;
    aprBps: bigint;
  }>(data, 2);
  const novaUsdBalance = getResult<bigint>(data, 3);
  const sNovaUsdBalance = getResult<bigint>(data, 4);
  const allowance = getResult<bigint>(data, 5) ?? ZERO;
  const mintQuote = getResult<{
    ethUsdPrice: bigint;
    priceDecimals: number;
    novaUSDAmount: bigint;
  }>(data, 6);
  const previewStakeShares = getResult<bigint>(data, 7);
  const previewRedeemAssets = getResult<bigint>(data, 8);
  const rewardPreview = getResult<{
    reward: bigint;
  }>(data, 9);
  const onchainPosition = getResult<OnchainStakePosition>(data, 10);
  const onchainAccruedRewards = getResult<bigint>(data, 11);
  const getDisplayedUsdBalance = (account: Account) => {
    const localDebit = localUsdDebits[account.appwriteItemId] ?? 0;
    const localCredit = localUsdCredits[account.appwriteItemId] ?? 0;

    return Math.max(account.currentBalance - localDebit + localCredit, 0);
  };

  const needsApproval =
    isPositive(stakeAmountParsed) && allowance < (stakeAmountParsed ?? ZERO);
  const transactionBusy = Boolean(pendingAction);
  const smartAccountNeedsFunding =
    Boolean(smartAccountAddress) && ethBalance?.value === ZERO;
  const appUsdAmountNumber = Number(usdAmount);
  const appUsdBalance =
    selectedBankAccount === undefined
      ? undefined
      : getDisplayedUsdBalance(selectedBankAccount);
  const appUsdNeedsFunding =
    mintPaymentSource === "appUsd" &&
    isPositive(usdAmountParsed) &&
    appUsdBalance !== undefined &&
    Number.isFinite(appUsdAmountNumber) &&
    appUsdAmountNumber > appUsdBalance;
  const sellNeedsBalance =
    isPositive(sellAmountParsed) &&
    novaUsdBalance !== undefined &&
    novaUsdBalance < sellAmountParsed;
  const selectedMintBalance =
    mintPaymentSource === "smartAccount" ? ethBalance?.value : walletEthBalance?.value;
  const selectedMintPayer =
    mintPaymentSource === "appUsd"
      ? selectedBankAccount?.name
      : mintPaymentSource === "smartAccount"
        ? smartAccountAddress
        : address;
  const selectedMintRecipient =
    mintPaymentSource === "smartAccount"
      ? smartAccountAddress
      : mintPaymentSource === "appUsd"
        ? smartAccountAddress ?? address
        : address;
  const selectedMintBalanceLabel =
    mintPaymentSource === "appUsd"
      ? "App USD balance"
      : mintPaymentSource === "smartAccount"
        ? "Staking account ETH"
        : "Wallet ETH";
  const selectedMintSourceLabel =
    mintPaymentSource === "appUsd"
      ? "NovaPay app USD"
      : mintPaymentSource === "smartAccount"
        ? "Staking account"
        : "Connected wallet";
  const mintSourceNeedsFunding =
    mintPaymentSource !== "appUsd" &&
    isPositive(ethAmountParsed) &&
    selectedMintBalance !== undefined &&
    selectedMintBalance < ethAmountParsed;
  const expectedNovaUsd =
    mintPaymentSource === "appUsd"
      ? usdAmountParsed ?? undefined
      : mintQuote?.novaUSDAmount;
  const selectedMintBalanceValue =
    mintPaymentSource === "appUsd"
      ? appUsdBalance === undefined
        ? "-"
        : formatAmount(appUsdBalance)
      : `${formatTokenAmount(selectedMintBalance, NOVAUSD_DECIMALS, 5)} ETH`;
  const selectedMintPayerValue =
    mintPaymentSource === "appUsd"
      ? selectedBankAccount?.name ?? "-"
      : selectedMintPayer
        ? compactAddress(selectedMintPayer)
        : "-";
  const selectedMintRecipientValue =
    !selectedMintRecipient
      ? mintPaymentSource === "appUsd"
        ? "Authorize wallet or create staking account"
        : "-"
      : compactAddress(selectedMintRecipient);
  const ethUsdPrice =
    mintQuote?.ethUsdPrice === undefined
      ? "-"
      : `$${formatScaledAmount(
          mintQuote.ethUsdPrice,
          mintQuote.priceDecimals,
          2,
        )}`;
  const hasOnchainPosition = Boolean(onchainPosition && smartAccountAddress);
  const trackedPrincipal = onchainPosition
    ? onchainPosition.principalAssets
    : stakingPosition
      ? parseBigIntValue(stakingPosition.principal)
      : ZERO;
  const estimatedAccruedInterest =
    onchainAccruedRewards ??
    (stakingPosition
      ? calculateAccruedInterest(stakingPosition, nowSeconds)
      : ZERO);
  const estimatedPositionValue = trackedPrincipal + estimatedAccruedInterest;
  const userAprBps = onchainPosition
    ? onchainPosition.aprBps
    : stakingPosition
      ? parseBigIntValue(stakingPosition.aprBps)
      : undefined;
  const estimatedDailyRewards =
    userAprBps === undefined
      ? undefined
      : (trackedPrincipal * userAprBps) / (BPS * BigInt(365));
  const rewardTierLabel = onchainPosition
    ? (REWARD_TIER_LABELS[onchainPosition.tier] ?? `Tier ${onchainPosition.tier}`)
    : stakingPosition?.tierLabel;

  const authorizeOwnerWallet = async () => {
    setLastError(null);
    setLastNotice(null);

    try {
      const connector = connectors[0];

      if (isConnected) {
        setLastNotice("Wallet owner is already authorized.");
        return;
      }

      if (!connector) {
        setLastError("No injected wallet was found for account ownership.");
        return;
      }

      setPendingAction("Authorizing owner wallet");
      await connectAsync({ connector });
      setLastNotice("Wallet owner authorized.");
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : "Could not authorize owner wallet.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const createStakingAccount = async () => {
    setLastError(null);
    setLastNotice(null);
    setStakingAccountRequested(true);

    try {
      if (!ALCHEMY_API_KEY) {
        setLastError("Set NEXT_PUBLIC_ALCHEMY_API_KEY in .env first.");
        return;
      }

      if (!isConnected) {
        await authorizeOwnerWallet();
        return;
      }

      if (!isCorrectChain) {
        switchChain({ chainId: baseSepoliaChainId });
        return;
      }

      if (!walletClient) {
        setLastError("Wallet owner session is not ready yet. Try again.");
        return;
      }

      setPendingAction("Creating staking account");

      const client = createSmartWalletClient({
        signer: walletClient,
        chain: baseSepolia,
        transport: alchemyWalletTransport({
          apiKey: ALCHEMY_API_KEY,
        }),
      });
      const smartAccount = await client.requestAccount();

      setSmartWalletClient(client);
      setSmartAccountAddress(smartAccount.address);
      window.localStorage.setItem(SMART_ACCOUNT_STORAGE_KEY, smartAccount.address);
      setLastNotice(null);
      void refetch();
    } catch (error) {
      setLastError(
        error instanceof Error ? error.message : "Could not create staking account.",
      );
    } finally {
      setPendingAction(null);
    }
  };

  const getSmartWalletClient = async () => {
    if (!ALCHEMY_API_KEY) {
      throw new Error("Set NEXT_PUBLIC_ALCHEMY_API_KEY in .env first.");
    }
    if (!walletClient) {
      throw new Error("Create the staking account before sending transactions.");
    }

    if (smartWalletClient) return smartWalletClient;

    const client = createSmartWalletClient({
      signer: walletClient,
      chain: baseSepolia,
      account: smartAccountAddress ?? undefined,
      transport: alchemyWalletTransport({
        apiKey: ALCHEMY_API_KEY,
      }),
    });

    setSmartWalletClient(client);

    return client;
  };

  const runTransaction = async (
    label: string,
    callback: () => Promise<unknown>,
  ) => {
    setLastError(null);
    setLastNotice(null);
    setPendingAction(label);

    try {
      await callback();
    } catch (error) {
      setLastError(error instanceof Error ? error.message : "Transaction failed.");
    } finally {
      setPendingAction(null);
    }
  };

  const sendSmartCalls = async (calls: SmartCall[]) => {
    if (!smartAccountAddress) {
      throw new Error("Create a staking account first.");
    }

    const client = await getSmartWalletClient();
    const result = await client.sendCalls({
      account: smartAccountAddress,
      chain: { id: baseSepoliaChainId },
      calls,
    });

    await client.waitForCallsStatus({ id: result.id });
    void refetch();
  };

  const recordStakeDeposit = async (amount: bigint) => {
    if (!smartAccountAddress) {
      throw new Error("Create a staking account first.");
    }

    const response = await fetch("/api/novapay/staking/record-deposit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amount.toString(),
        smartAccount: smartAccountAddress,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      position?: OffchainStakePosition;
    };

    if (!response.ok || !result.position) {
      throw new Error(result.error ?? "Could not record staking deposit.");
    }

    setStakingPosition(result.position);
  };

  const recordStakeRedeem = async (assets: bigint | undefined) => {
    if (!smartAccountAddress) {
      throw new Error("Create a staking account first.");
    }
    if (!assets || assets <= ZERO) {
      throw new Error("Could not estimate redeemed NovaUSD assets.");
    }

    const response = await fetch("/api/novapay/staking/record-redeem", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assets: assets.toString(),
        smartAccount: smartAccountAddress,
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      position?: OffchainStakePosition;
    };

    if (!response.ok || !result.position) {
      throw new Error(result.error ?? "Could not record staking redeem.");
    }

    setStakingPosition(result.position);
  };

  const depositEthFromSmartAccount = () => {
    const gateway = novaPayAddresses.gateway;
    const amount = ethAmountParsed;

    if (!gateway || !isPositive(amount)) return;

    void runTransaction("Minting NovaUSD", () =>
      sendSmartCalls([
        {
          to: gateway,
          value: amount,
          data: encodeFunctionData({
            abi: novaPayGatewayAbi,
            functionName: "depositEth",
          }),
        },
      ]),
    );
  };

  const depositEthFromWallet = () => {
    const gateway = novaPayAddresses.gateway;
    const amount = ethAmountParsed;

    if (!gateway || !isPositive(amount)) return;

    void runTransaction("Minting NovaUSD", async () => {
      const hash = await writeContractAsync({
        address: gateway,
        abi: novaPayGatewayAbi,
        functionName: "depositEth",
        chainId: baseSepoliaChainId,
        value: amount,
      });

      await waitForTransactionReceipt(wagmiConfig, {
        chainId: baseSepoliaChainId,
        hash,
      });
      void refetch();
    });
  };

  const checkoutAppUsd = () => {
    const amount = usdAmountParsed;
    const recipient = selectedMintRecipient;

    if (!selectedBankAccount || !recipient || !isPositive(amount)) return;

    void runTransaction("Buying NovaUSD", async () => {
      const response = await fetch("/api/novapay/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: usdAmount,
          bankId: selectedBankAccount.appwriteItemId,
          recipient,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "NovaUSD checkout failed.");
      }

      setLocalUsdDebits((currentDebits) => ({
        ...currentDebits,
        [selectedBankAccount.appwriteItemId]:
          (currentDebits[selectedBankAccount.appwriteItemId] ?? 0) +
          Number(usdAmount),
      }));
      router.refresh();
      await refetch();
    });
  };

  const depositEth = () => {
    if (mintPaymentSource === "appUsd") {
      checkoutAppUsd();
      return;
    }

    if (mintPaymentSource === "smartAccount") {
      depositEthFromSmartAccount();
      return;
    }

    depositEthFromWallet();
  };

  const sellNovaUsd = () => {
    const novaUSD = novaPayAddresses.novaUSD;
    const amount = sellAmountParsed;

    if (
      !novaUSD ||
      !smartAccountAddress ||
      !selectedBankAccount ||
      !isPositive(amount)
    ) {
      return;
    }

    void runTransaction("Selling NovaUSD", async () => {
      await sendSmartCalls([
        {
          to: novaUSD,
          data: encodeFunctionData({
            abi: novaUSDAbi,
            functionName: "burn",
            args: [amount],
          }),
        },
      ]);

      const response = await fetch("/api/novapay/redeem", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: sellAmount,
          bankId: selectedBankAccount.appwriteItemId,
          source: smartAccountAddress,
        }),
      });
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(result.error ?? "NovaUSD sale could not be recorded.");
      }

      setLocalUsdCredits((currentCredits) => ({
        ...currentCredits,
        [selectedBankAccount.appwriteItemId]:
          (currentCredits[selectedBankAccount.appwriteItemId] ?? 0) +
          Number(sellAmount),
      }));
      router.refresh();
      await refetch();
    });
  };

  const approveStake = () => {
    const novaUSD = novaPayAddresses.novaUSD;
    const stakingVault = novaPayAddresses.stakingVault;
    const amount = stakeAmountParsed;

    if (!novaUSD || !stakingVault || !isPositive(amount)) return;

    void runTransaction("Approving NovaUSD", () =>
      sendSmartCalls([
        {
          to: novaUSD,
          data: encodeFunctionData({
            abi: novaUSDAbi,
            functionName: "approve",
            args: [stakingVault, amount],
          }),
        },
      ]),
    );
  };

  const stakeNovaUsd = () => {
    const stakingVault = novaPayAddresses.stakingVault;
    const amount = stakeAmountParsed;

    if (!smartAccountAddress || !stakingVault || !isPositive(amount)) {
      return;
    }

    void runTransaction("Staking NovaUSD", async () => {
      await sendSmartCalls([
        {
          to: stakingVault,
          data: encodeFunctionData({
            abi: novaPayStakingVaultAbi,
            functionName: "deposit",
            args: [amount, smartAccountAddress],
          }),
        },
      ]);
      if (hasOnchainPosition) {
        await refetch();
        void fetchStakingPosition();
        return;
      }
      await recordStakeDeposit(amount);
    });
  };

  const redeemShares = () => {
    const stakingVault = novaPayAddresses.stakingVault;
    const amount = redeemAmountParsed;

    if (!smartAccountAddress || !stakingVault || !isPositive(amount)) {
      return;
    }

    void runTransaction("Redeeming sNovaUSD", async () => {
      await sendSmartCalls([
        {
          to: stakingVault,
          data: encodeFunctionData({
            abi: novaPayStakingVaultAbi,
            functionName: "redeem",
            args: [amount, smartAccountAddress, smartAccountAddress],
          }),
        },
      ]);
      if (hasOnchainPosition) {
        await refetch();
        void fetchStakingPosition();
        return;
      }
      await recordStakeRedeem(previewRedeemAssets);
    });
  };

  return (
    <section className="no-scrollbar h-full w-full overflow-y-auto bg-gray-25 px-5 py-6 dark:bg-slate-950 sm:px-8 lg:py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-end">
          <div>
            <p className="text-14 font-semibold uppercase tracking-[0.18em] text-bankGradient">
              Base Sepolia
            </p>
            <h1 className="mt-2 text-30 font-semibold text-gray-900 dark:text-slate-50">
              NovaPay Staking
            </h1>
            <p className="mt-2 max-w-2xl text-16 text-gray-600 dark:text-slate-400">
              Mint NovaUSD from test ETH, stake into the ERC-4626 vault, and
              track sNovaUSD share value from the deployed contracts.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {!isConnected && (
              <Button
                type="button"
                variant="outline"
                onClick={() => void authorizeOwnerWallet()}
                disabled={isConnecting || transactionBusy}
              >
                {isConnecting ||
                pendingAction === "Authorizing owner wallet" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Wallet />
                )}
                Authorize owner wallet
              </Button>
            )}
            {isConnected && (
              <>
              {!isCorrectChain && (
                <Button
                  type="button"
                  onClick={() => switchChain({ chainId: baseSepoliaChainId })}
                  disabled={isSwitching}
                >
                  {isSwitching && <Loader2 className="animate-spin" />}
                  Switch to Base Sepolia
                </Button>
              )}
              <Button type="button" variant="outline" onClick={() => disconnect()}>
                <Wallet />
                {compactAddress(address)}
              </Button>
              </>
            )}
          </div>
        </div>

        {!smartAccountAddress && (
          <div className="rounded-lg border border-purple-200 bg-white p-5 shadow-form dark:border-purple-900/60 dark:bg-slate-900">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-bankGradient dark:bg-purple-950/40 dark:text-purple-300">
                  <KeyRound />
                </div>
                <div>
                  <h2 className="text-20 font-semibold text-gray-900 dark:text-slate-50">
                    Create staking account
                  </h2>
                  <p className="mt-1 max-w-2xl text-14 text-gray-600 dark:text-slate-400">
                    Create or recover an Alchemy smart account for staking.
                    This account receives ETH, mints NovaUSD, and owns the
                    sNovaUSD position.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => void createStakingAccount()}
                disabled={isConnecting || transactionBusy}
                className="w-full lg:w-auto"
              >
                {isConnecting || pendingAction === "Creating staking account" ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <KeyRound />
                )}
                Create staking account
              </Button>
            </div>
          </div>
        )}

        {stakingAccountRequested && !isConnected && (
          <StatusPanel tone="info" title="Wallet authorization required">
            <p>
              Approve the wallet prompt once to authorize the Alchemy smart
              account owner. Staking transactions will run from the smart
              account.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => void authorizeOwnerWallet()}
              disabled={isConnecting || transactionBusy}
            >
              {isConnecting || pendingAction === "Authorizing owner wallet" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Wallet />
              )}
              Authorize owner wallet
            </Button>
          </StatusPanel>
        )}

        {smartAccountAddress && (
          <StatusPanel
            tone={smartAccountNeedsFunding ? "warning" : "info"}
            title="Staking account"
            body={
              smartAccountNeedsFunding
                ? `Fund your account in order to use the staking features at this address: ${smartAccountAddress}`
                : `Active smart account: ${smartAccountAddress}`
            }
          />
        )}

        {!isNovaPayConfigured && (
          <StatusPanel
            tone="warning"
            title="Contract addresses missing"
            body="Set NEXT_PUBLIC_NOVAPAY_NOVAUSD_ADDRESS, NEXT_PUBLIC_NOVAPAY_GATEWAY_ADDRESS, and NEXT_PUBLIC_NOVAPAY_STAKING_VAULT_ADDRESS in .env."
          />
        )}

        {lastError && (
          <StatusPanel tone="error" title="Transaction error" body={lastError} />
        )}

        {lastNotice && (
          <StatusPanel tone="info" title="Staking account" body={lastNotice} />
        )}

        {stakingPosition && !stakingPosition.configured && (
          <StatusPanel
            tone="warning"
            title="Fallback rewards cache not configured"
            body="Create the Appwrite staking position collection and set APPWRITE_STAKING_POSITION_COLLECTION_ID if you need fallback tracking before the on-chain vault redeploy."
          />
        )}

        {transactionBusy && (
          <StatusPanel
            tone="info"
            title={pendingAction ?? "Transaction pending"}
            body="Waiting for checkout, owner approval, or smart account execution on Base Sepolia."
          />
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={<Wallet />}
            label="Staking account ETH"
            value={`${formatTokenAmount(ethBalance?.value, NOVAUSD_DECIMALS, 5)} ETH`}
          />
          <MetricCard
            icon={<Coins />}
            label="NovaUSD balance"
            value={`${formatTokenAmount(novaUsdBalance, NOVAUSD_DECIMALS)} NOVAUSD`}
          />
          <MetricCard
            icon={<ShieldCheck />}
            label="sNovaUSD balance"
            value={`${formatTokenAmount(sNovaUsdBalance, SNOVAUSD_DECIMALS)} sNovaUSD`}
          />
          <MetricCard
            icon={<Landmark />}
            label="Reference APR"
            value={formatBps(vaultStats?.aprBps ?? vaultConfig?.aprBps)}
          />
          <MetricCard
            icon={<ArrowDownUp />}
            label="Share price"
            value={`${formatTokenAmount(vaultStats?.sharePrice, NOVAUSD_DECIMALS, 6)} NOVAUSD`}
          />
          <MetricCard
            icon={<Landmark />}
            label="Reward tier"
            value={
              rewardTierLabel
                ? `${rewardTierLabel} · ${formatBps(userAprBps)}`
                : "-"
            }
          />
          <MetricCard
            icon={<Landmark />}
            label="Tracked principal"
            value={`${formatTokenAmount(trackedPrincipal, NOVAUSD_DECIMALS)} NOVAUSD`}
          />
          <MetricCard
            icon={<ArrowDownUp />}
            label="Est. accrued interest"
            value={`${formatTokenAmount(estimatedAccruedInterest, NOVAUSD_DECIMALS, 8)} NOVAUSD`}
          />
          <MetricCard
            icon={<ArrowDownUp />}
            label="Est. rewards/day"
            value={`${formatTokenAmount(estimatedDailyRewards, NOVAUSD_DECIMALS, 6)} NOVAUSD`}
          />
          <MetricCard
            icon={<ShieldCheck />}
            label="Est. position value"
            value={`${formatTokenAmount(estimatedPositionValue, NOVAUSD_DECIMALS, 8)} NOVAUSD`}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
          <ActionCard
            title="Mint NovaUSD"
            description="Choose between app USD checkout and the ETH gateway that is already deployed on Base Sepolia."
          >
            {mintPaymentSource === "appUsd" && (
              <label className="flex flex-col gap-2">
                <span className="text-14 font-medium text-gray-700 dark:text-slate-300">
                  App funding account
                </span>
                <select
                  value={selectedBankAccount?.appwriteItemId ?? ""}
                  onChange={(event) => setSelectedBankId(event.target.value)}
                  className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-14 font-medium text-gray-900 outline-none focus:border-bankGradient focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:ring-purple-950"
                  disabled={!accounts.length}
                >
                  {!accounts.length && (
                    <option value="">No app funding accounts</option>
                  )}
                  {accounts.map((account) => (
                    <option
                      key={account.appwriteItemId || account.id}
                      value={account.appwriteItemId}
                    >
                      {account.name} · {formatAmount(getDisplayedUsdBalance(account))}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <AmountInput
              label={mintPaymentSource === "appUsd" ? "USD amount" : "ETH amount"}
              value={mintPaymentSource === "appUsd" ? usdAmount : ethAmount}
              onChange={
                mintPaymentSource === "appUsd" ? setUsdAmount : setEthAmount
              }
              suffix={mintPaymentSource === "appUsd" ? "USD" : "ETH"}
            />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-3">
              <FundingSourceCard
                active={mintPaymentSource === "appUsd"}
                label="App balance"
                title="USD funds"
                balance={
                  appUsdBalance === undefined ? "-" : formatAmount(appUsdBalance)
                }
                detail={
                  selectedBankAccount
                    ? `${selectedBankAccount.name} · **** ${selectedBankAccount.mask}`
                    : "Link a bank account"
                }
                onClick={() => setMintPaymentSource("appUsd")}
              />
              <FundingSourceCard
                active={mintPaymentSource === "connectedWallet"}
                label="ETH wallet"
                title="Connected wallet"
                balance={`${formatTokenAmount(
                  walletEthBalance?.value,
                  NOVAUSD_DECIMALS,
                  5,
                )} ETH`}
                detail={address ? compactAddress(address) : "Authorize wallet"}
                onClick={() => setMintPaymentSource("connectedWallet")}
              />
              <FundingSourceCard
                active={mintPaymentSource === "smartAccount"}
                label="AA wallet"
                title="Staking account"
                balance={`${formatTokenAmount(
                  ethBalance?.value,
                  NOVAUSD_DECIMALS,
                  5,
                )} ETH`}
                detail={
                  smartAccountAddress
                    ? compactAddress(smartAccountAddress)
                    : "Create account"
                }
                onClick={() => setMintPaymentSource("smartAccount")}
              />
            </div>
            <InfoRow
              label={selectedMintBalanceLabel}
              value={selectedMintBalanceValue}
            />
            <InfoRow
              label="Payer"
              value={selectedMintPayerValue}
            />
            <InfoRow
              label="Recipient"
              value={selectedMintRecipientValue}
            />
            <InfoRow
              label="Payment method"
              value={selectedMintSourceLabel}
            />
            <InfoRow
              label={mintPaymentSource === "appUsd" ? "USD/NovaUSD rate" : "ETH/USD price"}
              value={mintPaymentSource === "appUsd" ? "1:1" : ethUsdPrice}
            />
            {mintPaymentSource !== "appUsd" && (
              <InfoRow
                label="Min deposit"
                value={`${formatTokenAmount(gatewayConfig?.minEthDeposit, NOVAUSD_DECIMALS, 5)} ETH`}
              />
            )}
            <InfoRow
              label="Expected NovaUSD"
              value={`${formatTokenAmount(expectedNovaUsd, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <Button
              type="button"
              className="mt-2 w-full"
              disabled={
                (mintPaymentSource !== "appUsd" && !isConnected) ||
                (mintPaymentSource === "smartAccount" && !smartAccountAddress) ||
                (mintPaymentSource !== "appUsd" && !isCorrectChain) ||
                (mintPaymentSource === "appUsd"
                  ? !isPositive(usdAmountParsed)
                  : !isPositive(ethAmountParsed)) ||
                mintSourceNeedsFunding ||
                appUsdNeedsFunding ||
                (mintPaymentSource === "appUsd" && !selectedBankAccount) ||
                (mintPaymentSource === "appUsd" && !selectedMintRecipient) ||
                gatewayConfig?.paused ||
                transactionBusy
              }
              onClick={depositEth}
            >
              {transactionBusy &&
                (pendingAction === "Minting NovaUSD" ||
                  pendingAction === "Buying NovaUSD") && (
                  <Loader2 className="animate-spin" />
                )}
              {mintPaymentSource === "appUsd" ? "Buy NovaUSD" : "Mint NovaUSD"}
            </Button>
            {appUsdNeedsFunding && (
              <p className="text-12 font-medium text-orange-600 dark:text-orange-300">
                Selected app account does not have enough available USD for
                this purchase.
              </p>
            )}
            {mintSourceNeedsFunding && (
              <p className="text-12 font-medium text-orange-600 dark:text-orange-300">
                Selected source does not have enough Base Sepolia ETH for this
                mint amount.
              </p>
            )}
          </ActionCard>

          <ActionCard
            title="Sell NovaUSD"
            description="Burn NovaUSD from the staking account and credit the selected app funding account."
          >
            <label className="flex flex-col gap-2">
              <span className="text-14 font-medium text-gray-700 dark:text-slate-300">
                Cash destination
              </span>
              <select
                value={selectedBankAccount?.appwriteItemId ?? ""}
                onChange={(event) => setSelectedBankId(event.target.value)}
                className="h-11 rounded-lg border border-gray-300 bg-white px-3 text-14 font-medium text-gray-900 outline-none focus:border-bankGradient focus:ring-2 focus:ring-purple-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:focus:ring-purple-950"
                disabled={!accounts.length}
              >
                {!accounts.length && <option value="">No app funding accounts</option>}
                {accounts.map((account) => (
                  <option
                    key={account.appwriteItemId || account.id}
                    value={account.appwriteItemId}
                  >
                    {account.name} · {formatAmount(getDisplayedUsdBalance(account))}
                  </option>
                ))}
              </select>
            </label>
            <AmountInput
              label="NovaUSD amount"
              value={sellAmount}
              onChange={setSellAmount}
              suffix="NOVAUSD"
            />
            <InfoRow
              label="Source"
              value={
                smartAccountAddress
                  ? compactAddress(smartAccountAddress)
                  : "Create staking account"
              }
            />
            <InfoRow
              label="Available NovaUSD"
              value={`${formatTokenAmount(novaUsdBalance, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <InfoRow
              label="Expected app USD"
              value={`${formatTokenAmount(sellAmountParsed ?? undefined, NOVAUSD_DECIMALS)} USD`}
            />
            <Button
              type="button"
              className="mt-2 w-full"
              disabled={
                !isConnected ||
                !smartAccountAddress ||
                !isCorrectChain ||
                !selectedBankAccount ||
                !isPositive(sellAmountParsed) ||
                sellNeedsBalance ||
                transactionBusy
              }
              onClick={sellNovaUsd}
            >
              {transactionBusy && pendingAction === "Selling NovaUSD" && (
                <Loader2 className="animate-spin" />
              )}
              Sell NovaUSD
            </Button>
            {sellNeedsBalance && (
              <p className="text-12 font-medium text-orange-600 dark:text-orange-300">
                Staking account does not have enough NovaUSD to sell this
                amount.
              </p>
            )}
          </ActionCard>

          <ActionCard
            title="Stake NovaUSD"
            description="Approve NovaUSD, then deposit it into the ERC-4626 vault."
          >
            <AmountInput
              label="NovaUSD amount"
              value={stakeAmount}
              onChange={setStakeAmount}
              suffix="NOVAUSD"
            />
            <InfoRow
              label="Minimum"
              value={`${formatTokenAmount(vaultConfig?.minDeposit, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <InfoRow
              label="Expected shares"
              value={`${formatTokenAmount(previewStakeShares, SNOVAUSD_DECIMALS)} sNovaUSD`}
            />
            <InfoRow
              label="1 year reward preview"
              value={`${formatTokenAmount(rewardPreview?.reward, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <InfoRow
              label="Estimated accrued"
              value={`${formatTokenAmount(estimatedAccruedInterest, NOVAUSD_DECIMALS, 8)} NOVAUSD`}
            />
            <div className="mt-2 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
              <Button
                type="button"
                variant="outline"
                disabled={
                  !isConnected ||
                  !smartAccountAddress ||
                  !isCorrectChain ||
                  !isPositive(stakeAmountParsed) ||
                  !needsApproval ||
                  transactionBusy
                }
                onClick={approveStake}
              >
                {transactionBusy && pendingAction === "Approving NovaUSD" && (
                  <Loader2 className="animate-spin" />
                )}
                Approve
              </Button>
              <Button
                type="button"
                disabled={
                  !isConnected ||
                  !smartAccountAddress ||
                  !isCorrectChain ||
                  !isPositive(stakeAmountParsed) ||
                  needsApproval ||
                  vaultConfig?.paused ||
                  transactionBusy
                }
                onClick={stakeNovaUsd}
              >
                {transactionBusy && pendingAction === "Staking NovaUSD" && (
                  <Loader2 className="animate-spin" />
                )}
                Stake
              </Button>
            </div>
          </ActionCard>

          <ActionCard
            title="Redeem sNovaUSD"
            description="Redeem vault shares back into NovaUSD at the current share price."
          >
            <AmountInput
              label="sNovaUSD amount"
              value={redeemAmount}
              onChange={setRedeemAmount}
              suffix="sNovaUSD"
            />
            <InfoRow
              label="Expected NovaUSD"
              value={`${formatTokenAmount(previewRedeemAssets, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <InfoRow
              label="Vault assets"
              value={`${formatTokenAmount(vaultStats?.totalAssets, NOVAUSD_DECIMALS)} NOVAUSD`}
            />
            <InfoRow
              label="Vault shares"
              value={`${formatTokenAmount(vaultStats?.totalShares, SNOVAUSD_DECIMALS)} sNovaUSD`}
            />
            <Button
              type="button"
              className="mt-2 w-full"
              disabled={
                !isConnected ||
                !smartAccountAddress ||
                !isCorrectChain ||
                !isPositive(redeemAmountParsed) ||
                vaultConfig?.paused ||
                transactionBusy
              }
              onClick={redeemShares}
            >
              {transactionBusy && pendingAction === "Redeeming sNovaUSD" && (
                <Loader2 className="animate-spin" />
              )}
              Redeem
            </Button>
          </ActionCard>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 pt-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-14 text-gray-600 dark:text-slate-400">
            Gateway: {compactAddress(novaPayAddresses.gateway)} · Vault:{" "}
            {compactAddress(novaPayAddresses.stakingVault)}
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => void refetch()}
            disabled={!canReadContracts || isLoading}
          >
            <RefreshCw className={cn(isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-form dark:border-slate-800 dark:bg-slate-900">
    <div className="mb-4 flex size-10 items-center justify-center rounded-lg bg-purple-50 text-bankGradient dark:bg-purple-950/40 dark:text-purple-300">
      {icon}
    </div>
    <p className="text-12 font-medium uppercase tracking-[0.12em] text-gray-500 dark:text-slate-500">
      {label}
    </p>
    <p className="mt-2 break-words text-20 font-semibold text-gray-900 dark:text-slate-50">
      {value}
    </p>
  </div>
);

const FundingSourceCard = ({
  active,
  balance,
  detail,
  label,
  onClick,
  title,
}: {
  active: boolean;
  balance: string;
  detail: string;
  label: string;
  onClick: () => void;
  title: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex min-h-[118px] flex-col justify-between rounded-lg border p-4 text-left transition-all",
      active
        ? "border-purple-300 bg-bank-gradient text-white shadow-creditCard ring-2 ring-purple-200/70 dark:border-purple-300 dark:ring-purple-500/30"
        : "border-gray-200 bg-white text-gray-900 hover:border-purple-200 hover:bg-purple-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-purple-700 dark:hover:bg-slate-900",
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p
          className={cn(
            "text-11 font-semibold uppercase tracking-[0.16em]",
            active ? "text-white/75" : "text-gray-500 dark:text-slate-500",
          )}
        >
          {label}
        </p>
        <p className="mt-1 text-16 font-semibold">{title}</p>
      </div>
      <span
        className={cn(
          "rounded-full px-2 py-1 text-11 font-semibold",
          active
            ? "bg-white/20 text-white"
            : "bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-slate-300",
        )}
      >
        {active ? "Selected" : "Select"}
      </span>
    </div>
    <div>
      <p className={cn("text-18 font-semibold", active && "text-white")}>
        {balance}
      </p>
      <p
        className={cn(
          "mt-1 text-12",
          active ? "text-white/75" : "text-gray-500 dark:text-slate-500",
        )}
      >
        {detail}
      </p>
    </div>
  </button>
);

const ActionCard = ({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) => (
  <div className="flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-5 shadow-form dark:border-slate-800 dark:bg-slate-900">
    <div>
      <h2 className="text-18 font-semibold text-gray-900 dark:text-slate-50">
        {title}
      </h2>
      <p className="mt-1 text-14 text-gray-600 dark:text-slate-400">
        {description}
      </p>
    </div>
    {children}
  </div>
);

const AmountInput = ({
  label,
  onChange,
  suffix,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  suffix: string;
  value: string;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-14 font-medium text-gray-700 dark:text-slate-300">
      {label}
    </span>
    <div className="flex h-11 items-center rounded-lg border border-gray-300 bg-white px-3 focus-within:border-bankGradient focus-within:ring-2 focus-within:ring-purple-100 dark:border-slate-700 dark:bg-slate-950 dark:focus-within:ring-purple-950">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-16 text-gray-900 outline-none placeholder:text-gray-400 dark:text-slate-50 dark:placeholder:text-slate-600"
        placeholder="0.00"
      />
      <span className="ml-3 shrink-0 text-12 font-semibold text-gray-500 dark:text-slate-500">
        {suffix}
      </span>
    </div>
  </label>
);

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-4 text-14">
    <span className="text-gray-500 dark:text-slate-500">{label}</span>
    <span className="text-right font-medium text-gray-800 dark:text-slate-200">
      {value}
    </span>
  </div>
);

const StatusPanel = ({
  body,
  children,
  title,
  tone,
}: {
  body?: string;
  children?: React.ReactNode;
  title: string;
  tone: "error" | "info" | "warning";
}) => (
  <div
    className={cn(
      "rounded-lg border p-4 text-14",
      tone === "error" &&
        "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200",
      tone === "info" &&
        "border-blue-100 bg-blue-25 text-blue-900 dark:border-purple-900/60 dark:bg-purple-950/30 dark:text-purple-100",
      tone === "warning" &&
        "border-orange-200 bg-orange-50 text-orange-800 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-200",
    )}
  >
    <p className="font-semibold">{title}</p>
    {body && <p className="mt-1">{body}</p>}
    {children && <div className="mt-1">{children}</div>}
  </div>
);

export default StakingDashboard;
