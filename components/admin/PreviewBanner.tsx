import { SubmitButton } from "@/components/ui/submit-button";
import { setViewAs } from "@/lib/viewAsActions";
import type { ViewAsRole } from "@/lib/viewAs";

/** Sticky bar shown for the whole time an admin is previewing a lower role. */
export function PreviewBanner({ role, name }: { role: ViewAsRole; name: string }) {
  return (
    <div className="sticky top-0 z-50 flex flex-wrap items-center justify-between gap-2 bg-status-lime-background px-4 py-2 text-body-regular text-status-lime-text">
      <p>
        <span className="text-body-medium">Previewing as {role === "MEMBER" ? "a member" : "a moderator"}.</span>{" "}
        You&apos;re still signed in as {name}, so anything you post is posted as you, but admin-only
        pages and actions are switched off.
      </p>
      <form action={setViewAs.bind(null, null)}>
        <SubmitButton variant="secondary" className="h-8" pendingLabel="Exiting…">
          Exit preview
        </SubmitButton>
      </form>
    </div>
  );
}
