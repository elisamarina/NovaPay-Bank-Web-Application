import { ID, Query } from "node-appwrite";

import { createAdminClient } from "../appwrite";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_STAKING_POSITION_COLLECTION_ID: STAKING_POSITION_COLLECTION_ID,
} = process.env;

const ZERO = BigInt(0);
const BPS = BigInt(10_000);
const TOKEN_UNIT = BigInt(10) ** BigInt(18);
const YEAR_IN_SECONDS = BigInt(365 * 24 * 60 * 60);

type StakingPositionDocument = {
  $id: string;
  accrued?: string;
  aprBps?: string;
  principal?: string;
  smartAccount?: string;
  status?: string;
  tier?: string;
  lastAccruedAt?: string;
  userId?: string;
};

type StakingPositionInput = {
  smartAccount: string;
  userId: string;
};

type RecordStakeDepositInput = StakingPositionInput & {
  amount: string;
};

type RecordStakeRedeemInput = StakingPositionInput & {
  assets: string;
};

const STAKING_TIERS = [
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
];

const REQUIRED_ATTRIBUTES = [
  "userId",
  "smartAccount",
  "principal",
  "accrued",
  "aprBps",
  "tier",
  "lastAccruedAt",
  "status",
];

const parseBigInt = (value: string | undefined) => {
  try {
    return BigInt(value ?? "0");
  } catch {
    return ZERO;
  }
};

const parseTimestamp = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);

  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
};

const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

const getTierForPrincipal = (principal: bigint) =>
  STAKING_TIERS.reduce((currentTier, tier) =>
    principal >= tier.minPrincipal ? tier : currentTier,
  );

