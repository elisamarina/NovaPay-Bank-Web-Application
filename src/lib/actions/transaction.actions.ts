"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient } from "../appwrite";
import { parseStringify } from "../utils";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_TRANSACTION_COLLECTION_ID: TRANSACTION_COLLECTION_ID,
} = process.env;

export const createTransaction = async (
  transaction: CreateTransactionProps,
) => {
  if (!DATABASE_ID || !TRANSACTION_COLLECTION_ID) {
    return null;
  }

  try {
    const { database } = await createAdminClient();
    const transactionCollection = await database.getCollection(
      DATABASE_ID,
      TRANSACTION_COLLECTION_ID,
    );
    const attributeKeys = transactionCollection.attributes.map(
      (attribute) => attribute.key,
    );
    const requiredKeys = [
      "name",
      "amount",
      "senderId",
      "senderBankId",
      "receiverId",
      "receiverBankId",
      "email",
      "channel",
      "category",
    ];
    const hasRequiredSchema = requiredKeys.every((key) =>
      attributeKeys.includes(key),
    );

    if (!hasRequiredSchema) {
      return null;
    }

    const newTransaction = await database.createDocument(
      DATABASE_ID,
      TRANSACTION_COLLECTION_ID,
      ID.unique(),
      {
        channel: "online",
        category: "Transfer",
        ...transaction,
      },
    );

    return parseStringify(newTransaction);
  } catch (error) {
    console.error("An error occurred while creating transaction:", error);
    return null;
  }
};

export const getTransactionsByBankId = async ({
  bankId,
}: getTransactionsByBankIdProps) => {
  void bankId;

  if (!DATABASE_ID || !TRANSACTION_COLLECTION_ID) {
    return parseStringify({ documents: [] });
  }

  try {
    const { database } = await createAdminClient();
    const transactionCollection = await database.getCollection(
      DATABASE_ID,
      TRANSACTION_COLLECTION_ID,
    );
    const hasSenderBankId = transactionCollection.attributes.some(
      (attribute) => attribute.key === "senderBankId",
    );

    if (!hasSenderBankId) {
      return parseStringify({ documents: [] });
    }

    return await database.listDocuments(
      DATABASE_ID,
      TRANSACTION_COLLECTION_ID,
      [Query.equal("senderBankId", [bankId])],
    );
  } catch (error) {
    console.error("An error occurred while getting transactions:", error);
    return parseStringify({ documents: [] });
  }
};
