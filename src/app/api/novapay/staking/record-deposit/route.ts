import { NextResponse } from "next/server";
import { isAddress } from "viem";

import { recordStakingDeposit } from "@/lib/actions/staking.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";

type RecordDepositBody = {
  amount?: string;
  smartAccount?: string;
};

const getErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function POST(request: Request) {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    return getErrorResponse("Authentication required.", 401);
  }

  const body = (await request.json()) as RecordDepositBody;
  const amount = body.amount?.trim();
  const smartAccount = body.smartAccount?.trim();

  if (!amount || !smartAccount || !isAddress(smartAccount)) {
    return getErrorResponse("Amount and staking account are required.");
  }

  try {
    const position = await recordStakingDeposit({
      amount,
      smartAccount,
      userId: loggedIn.$id,
    });

    return NextResponse.json({ position });
  } catch (error) {
    return getErrorResponse(
      error instanceof Error ? error.message : "Could not record staking deposit.",
      500,
    );
  }
}
