import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "contracts/**",
        "node_modules/**",
        "src/**/*.d.ts",
      ],
      reporter: ["text", "lcov"],
    },
    include: ["src/**/*.test.ts"],
  },
});
