import React from "react";
import BankCard from "./BankCard";
import { countTransactionCategories } from "@/lib/utils";
import Category from "./Category";
import PlaidLink from "./PlaidLink";

const placeholderBanks: Account[] = [
  {
    id: "placeholder-checking",
    availableBalance: 110,
    currentBalance: 110,
    officialName: "NovaPay Demo Checking",
    mask: "1234",
    institutionId: "placeholder-bank",
    name: "Plaid Checking",
    type: "depository",
    subtype: "checking",
    appwriteItemId: "placeholder-checking",
    sharableId: "placeholder-checking",
  },
  {
    id: "placeholder-saving",
    availableBalance: 210,
    currentBalance: 210,
    officialName: "NovaPay Demo Saving",
    mask: "5678",
    institutionId: "placeholder-bank",
    name: "Plaid Saving",
    type: "depository",
    subtype: "savings",
    appwriteItemId: "placeholder-saving",
    sharableId: "placeholder-saving",
  },
];

const RightSidebar = ({ user, transactions, banks }: RightSidebarProps) => {
  const categories: CategoryCount[] = countTransactionCategories(transactions);
  const displayedBanks = banks?.length > 0 ? banks : placeholderBanks;
  const hasRealBanks = banks?.length > 0;
  const displayName =
    user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">
              {initials || "U"}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{displayName || "User"}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full justify-between">
          <h2 className="header-2">My Banks</h2>
          <PlaidLink user={user} variant="ghost" label="Add Bank" />
        </div>

        <div className="relative flex flex-1 flex-col items-center justify-center gap-5">
          <div className="relative z-10">
            <BankCard
              key={displayedBanks[0].appwriteItemId}
              account={displayedBanks[0]}
              userName={displayName || "User"}
              showBalance={!hasRealBanks}
            />
          </div>
          {displayedBanks[1] && (
            <div className="absolute right-0 top-8 z-0 w-[90%]">
              <BankCard
                key={displayedBanks[1].appwriteItemId}
                account={displayedBanks[1]}
                userName={displayName || "User"}
                showBalance={false}
              />
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-1 flex-col gap-6">
          <h2 className="header-2">Top categories</h2>

          <div className="space-y-5">
            {categories.map((category) => (
              <Category key={category.name} category={category} />
            ))}
          </div>
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar;
