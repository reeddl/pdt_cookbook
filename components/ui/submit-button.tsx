"use client";

import { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type ButtonProps = React.ComponentProps<typeof Button>;

interface SubmitButtonProps extends Omit<ButtonProps, "type" | "children"> {
  children: ReactNode;
  /** Label shown while the action runs. Defaults to the idle label. */
  pendingLabel?: ReactNode;
}

/**
 * Submit button that disables itself and shows a spinner while its form's
 * action is in flight, so a slow round trip can't be double-submitted.
 * Must be rendered inside the <form> it submits — that's how useFormStatus
 * finds the pending state.
 */
export function SubmitButton({
  children,
  pendingLabel,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <Spinner />}
      {pending ? (pendingLabel ?? children) : children}
    </Button>
  );
}
