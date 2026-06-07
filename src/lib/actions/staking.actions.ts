import { ID, Query } from "node-appwrite";

import { createAdminClient } from "../appwrite";
import {
  ZERO,
  accrueStakingInterest,
  buildStakingSnapshot,
  getTierForPrincipal,
  parseStakingBigInt,
  parseStakingTimestamp,
} from "../staking.utils";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_STAKING_POSITION_COLLECTION_ID: STAKING_POSITION_COLLECTION_ID,
} = process.env;

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

const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const getDefaultStakingPosition = (
  smartAccount: string,
  configured = Boolean(DATABASE_ID && STAKING_POSITION_COLLECTION_ID),
) => {
  const now = getCurrentTimestamp();
  const tier = getTierForPrincipal(ZERO);

  return buildStakingSnapshot(
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
  const principal = parseStakingBigInt(document.principal);
  const tier = getTierForPrincipal(principal);
  const aprBps = parseStakingBigInt(document.aprBps) || tier.aprBps;
  const lastAccruedAt = parseStakingTimestamp(document.lastAccruedAt, now);
  const accrued = accrueStakingInterest(
    principal,
    parseStakingBigInt(document.accrued),
    aprBps,
    lastAccruedAt,
    now,
  );

  return buildStakingSnapshot(
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
  const depositAmount = parseStakingBigInt(amount);

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
  const principal = parseStakingBigInt(currentSnapshot.principal) + depositAmount;
  const accrued = parseStakingBigInt(currentSnapshot.accruedNow);
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
  const redeemedAssets = parseStakingBigInt(assets);

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
  const principal = parseStakingBigInt(currentSnapshot.principal);
  const accrued = parseStakingBigInt(currentSnapshot.accruedNow);
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
