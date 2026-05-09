import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Ban } from "lucide-react";
import BankCard from "./BankCard";

const RightSidebar = ({ user, transactions, banks }: RightSidebarProps) => {
  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">
              {user.firstName[0]}
            </span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">
              {user.firstName} {user.lastName}
            </h1>
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
              Adaugă cont bancar
            </h2>
          </Link>
        </div>
        {banks?.length > 0 && (
          <div className="relative h-[190px] w-full overflow-hidden">
            <div className="absolute left-0 top-0 z-10 w-[90%]">
              <BankCard
                key={banks[0]?.id}
                account={banks[0]}
                userName={`${user.firstName} ${user.lastName}`}
                showBalance={false}
              />
            </div>
            {banks[1] && (
              <div className="absolute right-0 top-6 z-0 w-[90%]">
                <BankCard
                  key={banks[1]?.id}
                  account={banks[1]}
                  userName={`${user.firstName} ${user.lastName}`}
                  showBalance={false}
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