const accrueInterest = (
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

const buildSnapshot = (
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

export const getDefaultStakingPosition = (
  smartAccount: string,
  configured = Boolean(DATABASE_ID && STAKING_POSITION_COLLECTION_ID),
) => {
  const now = getCurrentTimestamp();
  const tier = getTierForPrincipal(ZERO);

  return buildSnapshot(
    smartAccount,
    ZERO,
    ZERO,
    tier.aprBps,
    tier.id,
    now,
    configured,
  );
};

const assertConfigured = () => {
  if (!DATABASE_ID || !STAKING_POSITION_COLLECTION_ID) {
    throw new Error("Staking position storage is not configured.");
  }
};

const assertCollectionSchema = async (
  database: Awaited<ReturnType<typeof createAdminClient>>["database"],
) => {
  assertConfigured();

  const collection = await database.getCollection(
    DATABASE_ID!,
    STAKING_POSITION_COLLECTION_ID!,
  );
  const attributeKeys = collection.attributes.map((attribute) => attribute.key);
  const hasRequiredSchema = REQUIRED_ATTRIBUTES.every((attribute) =>
    attributeKeys.includes(attribute),
  );

  if (!hasRequiredSchema) {
    throw new Error("Staking position collection schema is incomplete.");
  }
};

const findPositionDocument = async (
  database: Awaited<ReturnType<typeof createAdminClient>>["database"],
  { smartAccount, userId }: StakingPositionInput,
) => {
  const result = await database.listDocuments(
    DATABASE_ID!,
    STAKING_POSITION_COLLECTION_ID!,
    [
      Query.equal("userId", [userId]),
      Query.equal("smartAccount", [smartAccount.toLowerCase()]),
    ],
  );

  return result.documents[0] as StakingPositionDocument | undefined;
};

const snapshotFromDocument = (
  document: StakingPositionDocument,
  smartAccount: string,
  configured = true,
) => {
  const now = getCurrentTimestamp();
  const principal = parseBigInt(document.principal);
  const tier = getTierForPrincipal(principal);
  const aprBps = parseBigInt(document.aprBps) || tier.aprBps;
  const lastAccruedAt = parseTimestamp(document.lastAccruedAt, now);
  const accrued = accrueInterest(
    principal,
    parseBigInt(document.accrued),
    aprBps,
    lastAccruedAt,
    now,
  );

  return buildSnapshot(
    smartAccount,
    principal,
    accrued,
    aprBps,
    document.tier ?? tier.id,
    now,
    configured,
  );
};

export const getUserStakingPosition = async ({
  smartAccount,
  userId,
}: StakingPositionInput) => {
  if (!DATABASE_ID || !STAKING_POSITION_COLLECTION_ID) {
    return getDefaultStakingPosition(smartAccount, false);
  }

  try {
    const { database } = await createAdminClient();

    await assertCollectionSchema(database);

    const document = await findPositionDocument(database, {
      smartAccount,
      userId,
    });

    if (!document) {
      return getDefaultStakingPosition(smartAccount, true);
    }

    return snapshotFromDocument(document, smartAccount, true);
  } catch (error) {
    console.error("An error occurred while getting staking position:", error);
    return getDefaultStakingPosition(smartAccount, false);
  }
};

export const recordStakingDeposit = async ({
  amount,
  smartAccount,
  userId,
}: RecordStakeDepositInput) => {
  const depositAmount = parseBigInt(amount);

  if (depositAmount <= ZERO) {
    throw new Error("Deposit amount must be greater than zero.");
  }

  const { database } = await createAdminClient();

  await assertCollectionSchema(database);

  const existingDocument = await findPositionDocument(database, {
    smartAccount,
    userId,
  });
  const currentSnapshot = existingDocument
    ? snapshotFromDocument(existingDocument, smartAccount, true)
    : getDefaultStakingPosition(smartAccount, true);
  const principal = parseBigInt(currentSnapshot.principal) + depositAmount;
  const accrued = parseBigInt(currentSnapshot.accruedNow);
  const tier = getTierForPrincipal(principal);
  const now = getCurrentTimestamp();
  const payload = {
    accrued: accrued.toString(),
    aprBps: tier.aprBps.toString(),
    lastAccruedAt: now.toString(),
    principal: principal.toString(),
    smartAccount: smartAccount.toLowerCase(),
    status: principal === ZERO ? "closed" : "active",
    tier: tier.id,
    userId,
  };

  const document = existingDocument
    ? await database.updateDocument(
        DATABASE_ID!,
        STAKING_POSITION_COLLECTION_ID!,
        existingDocument.$id,
        payload,
      )
    : await database.createDocument(
        DATABASE_ID!,
        STAKING_POSITION_COLLECTION_ID!,
        ID.unique(),
        payload,
      );

  return snapshotFromDocument(document as StakingPositionDocument, smartAccount, true);
};

export const recordStakingRedeem = async ({
  assets,
  smartAccount,
  userId,
}: RecordStakeRedeemInput) => {
  const redeemedAssets = parseBigInt(assets);

  if (redeemedAssets <= ZERO) {
    throw new Error("Redeem assets must be greater than zero.");
  }

  const { database } = await createAdminClient();

  await assertCollectionSchema(database);

  const existingDocument = await findPositionDocument(database, {
    smartAccount,
    userId,
  });

  if (!existingDocument) {
    return getDefaultStakingPosition(smartAccount, true);
  }

  const currentSnapshot = snapshotFromDocument(existingDocument, smartAccount, true);
  const principal = parseBigInt(currentSnapshot.principal);
  const accrued = parseBigInt(currentSnapshot.accruedNow);
  const nextPrincipal =
    redeemedAssets >= principal ? ZERO : principal - redeemedAssets;
  const nextAccrued =
    principal === ZERO || nextPrincipal === ZERO
      ? ZERO
      : (accrued * nextPrincipal) / principal;
  const tier = getTierForPrincipal(nextPrincipal);
  const now = getCurrentTimestamp();
  const payload = {
    accrued: nextAccrued.toString(),
    aprBps: tier.aprBps.toString(),
    lastAccruedAt: now.toString(),
    principal: nextPrincipal.toString(),
    smartAccount: smartAccount.toLowerCase(),
    status: nextPrincipal === ZERO ? "closed" : "active",
    tier: tier.id,
    userId,
  };
  const document = await database.updateDocument(
    DATABASE_ID!,
    STAKING_POSITION_COLLECTION_ID!,
    existingDocument.$id,
    payload,
  );

  return snapshotFromDocument(document as StakingPositionDocument, smartAccount, true);
};
