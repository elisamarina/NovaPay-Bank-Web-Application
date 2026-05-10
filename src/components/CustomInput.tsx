import React from "react";
import { FormControl, FormField, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";

import { Control, FieldPath } from "react-hook-form";
import { z } from "zod";
import { authFormSchema } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const formSchema = authFormSchema("sign-up");

interface CustomInputProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  control: Control<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  name: FieldPath<any>;
  label: string;
  placeholder: string;
}

const CustomInput = ({
  control,
  name,
  label,
  placeholder,
}: CustomInputProps) => {
  return (
    <FormField
      control={control}
      name={name}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      render={({ field }: { field: any }) => (
        <div className="form-item">
          <FormLabel className="form-label">{label}</FormLabel>
          <div className="flex w-full flex-col">
            <FormControl>
              <Input
                placeholder={placeholder}
                className="input-class"
                type={name === "password" ? "password" : "text"}
                {...field}
                value={field.value ?? ""}
              />
            </FormControl>
            <FormMessage className="form-message mt-2" />
          </div>
        </div>
      )}
    />
  );
};

export default CustomInput;
