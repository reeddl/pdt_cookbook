import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="font-display text-3xl text-text">Page not found</h1>
      <p className="text-sm text-text-muted">
        The page you&apos;re looking for doesn&apos;t exist or may have been removed.
      </p>
      <Link href="/">
        <Button variant="secondary">Back to the cookbook</Button>
      </Link>
    </div>
  );
}
