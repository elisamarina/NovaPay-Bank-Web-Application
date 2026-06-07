import { logoutAccount } from "@/lib/actions/user.actions";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

const Footer = ({ user, type = "desktop" }: FooterProps) => {
  const router = useRouter();
  const avatarClassName =
    type === "mobile" ? "footer_name-mobile" : "footer_name";
  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`
    .trim()
    .toUpperCase();

  const handleLogOut = async () => {
    await logoutAccount();
    router.push("/sign-in");
  };

  return (
    <footer className="footer">
      <Link
        href="/profile"
        className="flex min-w-0 flex-1 items-center gap-2"
        aria-label="Open profile"
      >
        <div className={avatarClassName}>
          {user?.profileImageUrl ? (
            <Image
              src={user.profileImageUrl}
              fill
              unoptimized
              alt=""
              className="rounded-full object-cover"
            />
          ) : (
            <p className="text-xl font-bold text-gray-700 dark:text-slate-200">
              {initials || user?.firstName?.[0] || "U"}
            </p>
          )}
        </div>

        <div
          className={type === "mobile" ? "footer_email-mobile" : "footer_email"}
        >
          <h1 className="text-14 truncate text-gray-700 font-semibold dark:text-slate-200">
            {user?.firstName}
          </h1>
          <p className="text-14 truncate font-normal text-gray-600 dark:text-slate-400">
            {user?.email}
          </p>
        </div>
      </Link>

      <button
        type="button"
        className="footer_image"
        onClick={handleLogOut}
        aria-label="Log out"
      >
        <Image src="/icons/logout.svg" fill alt="" />
      </button>
    </footer>
  );
};

export default Footer;
