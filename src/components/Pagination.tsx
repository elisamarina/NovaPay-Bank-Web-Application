"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formUrlQuery } from "@/lib/utils";

export const Pagination = ({ page, totalPages }: PaginationProps) => {
  const router = useRouter();
  const searchParams = useSearchParams()!;

  const handleNavigation = (type: "prev" | "next") => {
    const pageNumber = type === "prev" ? page - 1 : page + 1;

    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "page",
      value: pageNumber.toString(),
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Button
        size="default"
        variant="outline"
        className="min-w-[92px] gap-2 px-3"
        onClick={() => handleNavigation("prev")}
        disabled={Number(page) <= 1}
      >
        <Image
          src="/icons/arrow-left.svg"
          alt="arrow"
          width={20}
          height={20}
        />
        Prev
      </Button>
      <p className="flex min-w-[64px] items-center justify-center rounded-md bg-gray-50 px-3 py-2 text-14 font-semibold text-gray-700 dark:bg-slate-900 dark:text-slate-200">
        {page} / {totalPages}
      </p>
      <Button
        size="default"
        variant="outline"
        className="min-w-[92px] gap-2 px-3"
        onClick={() => handleNavigation("next")}
        disabled={Number(page) >= totalPages}
      >
        Next
        <Image
          src="/icons/arrow-left.svg"
          alt="arrow"
          width={20}
          height={20}
          className="-scale-x-100"
        />
      </Button>
    </div>
  );
};
