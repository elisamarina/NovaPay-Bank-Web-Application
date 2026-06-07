#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Client, Databases } from "node-appwrite";

const COLLECTION_ID = "staking_positions";
const COLLECTION_NAME = "NovaPay Staking Positions";
const INDEX_KEY = "user_smart_account";

const ENV_FILES = [".env", ".env.local"];
const REQUIRED_ENV = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_SECRET",
];
const ATTRIBUTES = [
  ["userId", 128],
  ["smartAccount", 64],
  ["principal", 80],
  ["accrued", 80],
  ["aprBps", 16],
  ["tier", 32],
  ["lastAccruedAt", 16],
  ["status", 16],
];

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));

const loadEnvFile = (fileName) => {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) return;

  const contents = readFileSync(filePath, "utf8");

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value.replace(/^["']|["']$/g, "");
    }
  }
};

const getEnvTargetPath = () => {
  const localEnvPath = resolve(process.cwd(), ".env.local");

  if (existsSync(localEnvPath)) return localEnvPath;

  return resolve(process.cwd(), ".env");
};

const upsertEnvValue = (key, value) => {
  const targetPath = getEnvTargetPath();
  const currentContents = existsSync(targetPath)
    ? readFileSync(targetPath, "utf8")
    : "";
  const nextLine = `${key}=${value}`;
  const keyPattern = new RegExp(`^${key}=.*$`, "m");
  const nextContents = keyPattern.test(currentContents)
    ? currentContents.replace(keyPattern, nextLine)
    : `${currentContents.replace(/\s*$/, "")}\n${nextLine}\n`;

  writeFileSync(targetPath, nextContents);

  return targetPath;
};

const isMissingResourceError = (error) =>
  error && typeof error === "object" && "code" in error && error.code === 404;

const ensureCollection = async (database) => {
  try {
    await database.getCollection(
      process.env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
    );
    console.log(`Collection already exists: ${COLLECTION_ID}`);
    return;
  } catch (error) {
    if (!isMissingResourceError(error)) throw error;
  }

  await database.createCollection(
    process.env.APPWRITE_DATABASE_ID,
    COLLECTION_ID,
    COLLECTION_NAME,
  );
  console.log(`Created collection: ${COLLECTION_ID}`);
};

const ensureStringAttribute = async (database, key, size) => {
  const collection = await database.getCollection(
    process.env.APPWRITE_DATABASE_ID,
    COLLECTION_ID,
  );
  const existingAttribute = collection.attributes.find(
    (attribute) => attribute.key === key,
  );

  if (existingAttribute) {
    console.log(`Attribute already exists: ${key}`);
    return;
  }

  await database.createStringAttribute(
    process.env.APPWRITE_DATABASE_ID,
    COLLECTION_ID,
    key,
    size,
    true,
  );
  console.log(`Created attribute: ${key}`);
};

const waitForAttributes = async (database) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const collection = await database.getCollection(
      process.env.APPWRITE_DATABASE_ID,
      COLLECTION_ID,
    );
    const statuses = ATTRIBUTES.map(([key]) =>
      collection.attributes.find((attribute) => attribute.key === key),
    );
    const failedAttribute = statuses.find(
      (attribute) => attribute?.status === "failed",
    );

    if (failedAttribute) {
      throw new Error(`Attribute failed to build: ${failedAttribute.key}`);
    }

    if (statuses.every((attribute) => attribute?.status === "available")) {
      return;
    }

    await sleep(1_000);
  }

  throw new Error("Timed out waiting for staking position attributes.");
};

const ensureIndex = async (database) => {
  const collection = await database.getCollection(
    process.env.APPWRITE_DATABASE_ID,
    COLLECTION_ID,
  );
  const existingIndex = collection.indexes.find((index) => index.key === INDEX_KEY);

  if (existingIndex) {
    console.log(`Index already exists: ${INDEX_KEY}`);
    return;
  }

  await database.createIndex(
    process.env.APPWRITE_DATABASE_ID,
    COLLECTION_ID,
    INDEX_KEY,
    "key",
    ["userId", "smartAccount"],
  );
  console.log(`Created index: ${INDEX_KEY}`);
};

for (const fileName of ENV_FILES) {
  loadEnvFile(fileName);
}

const missingEnv = REQUIRED_ENV.filter((key) => !process.env[key]);

if (missingEnv.length > 0) {
  console.error(`Missing required env vars: ${missingEnv.join(", ")}`);
  process.exit(1);
}

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT)
  .setKey(process.env.APPWRITE_SECRET);
const database = new Databases(client);

await ensureCollection(database);

for (const [key, size] of ATTRIBUTES) {
  await ensureStringAttribute(database, key, size);
}

await waitForAttributes(database);
await ensureIndex(database);

const envPath = upsertEnvValue(
  "APPWRITE_STAKING_POSITION_COLLECTION_ID",
  COLLECTION_ID,
);

console.log("Staking position storage is ready.");
console.log(`APPWRITE_STAKING_POSITION_COLLECTION_ID=${COLLECTION_ID}`);
console.log(`Updated env file: ${envPath}`);
