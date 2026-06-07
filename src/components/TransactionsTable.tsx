import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { transactionCategoryStyles } from "@/constants";
import {
  cn,
  formatAmount,
  formatDateTime,
  getTransactionCategory,
  getTransactionStatus,
  removeSpecialCharacters,
} from "@/lib/utils";

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const { borderColor, backgroundColor, textColor, chipBackgroundColor } =
    transactionCategoryStyles[
      category as keyof typeof transactionCategoryStyles
    ] || transactionCategoryStyles.default;

  return (
    <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
      <div className={cn("size-2 rounded-full", backgroundColor)} />
      <p className={cn("text-[12px] font-medium", textColor)}>{category}</p>
    </div>
  );
};

const TransactionsTable = ({ compact = false, transactions }: TransactionTableProps) => {
  return (
    <div
      className={cn(
        "min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-none",
        compact && "[&_[data-slot=table-container]]:overflow-x-hidden",
      )}
    >
      <Table className={cn(compact && "table-fixed")}>
        <TableHeader className="bg-[#f9fafb] dark:bg-slate-900/90">
          <TableRow className="dark:border-slate-800">
            <TableHead className="px-4 text-gray-700 dark:text-slate-300">
              Transaction
            </TableHead>
            <TableHead className="w-[112px] px-4 text-gray-700 dark:text-slate-300">
              Amount
            </TableHead>
            <TableHead className="w-[132px] px-4 text-gray-700 dark:text-slate-300">
              Status
            </TableHead>
            <TableHead className="w-[124px] px-4 text-gray-700 dark:text-slate-300">
              Date
            </TableHead>
            {!compact && (
              <>
                <TableHead className="px-4 text-gray-700 dark:text-slate-300 max-md:hidden">
                  Channel
                </TableHead>
                <TableHead className="px-4 text-gray-700 dark:text-slate-300 max-md:hidden">
                  Category
                </TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t: Transaction) => {
            const status = t.pending
              ? "Processing"
              : getTransactionStatus(new Date(t.date));
            const category = getTransactionCategory(t);
            const amount = formatAmount(t.amount);

            const isDebit = t.type === "debit";
            const isCredit = t.type === "credit";

            return (
              <TableRow
                key={t.id}
                className={`${isDebit || amount[0] === "-" ? "bg-[#FFFBFA] hover:!bg-[#FFF4F2] dark:bg-rose-950/10 dark:hover:!bg-rose-950/20" : "bg-[#F6FEF9] hover:!bg-[#EDFCF2] dark:bg-emerald-950/10 dark:hover:!bg-emerald-950/20"} !border-b dark:border-slate-800/80`}
              >
                <TableCell className="min-w-0 px-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <h1 className="text-14 truncate font-semibold text-[#344054] dark:text-slate-100">
                      {removeSpecialCharacters(t.name)}
                    </h1>
                  </div>
                </TableCell>

                <TableCell
                  className={`px-4 font-semibold ${
                    isDebit || amount[0] === "-"
                      ? "text-[#f04438] dark:text-rose-400"
                      : "text-[#039855] dark:text-emerald-400"
                  }`}
                >
                  {isDebit ? `-${amount}` : isCredit ? amount : amount}
                </TableCell>

                <TableCell className="px-4">
                  <CategoryBadge category={status} />
                </TableCell>

                <TableCell className="px-4 text-gray-700 dark:text-slate-300">
                  {compact
                    ? formatDateTime(new Date(t.date)).dateOnly
                    : formatDateTime(new Date(t.date)).dateTime}
                </TableCell>

                {!compact && (
                  <>
                    <TableCell className="min-w-24 px-4 capitalize text-gray-700 dark:text-slate-300">
                      {t.paymentChannel}
                    </TableCell>

                    <TableCell className="px-4 max-md:hidden">
                      <CategoryBadge category={category} />
                    </TableCell>
                  </>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default TransactionsTable;
