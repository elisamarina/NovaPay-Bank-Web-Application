import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BankTabItem } from "./BankTabItem";
import BankInfo from "./BankInfo";
import TransactionsTable from "./TransactionsTable";
import { Pagination } from "./Pagination";

const placeholderAccount: Account = {
  id: "placeholder-checking",
  availableBalance: 110,
  currentBalance: 110,
  officialName: "NovaPay Demo Checking",
  mask: "0000",
  institutionId: "placeholder-bank",
  name: "Plaid Checking",
  type: "depository",
  subtype: "checking",
  appwriteItemId: "placeholder-checking",
  sharableId: "placeholder-checking",
};

const placeholderTransactions: Transaction[] = [
  {
    id: "placeholder-uber",
    $id: "placeholder-uber",
    name: "Uber 063015 SFPOOL",
    paymentChannel: "online",
    type: "debit",
    accountId: "placeholder-checking",
    amount: 5.4,
    pending: false,
    category: "Travel",
    date: "2026-04-24",
    image: "",
    $createdAt: "2026-04-24",
    channel: "online",
    senderBankId: "",
    receiverBankId: "",
  },
  {
    id: "placeholder-card",
    $id: "placeholder-card",
    name: "Credit Card 3333 Payment",
    paymentChannel: "other",
    type: "credit",
    accountId: "placeholder-checking",
    amount: 25,
    pending: false,
    category: "Payment",
    date: "2026-04-24",
    image: "",
    $createdAt: "2026-04-24",
    channel: "other",
    senderBankId: "",
    receiverBankId: "",
  },
];

const RecentTransactions = ({
  accounts,
  transactions = [],
  appwriteItemId,
  page = 1,
}: RecentTransactionsProps) => {
  const displayedAccounts = accounts.length > 0 ? accounts : [placeholderAccount];
  const displayedTransactions =
    transactions.length > 0 ? transactions : placeholderTransactions;
  const selectedAppwriteItemId =
    appwriteItemId || displayedAccounts[0]?.appwriteItemId || "";
  const hasRealAccount = accounts.length > 0;
  const rowsPerPage = 10;
  const totalPages = Math.ceil(displayedTransactions.length / rowsPerPage);

  const indexOfLastTransaction = page * rowsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - rowsPerPage;

  const currentTransactions = displayedTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction,
  );

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Recent transactions</h2>
        <Link
          href={hasRealAccount ? `/transaction-history/?id=${selectedAppwriteItemId}` : "/transaction-history"}
          className="view-all-btn"
        >
          View all
        </Link>
      </header>

      <Tabs defaultValue={selectedAppwriteItemId} className="min-w-0 w-full">
        <TabsList className="recent-transactions-tablist">
          {displayedAccounts.map((account: Account) => (
            <TabsTrigger key={account.id} value={account.appwriteItemId}>
              <BankTabItem
                key={account.id}
                account={account}
                appwriteItemId={selectedAppwriteItemId}
              />
            </TabsTrigger>
          ))}
        </TabsList>

        {displayedAccounts.map((account: Account) => (
          <TabsContent
            value={account.appwriteItemId}
            key={account.id}
            className="min-w-0 space-y-4"
          >
            <BankInfo
              account={account}
              appwriteItemId={selectedAppwriteItemId}
              type="full"
            />

            <TransactionsTable transactions={currentTransactions} compact />

            {totalPages > 1 && (
              <div className="my-4 w-full">
                <Pagination totalPages={totalPages} page={page} />
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
};

export default RecentTransactions;
