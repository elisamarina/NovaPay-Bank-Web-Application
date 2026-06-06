"use client";

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select";
import { formUrlQuery, formatAmount } from "@/lib/utils";

export const BankDropdown = ({
  accounts = [],
  setValue,
  otherStyles,
}: BankDropdownProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [selectedBankId, setSelectedBankId] = useState(
    accounts[0]?.appwriteItemId || "",
  );
  const selected =
    accounts.find((account) => account.appwriteItemId === selectedBankId) ||
    accounts[0];

  useEffect(() => {
    if (!selected?.appwriteItemId) return;

    setValue?.("senderBank", selected.appwriteItemId, {
      shouldValidate: true,
      shouldDirty: false,
    });
  }, [selected?.appwriteItemId, setValue]);

  const handleBankChange = (id: string) => {
    const account = accounts.find((account) => account.appwriteItemId === id);

    if (!account) return;

    setSelectedBankId(id);
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: id,
    });
    router.push(newUrl, { scroll: false });

    if (setValue) {
      setValue("senderBank", id, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  return (
    <Select
      value={selected?.appwriteItemId || ""}
      onValueChange={(value) => handleBankChange(value)}
      disabled={!accounts.length}
    >
      <SelectTrigger
        className={`flex w-full bg-white gap-3 md:w-[300px] ${otherStyles}`}
      >
        <Image
          src="/icons/credit-card.svg"
          width={20}
          height={20}
          alt="account"
        />
        <p className="line-clamp-1 w-full text-left">
          {selected?.name || "No bank accounts"}
        </p>
      </SelectTrigger>
      <SelectContent
        className={`w-full bg-white md:w-[300px] ${otherStyles}`}
        align="end"
      >
        <SelectGroup>
          <SelectLabel className="py-2 font-normal text-gray-500">
            Select a bank to display
          </SelectLabel>
          {accounts.map((account: Account) => (
            <SelectItem
              key={account.appwriteItemId || account.id}
              value={account.appwriteItemId}
              className="cursor-pointer border-t"
            >
              <div className="flex flex-col ">
                <p className="text-16 font-medium">{account.name}</p>
                <p className="text-14 font-medium text-blue-600">
                  {formatAmount(account.currentBalance)}
                </p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};
