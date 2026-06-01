"use server";

import { ID, Query } from "node-appwrite";
import { createAdminClient, createSessionClient } from "../appwrite";
import { cookies } from "next/headers";
import { encryptId, extractCustomerIdFromUrl, parseStringify } from "../utils";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from "plaid";

import { plaidClient } from "@/lib/plaid";
import { revalidatePath } from "next/cache";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;
const plaidProducts = (process.env.PLAID_PRODUCTS || "auth,transactions")
  .split(",")
  .map((product) => product.trim())
  .filter(Boolean) as Products[];
const plaidCountryCodes = (process.env.PLAID_COUNTRY_CODES || "US")
  .split(",")
  .map((countryCode) => countryCode.trim())
  .filter(Boolean) as CountryCode[];

const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

type AppwriteUserDocument = Partial<User> & {
  ID?: string;
  FirstName?: string;
  LastName?: string;
};

const normalizeUser = (user: AppwriteUserDocument): User => ({
  $id: user.$id || "",
  name:
    user.name ||
    `${user.firstName || user.FirstName || ""} ${
      user.lastName || user.LastName || ""
    }`.trim(),
  email: user.email || "",
  userId: user.userId || user.ID || "",
  dwollaCustomerUrl: user.dwollaCustomerUrl || "",
  dwollaCustomerId: user.dwollaCustomerId || "",
  firstName: user.firstName || user.FirstName || "",
  lastName: user.lastName || user.LastName || "",
  address1: user.address1 || "",
  city: user.city || "",
  state: user.state || "",
  postalCode: user.postalCode || "",
  dateOfBirth: user.dateOfBirth || "",
  ssn: user.ssn || "",
});

export const getUserInfo = async ({
  userId,
}: getUserInfoProps): Promise<User | null> => {
  try {
    const { database } = await createAdminClient();

    const user = await database.listDocuments(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      [Query.equal("ID", [userId])],
    );

    return user.documents[0] ? normalizeUser(parseStringify(user.documents[0])) : null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const signIn = async ({
  email,
  password,
}: signInProps): Promise<SignInResult> => {
  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email: email.trim().toLowerCase(),
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, cookieOptions);

    const user = await getUserInfo({ userId: session.userId });

    return { success: true, user: user ?? undefined };
  } catch (error) {
    console.error("Error", error);
    return {
      success: false,
      error: "Invalid credentials. Please check the email and password.",
    };
  }
};

export const signUp = async ({
  password,
  ...userData
}: SignUpParams): Promise<SignUpResult> => {
  const { email, firstName, lastName } = userData;

  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(),
      email.trim().toLowerCase(),
      password,
      `${firstName} ${lastName}`,
    );

    if (!newUserAccount) throw new Error("Error creating user");

    const dwollaCustomerUrl = await createDwollaCustomer({
      ...userData,
      type: "personal",
    });

    if (!dwollaCustomerUrl) throw new Error("Error creating Dwolla customer");

    const dwollaCustomerId = extractCustomerIdFromUrl(dwollaCustomerUrl);

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        email: email.trim().toLowerCase(),
        ID: newUserAccount.$id,
        dwollaCustomerId,
        dwollaCustomerUrl,
        FirstName: firstName,
        LastName: lastName,
        address1: userData.address1,
        city: userData.city,
        postalCode: userData.postalCode,
        dateOfBirth: userData.dateOfBirth,
        ssn: userData.ssn,
        state: userData.state,
      },
    );

    const session = await account.createEmailPasswordSession({
      email: email.trim().toLowerCase(),
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, cookieOptions);

    return { user: normalizeUser(parseStringify(newUser)) };
  } catch (error) {
    console.error("Error", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "Sign up failed.",
    };
  }
};

export async function getLoggedInUser() {
  try {
    const { account } = await createSessionClient();
    const result = await account.get();

    const user = await getUserInfo({ userId: result.$id });

    return parseStringify(user);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();

    const cookieStore = await cookies();
    cookieStore.delete("appwrite-session");

    await account.deleteSession("current");
  } catch {
    return null;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: plaidProducts,
      language: "en",
      country_codes: plaidCountryCodes,
    };

    const response = await plaidClient.linkTokenCreate(tokenParams);

    return parseStringify({ linkToken: response.data.link_token });
  } catch (error) {
    console.log(error);
  }
};

export const createBankAccount = async ({
  userId,
  bankId,
  accountId,
  accessToken,
  fundingSourceUrl,
  sharableId,
}: createBankAccountProps) => {
  try {
    const { database } = await createAdminClient();

    const bankAccount = await database.createDocument(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      ID.unique(),
      {
        userId,
        bankId,
        accountID: accountId,
        accessToken,
        fundingSourceUrl,
        shareableId: sharableId,
      },
    );

    return parseStringify(bankAccount);
  } catch (error) {
    console.log(error);
  }
};

export const exchangePublicToken = async ({
  publicToken,
  user,
}: exchangePublicTokenProps) => {
  try {
    // Exchange public token for access token and item ID
    const response = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = response.data.access_token;
    const itemId = response.data.item_id;

    // Get account information from Plaid using the access token
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accountData = accountsResponse.data.accounts[0];

    // Create a processor token for Dwolla using the access token and account ID
    const request: ProcessorTokenCreateRequest = {
      access_token: accessToken,
      account_id: accountData.account_id,
      processor: "dwolla" as ProcessorTokenCreateRequestProcessorEnum,
    };

    const processorTokenResponse =
      await plaidClient.processorTokenCreate(request);
    const processorToken = processorTokenResponse.data.processor_token;

    // Create a funding source URL for the account using the Dwolla customer ID, processor token, and bank name
    const fundingSourceUrl = await addFundingSource({
      dwollaCustomerId: user.dwollaCustomerId,
      processorToken,
      bankName: accountData.name,
    });

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl: fundingSourceUrl || "pending-dwolla-funding-source",
      sharableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath("/dashboard");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while creating exchanging token:", error);
  }
};

export const getBanks = async ({ userId, authUserId }: getBanksProps) => {
  try {
    const { database } = await createAdminClient();
    const userIds = Array.from(
      new Set([userId, authUserId].filter(Boolean)),
    ) as string[];

    const banks = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("userId", userIds)],
    );

    return parseStringify(banks.documents);
  } catch (error) {
    console.log(error);
  }
};

export const getBank = async ({ documentId }: getBankProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("$id", [documentId])],
    );

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};

export const getBankByAccountId = async ({
  accountId,
}: getBankByAccountIdProps) => {
  try {
    const { database } = await createAdminClient();

    const bank = await database.listDocuments(
      DATABASE_ID!,
      BANK_COLLECTION_ID!,
      [Query.equal("accountID", [accountId])],
    );

    if (bank.total !== 1) return null;

    return parseStringify(bank.documents[0]);
  } catch (error) {
    console.log(error);
  }
};
