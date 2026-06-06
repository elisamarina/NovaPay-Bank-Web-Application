"use server";

import {
  CountryCode,
} from "plaid";

import { plaidClient } from "../plaid";
import { parseStringify } from "../utils";

import { getTransactionsByBankId } from "./transaction.actions";
import { getBanks, getBank } from "./user.actions";

// Get multiple bank accounts
export const getAccounts = async ({ userId, authUserId }: getAccountsProps) => {
  try {
    // get banks from db
    const banks =
      ((await getBanks({ userId, authUserId })) as unknown as Bank[]) || [];

    const accounts = await Promise.all(
      banks.map(async (bank) => {
        // get each account info from plaid
        const accountsResponse = await plaidClient.accountsGet({
          access_token: bank.accessToken,
        });
        const accountData =
          accountsResponse.data.accounts.find(
            (account) => account.account_id === (bank.accountID || bank.accountId),
          ) || accountsResponse.data.accounts[0];

        // get institution info from plaid
        const institution = await getInstitution({
          institutionId: accountsResponse.data.item.institution_id!,
        });

        if (!institution) throw new Error("Institution not found");

        const account: Account = {
          id: accountData.account_id,
          availableBalance: accountData.balances.available!,
          currentBalance: accountData.balances.current!,
          institutionId: institution.institution_id,
          name: accountData.name,
          officialName: accountData.official_name || accountData.name,
          mask: accountData.mask!,
          type: accountData.type as string,
          subtype: accountData.subtype! as string,
          appwriteItemId: bank.$id,
          sharableId: bank.shareableId || bank.sharableId || "",
        };

        return account;
      }),
    );

    const totalBanks = accounts.length;
    const totalCurrentBalance = accounts.reduce((total, account) => {
      return total + account.currentBalance;
    }, 0);

    return parseStringify({ data: accounts, totalBanks, totalCurrentBalance });
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
  }
};

// Get one bank account
export const getAccount = async ({ appwriteItemId }: getAccountProps) => {
  try {
    // get bank from db
    const bank = (await getBank({
      documentId: appwriteItemId,
    })) as unknown as Bank | null;

    if (!bank) throw new Error("Bank not found");

    // get account info from plaid
    const accountsResponse = await plaidClient.accountsGet({
      access_token: bank.accessToken,
    });
    const accountData =
      accountsResponse.data.accounts.find(
        (account) => account.account_id === (bank.accountID || bank.accountId),
      ) || accountsResponse.data.accounts[0];

    // get transfer transactions from appwrite
    const transferTransactionsData = await getTransactionsByBankId({
      bankId: bank.$id,
    });

    const transferDocuments =
      (transferTransactionsData.documents as Transaction[]) || [];

    const transferTransactions = transferDocuments.map((transferData) => ({
      id: transferData.$id,
      $id: transferData.$id,
      name: transferData.name!,
      paymentChannel: transferData.channel || "online",
      type: transferData.senderBankId === bank.$id ? "debit" : "credit",
      accountId: accountData.account_id,
      amount: Number(transferData.amount),
      pending: true,
      category: transferData.category || "Transfer",
      date: transferData.$createdAt,
      image: "",
      $createdAt: transferData.$createdAt,
      channel: transferData.channel || "online",
      senderBankId: transferData.senderBankId,
      receiverBankId: transferData.receiverBankId,
    }));

    // get institution info from plaid
    const institution = await getInstitution({
      institutionId: accountsResponse.data.item.institution_id!,
    });

    if (!institution) throw new Error("Institution not found");

    const transactions =
      (await getTransactions({
      accessToken: bank?.accessToken,
      accountId: bank.accountID || bank.accountId || "",
    })) || [];

    const account: Account = {
      id: accountData.account_id,
      availableBalance: accountData.balances.available!,
      currentBalance: accountData.balances.current!,
      institutionId: institution.institution_id,
      name: accountData.name,
      officialName: accountData.official_name || accountData.name,
      mask: accountData.mask!,
      type: accountData.type as string,
      subtype: accountData.subtype! as string,
      appwriteItemId: bank.$id,
      sharableId: bank.shareableId || bank.sharableId || "",
    };

    // sort transactions by date such that the most recent transaction is first
    const allTransactions = [...transactions, ...transferTransactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    return parseStringify({
      data: account,
      transactions: allTransactions,
    });
  } catch (error) {
    console.error("An error occurred while getting the account:", error);
  }
};

// Get bank info
export const getInstitution = async ({
  institutionId,
}: getInstitutionProps): Promise<{ institution_id: string } | null> => {
  try {
    const institutionResponse = await plaidClient.institutionsGetById({
      institution_id: institutionId,
      country_codes: ["US"] as CountryCode[],
    });

    const intitution = institutionResponse.data.institution;

    return parseStringify(intitution);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return null;
  }
};

// Get transactions
export const getTransactions = async ({
  accessToken,
  accountId,
}: getTransactionsProps): Promise<Transaction[]> => {
  let hasMore = true;
  let transactions: Transaction[] = [];
  let cursor: string | undefined;

  try {
    // Iterate through each page of new transaction updates for item
    while (hasMore) {
      const response = await plaidClient.transactionsSync({
        access_token: accessToken,
        cursor,
      });

      const data = response.data;

      const addedTransactions = response.data.added
        .filter((transaction) => !accountId || transaction.account_id === accountId)
        .map((transaction) => ({
          id: transaction.transaction_id,
          $id: transaction.transaction_id,
          name: transaction.name,
          paymentChannel: transaction.payment_channel,
          type: transaction.amount > 0 ? "debit" : "credit",
          accountId: transaction.account_id,
          amount: Math.abs(transaction.amount),
          pending: transaction.pending,
          category: transaction.category ? transaction.category[0] : "",
          date: transaction.date,
          image: transaction.logo_url || "",
          $createdAt: transaction.date,
          channel: transaction.payment_channel,
          senderBankId: "",
          receiverBankId: "",
        }));

      transactions = [...transactions, ...addedTransactions];
      cursor = data.next_cursor;

      hasMore = data.has_more;
    }

    return parseStringify(transactions);
  } catch (error) {
    console.error("An error occurred while getting the accounts:", error);
    return [];
  }
};
