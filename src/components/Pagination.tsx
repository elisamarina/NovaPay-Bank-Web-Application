"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

import { formUrlQuery } from "@/lib/utils";

export const Pagination = ({ page, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleNavigation = (nextPage: number) => {
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "page",
      value: String(nextPage),
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => handleNavigation(page - 1)}
        className="flex items-center gap-1 rounded-md border px-3 py-2 text-14 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ChevronLeft size={16} />
        Prev
      </button>

      <p className="text-14 font-medium text-gray-700">
        {page} / {totalPages}
      </p>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => handleNavigation(page + 1)}
        className="flex items-center gap-1 rounded-md border px-3 py-2 text-14 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
        <ChevronRight size={16} />
      </button>
    </div>
  );
};
