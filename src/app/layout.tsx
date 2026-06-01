import type { Metadata } from "next";
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
      <body className="antialiased">{children}</body>
    </html>
  );
}
