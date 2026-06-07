import StakingDashboard from "@/components/staking/StakingDashboard";
import { getAccounts } from "@/lib/actions/bank.actions";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

type AccountsResult = {
  data: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
};

const Staking = async () => {
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const accounts = (await getAccounts({
    userId: loggedIn.$id,
    authUserId: loggedIn.userId,
  })) as AccountsResult | undefined;

  return <StakingDashboard accounts={accounts?.data ?? []} />;
};

export default Staking;
