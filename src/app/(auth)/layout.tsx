import Image from "next/image";
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex min-h-screen w-full justify-between bg-white font-inter text-gray-900 dark:bg-slate-950 dark:text-slate-50">
      {children}
      <div className="auth-asset">
        <div>
          <Image
            src="/icons/auth-image.svg"
            alt="Authentication Asset"
            width={500}
            height={500}
          />
        </div>
      </div>
    </main>
  );
}
