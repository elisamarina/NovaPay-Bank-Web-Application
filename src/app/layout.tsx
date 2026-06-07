import type { Metadata } from "next";
import Web3Provider from "@/components/Web3Provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "NovaPay",
  description: "A modern finance dashboard for connected banking and payments.",
  icons: {
    icon: "/icons/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Web3Provider>{children}</Web3Provider>
      </body>
    </html>
  );
}
