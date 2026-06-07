import { describe, expect, it } from "vitest";

import {
  countTransactionCategories,
  extractCustomerIdFromUrl,
  formatAmount,
  getTransactionCategory,
} from "./utils";

const transaction = (
  name: string,
  category = "",
): Transaction =>
  ({
    name,
    category,
  }) as Transaction;

describe("general utils", () => {
  it("formats USD amounts", () => {
    expect(formatAmount(110)).toBe("$110.00");
    expect(formatAmount(-15.5)).toBe("-$15.50");
  });

  it("uses explicit transaction category before name heuristics", () => {
    expect(getTransactionCategory(transaction("Uber SFPOOL", "Transport"))).toBe(
      "Transport",
    );
  });

  it("infers transaction categories from names", () => {
    expect(getTransactionCategory(transaction("Uber 072515 SFPOOL"))).toBe(
      "Travel",
    );
    expect(getTransactionCategory(transaction("Starbucks"))).toBe(
      "Food and Drink",
    );
    expect(getTransactionCategory(transaction("NovaUSD purchase"))).toBe(
      "Transfer",
    );
    expect(getTransactionCategory(transaction("Unknown merchant"))).toBe("Other");
  });

  it("counts and sorts transaction categories", () => {
    const categories = countTransactionCategories([
      transaction("Uber"),
      transaction("United Airlines"),
      transaction("NovaUSD purchase"),
    ]);

    expect(categories).toEqual([
      { name: "Travel", count: 2, totalCount: 3 },
      { name: "Transfer", count: 1, totalCount: 3 },
    ]);
  });

  it("extracts customer id from a Dwolla URL", () => {
    expect(
      extractCustomerIdFromUrl("https://api-sandbox.dwolla.com/customers/abc123"),
    ).toBe("abc123");
  });
});
