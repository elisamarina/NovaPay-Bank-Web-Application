import React from "react";
import Image from "next/image";

import { topCategoryStyles } from "@/constants";
import { cn } from "@/lib/utils";

const Category = ({ category }: CategoryProps) => {
  const percentage =
    category.totalCount > 0
      ? Math.round((category.count / category.totalCount) * 100)
      : 0;
  const styles =
    topCategoryStyles[category.name as keyof typeof topCategoryStyles] ||
    topCategoryStyles.default;

  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-4 shadow-sm transition-all hover:-translate-y-0.5 dark:bg-slate-900/80 dark:ring-1 dark:ring-white/10",
        styles.bg,
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-full dark:bg-slate-800",
            styles.circleBg,
          )}
        >
          <Image src={styles.icon} width={22} height={22} alt="" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p
              className={cn(
                "truncate text-15 font-semibold dark:text-slate-100",
                styles.text.main,
              )}
            >
              {category.name}
            </p>
            <p
              className={cn(
                "shrink-0 text-14 font-semibold dark:text-slate-300",
                styles.text.count,
              )}
            >
              {category.count} tx
            </p>
          </div>

          <div
            className={cn(
              "h-2.5 overflow-hidden rounded-full dark:bg-slate-800",
              styles.progress.bg,
            )}
          >
            <div
              className={cn("h-full rounded-full", styles.progress.indicator)}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Category;
