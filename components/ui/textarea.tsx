import { TextareaHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full rounded-2lg bg-background-tertiary-default px-3 py-2 text-body-regular text-text-primary max-sm:text-base ring-2 ring-inset ring-transparent transition-[background-color,box-shadow] outline-none placeholder:text-text-tertiary hover:ring-border-button-hover focus:ring-border-button-active disabled:cursor-not-allowed disabled:bg-input-disabled-background disabled:text-input-disabled-text aria-invalid:bg-background-tertiary-error",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
