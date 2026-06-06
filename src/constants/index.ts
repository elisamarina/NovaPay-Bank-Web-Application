export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/dashboard",
    label: "Home",
  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/my-banks",
    label: "My Banks",
  },
  {
    imgURL: "/icons/transaction.svg",
    route: "/transaction-history",
    label: "Transaction History",
  },
  {
    imgURL: "/icons/money-send.svg",
    route: "/payment-transfer",
    label: "Transfer Funds",
  },
  {
    imgURL: "/icons/coins.svg",
    route: "/staking",
    label: "Staking",
  },
];

// good_user / good_password - Bank of America
export const TEST_USER_ID = "6627ed3d00267aa6fa3e";

// custom_user -> Chase Bank
// export const TEST_ACCESS_TOKEN =
//   "access-sandbox-da44dac8-7d31-4f66-ab36-2238d63a3017";

// custom_user -> Chase Bank
export const TEST_ACCESS_TOKEN =
  "access-sandbox-229476cf-25bc-46d2-9ed5-fba9df7a5d63";

export const ITEMS = [
  {
    id: "6624c02e00367128945e", // appwrite item Id
    accessToken: "access-sandbox-83fd9200-0165-4ef8-afde-65744b9d1548",
    itemId: "VPMQJKG5vASvpX8B6JK3HmXkZlAyplhW3r9xm",
    userId: "6627ed3d00267aa6fa3e",
    accountId: "X7LMJkE5vnskJBxwPeXaUWDBxAyZXwi9DNEWJ",
  },
  {
    id: "6627f07b00348f242ea9", // appwrite item Id
    accessToken: "access-sandbox-74d49e15-fc3b-4d10-a5e7-be4ddae05b30",
    itemId: "Wv7P6vNXRXiMkoKWPzeZS9Zm5JGWdXulLRNBq",
    userId: "6627ed3d00267aa6fa3e",
    accountId: "x1GQb1lDrDHWX4BwkqQbI4qpQP1lL6tJ3VVo9",
  },
];

export const topCategoryStyles = {
  Subscriptions: {
    bg: "bg-blue-25",
    circleBg: "bg-blue-100",
    text: {
      main: "text-blue-900",
      count: "text-blue-700",
    },
    progress: {
      bg: "bg-blue-100",
      indicator: "bg-blue-700",
    },
    icon: "/icons/monitor.svg",
  },
  "Food and Drink": {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-900",
      count: "text-pink-700",
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-700",
    },
    icon: "/icons/shopping-bag.svg",
  },
  Savings: {
    bg: "bg-success-25",
    circleBg: "bg-success-100",
    text: {
      main: "text-success-900",
      count: "text-success-700",
    },
    progress: {
      bg: "bg-success-100",
      indicator: "bg-success-700",
    },
    icon: "/icons/coins.svg",
  },
  Travel: {
    bg: "bg-purple-50",
    circleBg: "bg-purple-100",
    text: {
      main: "text-purple-900",
      count: "text-purple-700",
    },
    progress: {
      bg: "bg-purple-100",
      indicator: "bg-purple-600",
    },
    icon: "/icons/money-send.svg",
  },
  Utilities: {
    bg: "bg-slate-50",
    circleBg: "bg-slate-100",
    text: {
      main: "text-slate-900",
      count: "text-slate-700",
    },
    progress: {
      bg: "bg-slate-200",
      indicator: "bg-slate-600",
    },
    icon: "/icons/dollar-circle.svg",
  },
  Shopping: {
    bg: "bg-orange-50",
    circleBg: "bg-orange-100",
    text: {
      main: "text-orange-900",
      count: "text-orange-700",
    },
    progress: {
      bg: "bg-orange-100",
      indicator: "bg-orange-500",
    },
    icon: "/icons/shopping-bag.svg",
  },
  Payment: {
    bg: "bg-success-25",
    circleBg: "bg-success-100",
    text: {
      main: "text-success-900",
      count: "text-success-700",
    },
    progress: {
      bg: "bg-success-100",
      indicator: "bg-success-700",
    },
    icon: "/icons/coins.svg",
  },
  Transfer: {
    bg: "bg-red-50",
    circleBg: "bg-red-100",
    text: {
      main: "text-red-900",
      count: "text-red-700",
    },
    progress: {
      bg: "bg-red-100",
      indicator: "bg-red-600",
    },
    icon: "/icons/bank-transfer.svg",
  },
  default: {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-900",
      count: "text-pink-700",
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-700",
    },
    icon: "/icons/shopping-bag.svg",
  },
};

