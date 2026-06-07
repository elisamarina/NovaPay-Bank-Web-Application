import { NextResponse } from "next/server";
import { isAddress } from "viem";

import { getAccounts } from "@/lib/actions/bank.actions";
import { createTransaction } from "@/lib/actions/transaction.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";

type RedeemBody = {
  amount?: string;
  bankId?: string;
  source?: string;
};

const getErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    return getErrorResponse("Authentication required.", 401);
  }

  const body = (await request.json()) as RedeemBody;
  const amount = body.amount?.trim();
  const bankId = body.bankId?.trim();
  const source = body.source?.trim();

  if (!amount || !bankId || !source || !isAddress(source)) {
    return getErrorResponse("Amount, bank account, and source wallet are required.");
  }

  const amountNumber = Number(amount);

  if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
    return getErrorResponse("Amount must be greater than zero.");
  }

  const accounts = (await getAccounts({
    userId: loggedIn.$id,
    authUserId: loggedIn.userId,
  })) as { data: Account[] } | undefined;
  const destinationAccount = accounts?.data.find(
    (account) => account.appwriteItemId === bankId,
  );

  if (!destinationAccount) {
    return getErrorResponse("Selected app funding account was not found.", 404);
  }

  const transaction = await createTransaction({
    name: "NovaUSD sale",
    amount,
    senderId: source,
    senderBankId: "novapay-onchain",
    receiverId: loggedIn.$id,
    receiverBankId: bankId,
    email: loggedIn.email,
  });

  if (!transaction) {
    return getErrorResponse(
      "NovaUSD sale executed, but the app ledger could not save the credit transaction.",
      500,
    );
  }

  return NextResponse.json({
    amount,
    bankId,
    source,
  });
}
