"use client";

import { createConfig, http, injected } from "wagmi";

import { baseSepolia } from "./chains";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [
    injected({
      target: "metaMask",
    }),
    injected(),
  ],
  ssr: true,
  transports: {
    [baseSepolia.id]: http(baseSepolia.rpcUrls.default.http[0]),
  },
});
