import MobileBar from "@/components/MobileBar";
import Sidebar from "@/components/Sidebar";
import { getLoggedInUser } from "@/lib/actions/user.actions";
import Image from "next/image";

import { redirect } from "next/navigation";
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) redirect("/sign-in");

  return (
    <main className="flex h-screen w-full overflow-hidden bg-gray-25 font-inter dark:bg-slate-950">
      <Sidebar user={loggedIn} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-gray-25 dark:bg-slate-950">
        <div className="root-layout">
          <Image src="/icons/logo.svg" alt="NovaPay logo" width={30} height={30} />
          <div>
            <MobileBar user={loggedIn} />
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden bg-gray-25 dark:bg-slate-950">
          {children}
        </div>
      </div>
    </main>
  );
}
