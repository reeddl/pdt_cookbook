import { SubmitButton } from "@/components/ui/submit-button";
import { setViewAs } from "@/lib/viewAsActions";

/** Header control for real admins to preview the site as a lower role. */
export function ViewAsSwitcher() {
  return (
    <div className="flex items-center gap-1 text-caption-1-regular text-text-secondary">
      <span>View as</span>
      <form action={setViewAs.bind(null, "MEMBER")}>
        <SubmitButton variant="ghost" className="h-8" pendingLabel="…">
          Member
        </SubmitButton>
      </form>
      <form action={setViewAs.bind(null, "MODERATOR")}>
        <SubmitButton variant="ghost" className="h-8" pendingLabel="…">
          Moderator
        </SubmitButton>
      </form>
    </div>
  );
}
