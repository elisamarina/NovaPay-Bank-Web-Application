import React from "react";
import HeaderBox from "@/components/HeaderBox";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import RightSidebar from "@/components/RightSidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";
import { getAccount, getAccounts } from "@/lib/actions/bank.actions";
import RecentTransactions from "@/components/RecentTransactions";
import { withDemoTransactions } from "@/constants/demoTransactions";

type AccountsResult = {
  data: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
};

type AccountResult = {
  transactions: Transaction[];
};

const Dashboard = async ({ searchParams: { id, page } }: SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn = (await getLoggedInUser()) as User | null;

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const accounts = (await getAccounts({
    userId: loggedIn.$id,
    authUserId: loggedIn.userId,
  })) as AccountsResult | undefined;

  if (!accounts) return;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;
  const account = appwriteItemId
    ? ((await getAccount({ appwriteItemId })) as AccountResult | undefined)
    : undefined;
  const transactions = withDemoTransactions(account?.transactions || []);

  console.log({
    accountsData,
    account,
  });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.firstName || "Guest"}
            subtext="Access your account details and manage your finances."
          />
          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>
        <RecentTransactions
          accounts={accountsData}
          transactions={transactions}
          appwriteItemId={appwriteItemId || ""}
          page={currentPage}
        />
      </div>
      <RightSidebar
        user={loggedIn}
        transactions={transactions}
        banks={accountsData?.slice(0, 2)}
      />
    </section>
  );
};

export default Dashboard;
