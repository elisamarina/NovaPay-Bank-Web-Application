import React from "react";
import Link from "next/link";
import Image from "next/image";
import BankCard from "./BankCard";

const RightSidebar = ({ user, banks }: RightSidebarProps) => {
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
              {initials}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-email">{user.email}</p>
          </div>
        </div>
      </section>
      <section className="banks">
        <div className="flex w-full justify-between">
          <h2 className="header-2">Conturile mele bancare</h2>
          <Link href="/" className="flex gap-2">
            <Image src="/icons/plus.svg" alt="plus" width={20} height={20} />

            <h2 className="text-14 font-semibold text-blue-600">
              Adaug&#259; cont bancar
            </h2>
          </Link>
        </div>
        {banks?.length > 0 && (
          <div className="relative h-[235px] w-full">
            <div className="absolute left-0 top-0 z-10 w-[90%]">
              <BankCard
                key={banks[0]?.id}
                account={banks[0]}
                userName={displayName}
              />
            </div>
            {banks[1] && (
              <div className="absolute right-0 top-8 z-0 w-[90%]">
                <BankCard
                  key={banks[1]?.id}
                  account={banks[1]}
                  userName={displayName}
                />
              </div>
            )}
          </div>
        )}
      </section>
    </aside>
  );
};

export default RightSidebar;
