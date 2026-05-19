"use server";

import { createAdminClient, createSessionClient } from "@/lib/appwrite";
import {
  encryptId,
  extractCustomerIdFromUrl,
  parseStringify,
} from "@/lib/utils";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ID, Query } from "node-appwrite";
import {
  CountryCode,
  ProcessorTokenCreateRequest,
  ProcessorTokenCreateRequestProcessorEnum,
  Products,
} from "plaid";
import { addFundingSource, createDwollaCustomer } from "./dwolla.actions";
import { plaidClient } from "@/lib/plaid";

const {
  APPWRITE_DATABASE_ID: DATABASE_ID,
  APPWRITE_USER_COLLECTION_ID: USER_COLLECTION_ID,
  APPWRITE_BANK_COLLECTION_ID: BANK_COLLECTION_ID,
} = process.env;

const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return "Sign up failed. Please check your data or try again later.";
};

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const normalizeUserDocument = (
  userDocument: Record<string, unknown>,
): User => {
  const firstName = String(userDocument.FirstName ?? "");
  const lastName = String(userDocument.LastName ?? "");

  return {
    $id: String(userDocument.$id ?? ""),
    name: `${firstName} ${lastName}`.trim(),
    email: String(userDocument.email ?? ""),
    userId: String(userDocument.ID ?? ""),
    dwollaCustomerUrl: String(userDocument.dwollaCustomerUrl ?? ""),
    dwollaCustomerId: String(userDocument.dwollaCustomerId ?? ""),
    firstName,
    lastName,
    address1: String(userDocument.address1 ?? ""),
    city: String(userDocument.city ?? ""),
    state: String(userDocument.state ?? ""),
    postalCode: String(userDocument.postalCode ?? ""),
    dateOfBirth: String(userDocument.dateOfBirth ?? ""),
    ssn: String(userDocument.ssn ?? ""),
  };
};

const normalizeAuthUser = (authUser: Record<string, unknown>): User => {
  const name = String(authUser.name ?? "");
  const [firstName = "", ...lastNameParts] = name.split(" ");

  return {
    $id: String(authUser.$id ?? ""),
    name,
    email: String(authUser.email ?? ""),
    userId: String(authUser.$id ?? ""),
    dwollaCustomerUrl: "",
    dwollaCustomerId: "",
    firstName,
    lastName: lastNameParts.join(" "),
    address1: "",
    city: "",
    state: "",
    postalCode: "",
    dateOfBirth: "",
    ssn: "",
  };
};

export const signIn = async (
  credentials: LoginUser,
): Promise<SignInResult> => {
  const email = normalizeEmail(credentials.email);
  const { password } = credentials;

  try {
    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession({
      email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, cookieOptions);

    return { success: true };
  } catch (error) {
    console.error("Error", error);
    try {
      const { user } = await createAdminClient();
      const users = await user.list({
        queries: [Query.equal("email", email)],
      });

      if (users.total > 0) {
        return {
          success: false,
          error:
            "Userul exista in Appwrite, dar parola nu se potriveste. Probabil contul a fost creat intr-o incercare anterioara cu alta parola.",
        };
      }
    } catch {
      // Keep the original auth error below.
    }

    return {
      success: false,
      error: getErrorMessage(error),
    };
  }
};

export const signUp = async ({
  password,
  ...userData
}: SignUpParams): Promise<SignUpResult> => {
  const email = normalizeEmail(userData.email);
  const { firstName, lastName } = userData;

  let newUserAccount;

  try {
    const { account, database } = await createAdminClient();

    newUserAccount = await account.create(
      ID.unique(),
      email,
      password,
      `${firstName} ${lastName}`,
    );

    if (!newUserAccount) throw new Error("Error creating user");

    const dwollaCustomerUrl =
      (await createDwollaCustomer({
        ...userData,
        type: "personal",
      })) ?? "";
    const dwollaCustomerId = dwollaCustomerUrl
      ? extractCustomerIdFromUrl(dwollaCustomerUrl)
      : "";

    const newUser = await database.createDocument(
      DATABASE_ID!,
      USER_COLLECTION_ID!,
      ID.unique(),
      {
        email,
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
      email,
      password,
    });

    const cookieStore = await cookies();
    cookieStore.set("appwrite-session", session.secret, cookieOptions);

    return {
      user: normalizeUserDocument(parseStringify(newUser)),
    };
  } catch (error) {
    console.error("Error", error);
    return {
      user: null,
      error: getErrorMessage(error),
    };
  }
};

export async function getLoggedInUser(): Promise<User | null> {
  try {
    const { account } = await createSessionClient();
    const authUser = await account.get();

    try {
      const { database } = await createAdminClient();
      const users = await database.listDocuments(
        DATABASE_ID!,
        USER_COLLECTION_ID!,
        [Query.equal("ID", authUser.$id)],
      );
      const userDocument = users.documents[0];

      if (userDocument) {
        return normalizeUserDocument({
          ...userDocument,
          email: userDocument.email ?? authUser.email,
        });
      }
    } catch {
      // Fall back to the authenticated Appwrite user if the profile document is unavailable.
    }

    return normalizeAuthUser(authUser);
  } catch {
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const { account } = await createSessionClient();
    const cookieStore = await cookies();
    cookieStore.delete("appwrite-session");
    await account.deleteSession("current");
    return true;
  } catch (error) {
    console.error("Error", error);
    return false;
  }
};

export const createLinkToken = async (user: User) => {
  try {
    const tokenParams = {
      user: {
        client_user_id: user.$id,
      },
      client_name: `${user.firstName} ${user.lastName}`,
      products: ["auth"] as Products[],
      language: "en",
      country_codes: ["US"] as CountryCode[],
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
        accountId,
        accessToken,
        fundingSourceUrl,
        sharableId,
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

    // If the funding source URL is not created, throw an error
    if (!fundingSourceUrl) throw Error;

    // Create a bank account using the user ID, item ID, account ID, access token, funding source URL, and shareableId ID
    await createBankAccount({
      userId: user.$id,
      bankId: itemId,
      accountId: accountData.account_id,
      accessToken,
      fundingSourceUrl,
      sharableId: encryptId(accountData.account_id),
    });

    // Revalidate the path to reflect the changes
    revalidatePath("/");

    // Return a success message
    return parseStringify({
      publicTokenExchange: "complete",
    });
  } catch (error) {
    console.error("An error occurred while creating exchanging token:", error);
  }
};
