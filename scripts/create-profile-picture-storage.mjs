#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  Client,
  Databases,
  Permission,
  Role,
  Storage,
} from "node-appwrite";

const BUCKET_ID = "profile_pictures";
const BUCKET_NAME = "Profile Pictures";
const MAX_FILE_SIZE = 2 * 1024 * 1024;
const REQUIRED_ENV = [
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  "NEXT_PUBLIC_APPWRITE_PROJECT",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_USER_COLLECTION_ID",
  "APPWRITE_SECRET",
];
const ATTRIBUTES = [
  ["profileImageId", 128],
  ["profileImageUrl", 512],
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

const upsertEnvValue = (key, value) => {
  const targetPath = resolve(process.cwd(), ".env");
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

const ensureBucket = async (storage) => {
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`Bucket already exists: ${BUCKET_ID}`);
    return;
  } catch (error) {
    if (!isMissingResourceError(error)) throw error;
  }

  await storage.createBucket(
    BUCKET_ID,
    BUCKET_NAME,
    [Permission.read(Role.any())],
    false,
    true,
    MAX_FILE_SIZE,
    ["jpg", "jpeg", "png", "webp"],
  );
  console.log(`Created bucket: ${BUCKET_ID}`);
};

const ensureStringAttribute = async (database, key, size) => {
  const collection = await database.getCollection(
    process.env.APPWRITE_DATABASE_ID,
    process.env.APPWRITE_USER_COLLECTION_ID,
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
    process.env.APPWRITE_USER_COLLECTION_ID,
    key,
    size,
    false,
  );
  console.log(`Created attribute: ${key}`);
};

const waitForAttributes = async (database) => {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const collection = await database.getCollection(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_USER_COLLECTION_ID,
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

  throw new Error("Timed out waiting for profile image attributes.");
};

loadEnvFile(".env");
loadEnvFile(".env.local");

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
const storage = new Storage(client);

await ensureBucket(storage);

for (const [key, size] of ATTRIBUTES) {
  await ensureStringAttribute(database, key, size);
}

await waitForAttributes(database);

const envPath = upsertEnvValue("APPWRITE_PROFILE_BUCKET_ID", BUCKET_ID);

console.log("Profile picture storage is ready.");
console.log(`APPWRITE_PROFILE_BUCKET_ID=${BUCKET_ID}`);
console.log(`Updated env file: ${envPath}`);
