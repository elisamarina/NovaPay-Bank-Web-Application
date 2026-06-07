import { describe, expect, it } from "vitest";

import {
  NOVAUSD_DECIMALS,
  SNOVAUSD_DECIMALS,
  compactAddress,
  formatBps,
  formatScaledAmount,
  formatTokenAmount,
  parseTokenAmount,
} from "./format";

describe("web3 format helpers", () => {
  it("parses decimal token inputs into scaled bigint values", () => {
    expect(parseTokenAmount("10", NOVAUSD_DECIMALS)).toBe(
      BigInt("10000000000000000000"),
    );
    expect(parseTokenAmount("0.000000000000000001", NOVAUSD_DECIMALS)).toBe(
      BigInt(1),
    );
    expect(parseTokenAmount("1.23456789", 6)).toBe(BigInt(1_234_567));
  });

  it("rejects invalid token inputs", () => {
    expect(parseTokenAmount("", NOVAUSD_DECIMALS)).toBeNull();
    expect(parseTokenAmount(".", NOVAUSD_DECIMALS)).toBeNull();
    expect(parseTokenAmount("1.2.3", NOVAUSD_DECIMALS)).toBeNull();
    expect(parseTokenAmount("-1", NOVAUSD_DECIMALS)).toBeNull();
  });

  it("formats scaled token amounts with grouping and trimmed fractions", () => {
    expect(formatTokenAmount(BigInt("1234500000000000000000"), 18, 4)).toBe(
      "1,234.5",
    );
    expect(formatTokenAmount(BigInt("1234567890000000000000"), 18, 6)).toBe(
      "1,234.56789",
    );
    expect(formatTokenAmount(BigInt(10) ** BigInt(SNOVAUSD_DECIMALS), 24)).toBe(
      "1",
    );
  });

  it("formats optional scaled values and basis points", () => {
    expect(formatScaledAmount(undefined, NOVAUSD_DECIMALS)).toBe("-");
    expect(formatScaledAmount(BigInt(1), undefined)).toBe("-");
    expect(formatBps(BigInt(700))).toBe("7%");
    expect(formatBps(undefined)).toBe("-");
  });

  it("compacts addresses for display", () => {
    expect(compactAddress("0x1234567890abcdef")).toBe("0x1234...cdef");
    expect(compactAddress(undefined)).toBe("-");
  });
});
