import { NextResponse } from "next/server";
import { isAddress } from "viem";

import { getUserStakingPosition } from "@/lib/actions/staking.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";

const getErrorResponse = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    return getErrorResponse("Authentication required.", 401);
  }

  const account = new URL(request.url).searchParams.get("account")?.trim();

  if (!account || !isAddress(account)) {
    return getErrorResponse("Valid staking account address is required.");
  }

  const position = await getUserStakingPosition({
    smartAccount: account,
    userId: loggedIn.$id,
  });

  return NextResponse.json({ position });
}
