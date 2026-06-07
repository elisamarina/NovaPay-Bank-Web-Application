export const ZERO = BigInt(0);
export const BPS = BigInt(10_000);
export const TOKEN_UNIT = BigInt(10) ** BigInt(18);
export const YEAR_IN_SECONDS = BigInt(365 * 24 * 60 * 60);

export const STAKING_TIERS = [
  {
    id: "starter",
    label: "Starter",
    minPrincipal: ZERO,
    aprBps: BigInt(400),
  },
  {
    id: "growth",
    label: "Growth",
    minPrincipal: BigInt(100) * TOKEN_UNIT,
    aprBps: BigInt(700),
  },
  {
    id: "prime",
    label: "Prime",
    minPrincipal: BigInt(1_000) * TOKEN_UNIT,
    aprBps: BigInt(1_000),
  },
] as const;

export const parseStakingBigInt = (value: string | undefined) => {
  try {
    return BigInt(value ?? "0");
  } catch {
    return ZERO;
  }
};

export const parseStakingTimestamp = (
  value: string | undefined,
  fallback: number,
) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

export const getTierForPrincipal = (principal: bigint) =>
  STAKING_TIERS.reduce((currentTier, tier) =>
    principal >= tier.minPrincipal ? tier : currentTier,
  );

export const accrueStakingInterest = (
  principal: bigint,
  accrued: bigint,
  aprBps: bigint,
  lastAccruedAt: number,
  now: number,
) => {
  const elapsedSeconds = Math.max(now - lastAccruedAt, 0);

  if (principal === ZERO || aprBps === ZERO || elapsedSeconds === 0) {
    return accrued;
  }

  return (
    accrued +
    (principal * aprBps * BigInt(elapsedSeconds)) / (BPS * YEAR_IN_SECONDS)
  );
};

export const buildStakingSnapshot = (
  smartAccount: string,
  principal: bigint,
  accrued: bigint,
  aprBps: bigint,
  tierId: string,
  lastAccruedAt: number,
  configured: boolean,
) => {
  const tier =
    STAKING_TIERS.find((availableTier) => availableTier.id === tierId) ??
    getTierForPrincipal(principal);

  return {
    accrued: accrued.toString(),
    accruedNow: accrued.toString(),
    aprBps: aprBps.toString(),
    configured,
    lastAccruedAt: lastAccruedAt.toString(),
    positionValue: (principal + accrued).toString(),
    principal: principal.toString(),
    smartAccount,
    tier: tier.id,
    tierLabel: tier.label,
    updatedAt: lastAccruedAt,
  };
};
