"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { sidebarLinks } from "../../constants";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Footer from "./Footer";
import ThemeToggle from "./ThemeToggle";
const MobileBar = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  return (
    <section className="w-full max-w-[256px]">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            alt="menu"
            width={30}
            height={30}
            className="cursor-pointer"
          />
        </SheetTrigger>
        <SheetContent side="left" className="border-none bg-white dark:bg-slate-950">
          <SheetHeader className="sr-only">
            <SheetTitle>Mobile navigation</SheetTitle>
            <SheetDescription>Main application navigation menu</SheetDescription>
          </SheetHeader>
          <Link
            href="/dashboard"
            className="
    cursor-pointer flex
    items-center gap-1 px-4 "
          >
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="NovaPay Logo"
            />

            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1 dark:text-slate-50">
              NovaPay
            </h1>
          </Link>
          <div className="mobilenav-sheet">
            <SheetClose asChild>
              <nav className="flex h-full flex-col gap-6 pt-16 text-white">
                {sidebarLinks.map((item) => {
                  const isActive =
                    pathname === item.route ||
                    pathname.startsWith(`${item.route}/`);
                  return (
                    <SheetClose asChild key={item.route}>
                      <Link
                        href={item.route}
                        key={item.label}
                        className={cn("mobilenav-sheet_close w-full", {
                          "bg-bank-gradient": isActive,
                        })}
                      >
                        <Image
                          src={item.imgURL}
                          alt={item.label}
                          width={20}
                          height={20}
                          className={cn({
                            "brightness-[3] invert-0": isActive,
                          })}
                        />

                        <p
                          className={cn("text-16 font-semibold text-black-2 dark:text-slate-300", {
                            "text-white": isActive,
                          })}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SheetClose>
                  );
                })}
                <ThemeToggle />
              </nav>
            </SheetClose>
            <Footer user={user} type="mobile" />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileBar;