export const transactionCategoryStyles = {
  Subscriptions: {
    borderColor: "border-blue-600 dark:border-blue-400/40",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    chipBackgroundColor: "bg-blue-50 dark:bg-blue-950/50",
  },
  "Food and Drink": {
    borderColor: "border-pink-600 dark:border-pink-400/40",
    backgroundColor: "bg-pink-500",
    textColor: "text-pink-700 dark:text-pink-300",
    chipBackgroundColor: "bg-pink-50 dark:bg-pink-950/40",
  },
  Savings: {
    borderColor: "border-success-600 dark:border-emerald-400/40",
    backgroundColor: "bg-green-600",
    textColor: "text-success-700 dark:text-emerald-300",
    chipBackgroundColor: "bg-success-25 dark:bg-emerald-950/50",
  },
  Travel: {
    borderColor: "border-purple-600 dark:border-purple-400/40",
    backgroundColor: "bg-purple-500",
    textColor: "text-purple-700 dark:text-purple-300",
    chipBackgroundColor: "bg-purple-50 dark:bg-purple-950/50",
  },
  Utilities: {
    borderColor: "border-slate-500 dark:border-slate-500/50",
    backgroundColor: "bg-slate-500",
    textColor: "text-slate-700 dark:text-slate-300",
    chipBackgroundColor: "bg-slate-50 dark:bg-slate-800",
  },
  Shopping: {
    borderColor: "border-orange-500 dark:border-orange-400/40",
    backgroundColor: "bg-orange-500",
    textColor: "text-orange-700 dark:text-orange-300",
    chipBackgroundColor: "bg-orange-50 dark:bg-orange-950/50",
  },
  Payment: {
    borderColor: "border-success-600 dark:border-emerald-400/40",
    backgroundColor: "bg-green-600",
    textColor: "text-success-700 dark:text-emerald-300",
    chipBackgroundColor: "bg-success-25 dark:bg-emerald-950/50",
  },
  "Bank Fees": {
    borderColor: "border-success-600 dark:border-emerald-400/40",
    backgroundColor: "bg-green-600",
    textColor: "text-success-700 dark:text-emerald-300",
    chipBackgroundColor: "bg-success-25 dark:bg-emerald-950/50",
  },
  Transfer: {
    borderColor: "border-red-700 dark:border-red-400/40",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700 dark:text-red-300",
    chipBackgroundColor: "bg-red-50 dark:bg-red-950/50",
  },
  Processing: {
    borderColor: "border-[#F2F4F7] dark:border-slate-500/40",
    backgroundColor: "bg-gray-500",
    textColor: "text-[#344054] dark:text-slate-300",
    chipBackgroundColor: "bg-[#F2F4F7] dark:bg-slate-800",
  },
  Success: {
    borderColor: "border-[#12B76A] dark:border-emerald-400/40",
    backgroundColor: "bg-[#12B76A]",
    textColor: "text-[#027A48] dark:text-emerald-300",
    chipBackgroundColor: "bg-[#ECFDF3] dark:bg-emerald-950/50",
  },
  default: {
    borderColor: "border-blue-500 dark:border-blue-400/40",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700 dark:text-blue-300",
    chipBackgroundColor: "bg-blue-50 dark:bg-blue-950/50",
  },
};
