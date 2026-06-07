import { NextResponse } from "next/server";
import { createPublicClient, createWalletClient, http, isAddress, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { getAccounts } from "@/lib/actions/bank.actions";
import { createTransaction } from "@/lib/actions/transaction.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { baseSepolia, baseSepoliaChainId } from "@/lib/web3/chains";
import { novaPayAddresses, novaUSDAbi } from "@/lib/web3/contracts";

type CheckoutBody = {
  amount?: string;
  bankId?: string;
  recipient?: string;
};

const getErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    return getErrorResponse("Authentication required.", 401);
  }

  if (!novaPayAddresses.novaUSD) {
    return getErrorResponse("NovaUSD contract address is not configured.", 500);
  }

  const relayerPrivateKey = process.env.NOVAPAY_SETTLEMENT_PRIVATE_KEY as
    | `0x${string}`
    | undefined;

  if (!relayerPrivateKey) {
    return getErrorResponse("Settlement relayer private key is not configured.", 500);
  }

  const body = (await request.json()) as CheckoutBody;
  const amount = body.amount?.trim();
  const bankId = body.bankId?.trim();
  const recipient = body.recipient?.trim();

  if (!amount || !bankId || !recipient || !isAddress(recipient)) {
    return getErrorResponse("Amount, bank account, and recipient are required.");
  }

  const amountNumber = Number(amount);

  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return getErrorResponse("Amount must be greater than zero.");
  }

  const accounts = (await getAccounts({
    userId: loggedIn.$id,
    authUserId: loggedIn.userId,
  })) as { data: Account[] } | undefined;
  const sourceAccount = accounts?.data.find(
    (account) => account.appwriteItemId === bankId,
  );

  if (!sourceAccount) {
    return getErrorResponse("Selected app funding account was not found.", 404);
  }

  if (amountNumber > sourceAccount.currentBalance) {
    return getErrorResponse("Insufficient available USD balance.");
  }

  const mintAmount = parseUnits(amount, 18);
  const relayerAccount = privateKeyToAccount(relayerPrivateKey);
  const transport = http(baseSepolia.rpcUrls.default.http[0]);
  const walletClient = createWalletClient({
    account: relayerAccount,
    chain: baseSepolia,
    transport,
  });
  const publicClient = createPublicClient({
    chain: baseSepolia,
    transport,
  });

  try {
    const hash = await walletClient.writeContract({
      address: novaPayAddresses.novaUSD,
      abi: novaUSDAbi,
      functionName: "mint",
      args: [recipient, mintAmount],
      chain: baseSepolia,
      account: relayerAccount,
    });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    const transaction = await createTransaction({
      name: "NovaUSD purchase",
      amount,
      senderId: loggedIn.$id,
      senderBankId: bankId,
      receiverId: recipient,
      receiverBankId: "novapay-onchain",
      email: loggedIn.email,
    });

    if (!transaction) {
      return getErrorResponse(
        "NovaUSD minted, but the app ledger could not save the debit transaction.",
        500,
      );
    }

    return NextResponse.json({
      amount,
      chainId: baseSepoliaChainId,
      hash,
      recipient,
      status: receipt.status,
    });
  } catch (error) {
    return getErrorResponse(
      error instanceof Error ? error.message : "NovaUSD checkout failed.",
      500,
    );
  }
}
