import { ButtonHTMLAttributes, forwardRef } from "react";
import { buttonStyles } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

type Variant = "primary" | "secondary" | "danger" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

/**
 * Native-props wrapper over BoardUI's button styles, so server-action forms
 * (name/value, formAction, type="submit") keep working unchanged.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cx(
        buttonStyles.base,
        buttonStyles.size.medium,
        buttonStyles.variant[variant],
        "px-3",
        className
      )}
      {...props}
    />
  )
);
Button.displayName = "Button";
