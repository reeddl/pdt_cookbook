"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl text-text">Something went wrong</h1>
      <p className="max-w-md text-sm text-text-muted">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
