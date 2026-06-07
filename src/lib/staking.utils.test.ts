import { describe, expect, it } from "vitest";

import {
  TOKEN_UNIT,
  YEAR_IN_SECONDS,
  accrueStakingInterest,
  buildStakingSnapshot,
  getTierForPrincipal,
  parseStakingBigInt,
  parseStakingTimestamp,
} from "./staking.utils";

describe("staking utils", () => {
  it("selects the expected staking tier from principal", () => {
    expect(getTierForPrincipal(BigInt(0)).id).toBe("starter");
    expect(getTierForPrincipal(BigInt(99) * TOKEN_UNIT).id).toBe("starter");
    expect(getTierForPrincipal(BigInt(100) * TOKEN_UNIT).id).toBe("growth");
    expect(getTierForPrincipal(BigInt(999) * TOKEN_UNIT).id).toBe("growth");
    expect(getTierForPrincipal(BigInt(1_000) * TOKEN_UNIT).id).toBe("prime");
  });

  it("accrues simple APR interest linearly", () => {
    const principal = BigInt(100) * TOKEN_UNIT;
    const oneYearReward = accrueStakingInterest(
      principal,
      BigInt(0),
      BigInt(700),
      0,
      Number(YEAR_IN_SECONDS),
    );
    const halfYearReward = accrueStakingInterest(
      principal,
      BigInt(0),
      BigInt(700),
      0,
      Number(YEAR_IN_SECONDS / BigInt(2)),
    );

    expect(oneYearReward).toBe(BigInt(7) * TOKEN_UNIT);
    expect(halfYearReward).toBe(BigInt("3500000000000000000"));
  });

  it("does not accrue when time moves backwards or principal is zero", () => {
    expect(
      accrueStakingInterest(BigInt(100) * TOKEN_UNIT, BigInt(5), BigInt(700), 10, 9),
    ).toBe(BigInt(5));
    expect(accrueStakingInterest(BigInt(0), BigInt(5), BigInt(700), 0, 100)).toBe(
      BigInt(5),
    );
  });

  it("builds a consistent frontend snapshot", () => {
    const snapshot = buildStakingSnapshot(
      "0xabc",
      BigInt(100) * TOKEN_UNIT,
      BigInt(7) * TOKEN_UNIT,
      BigInt(700),
      "growth",
      1000,
      true,
    );

    expect(snapshot).toMatchObject({
      accrued: "7000000000000000000",
      aprBps: "700",
      configured: true,
      lastAccruedAt: "1000",
      positionValue: "107000000000000000000",
      principal: "100000000000000000000",
      smartAccount: "0xabc",
      tier: "growth",
      tierLabel: "Growth",
      updatedAt: 1000,
    });
  });

  it("parses invalid persisted values conservatively", () => {
    expect(parseStakingBigInt("not-a-number")).toBe(BigInt(0));
    expect(parseStakingBigInt(undefined)).toBe(BigInt(0));
    expect(parseStakingTimestamp("12.9", 1)).toBe(12);
    expect(parseStakingTimestamp("-1", 123)).toBe(123);
  });
});
