import React from "react";
import HeaderBox from "@/components/HeaderBox";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import RightSidebar from "@/components/RightSidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import { redirect } from "next/navigation";

const Home = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    redirect("/sign-in");
  }

  const accounts: Account[] = [
    {
      id: "mock-checking",
      availableBalance: 123.5,
      currentBalance: 123.5,
      officialName: "Delta Checking",
      mask: "1234",
      institutionId: "mock-bank",
      name: "Delta Checking",
      type: "depository",
      subtype: "checking",
      appwriteItemId: "mock-checking",
      sharableId: "mock-checking",
    },
    {
      id: "mock-savings",
      availableBalance: 456.78,
      currentBalance: 456.78,
      officialName: "Delta Savings",
      mask: "5678",
      institutionId: "mock-bank",
      name: "Delta Savings",
      type: "depository",
      subtype: "savings",
      appwriteItemId: "mock-savings",
      sharableId: "mock-savings",
    },
  ];

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            user={loggedIn?.name || "Guest"}
            subtext="Access your account details and manage your finances."
          />
          <TotalBalanceBox
            accounts={accounts}
            totalBanks={accounts.length}
            totalCurrentBalance={1250.35}
          />
        </header>
      </div>
      <RightSidebar
        user={loggedIn}
        transactions={[]}
        banks={accounts}
      />
    </section>
  );
};

export default Home;
