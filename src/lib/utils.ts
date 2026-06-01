import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAmount = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

export const formatDateTime = (date: Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
  };

  return {
    dateTime: new Intl.DateTimeFormat("en-US", dateTimeOptions).format(date),
    dateOnly: new Intl.DateTimeFormat("en-US", dateOptions).format(date),
    timeOnly: new Intl.DateTimeFormat("en-US", timeOptions).format(date),
  };
};

export const parseStringify = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value)) as T;

export const countTransactionCategories = (
  transactions: Transaction[] = [],
): CategoryCount[] => {
  const counts = transactions.reduce<Record<string, number>>((acc, transaction) => {
    const name = transaction.category || "Other";
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      totalCount: transactions.length,
    }))
    .sort((a, b) => b.count - a.count);
};

export function extractCustomerIdFromUrl(url: string) {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

export function encryptId(id: string) {
  return btoa(id);
}

export const removeSpecialCharacters = (value: string) =>
  value.replace(/[^\w\s]/gi, "");

export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo ? "Processing" : "Success";
};

export const formUrlQuery = ({
  params,
  key,
  value,
}: {
  params: string;
  key: string;
  value?: string;
}) => {
  const currentUrl = new URLSearchParams(params);

  if (value) {
    currentUrl.set(key, value);
  } else {
    currentUrl.delete(key);
  }

  const queryString = currentUrl.toString();
  return queryString ? `?${queryString}` : "/";
};

export const getAccountTypeColors = (type: AccountTypes) => {
  switch (type) {
    case "depository":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };
    case "credit":
      return {
        bg: "bg-success-25",
        lightBg: "bg-success-100",
        title: "text-success-900",
        subText: "text-success-700",
      };
    case "loan ":
      return {
        bg: "bg-pink-25",
        lightBg: "bg-pink-100",
        title: "text-pink-900",
        subText: "text-pink-700",
      };
    default:
      return {
        bg: "bg-slate-50",
        lightBg: "bg-slate-100",
        title: "text-slate-900",
        subText: "text-slate-700",
      };
  }
};

export const authFormSchema = (formType: string) => {
  if (formType === "sign-in") {
    return z.object({
      email: z.string().email("Please enter a valid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });
  }

  return z.object({
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address1: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    postalCode: z.string().min(1, "Postal code is required"),
    dateOfBirth: z.string().min(1, "Date of birth is required"),
    ssn: z.string().min(1, "SSN is required"),
  });
};
