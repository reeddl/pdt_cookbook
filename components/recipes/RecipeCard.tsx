import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";

interface RecipeCardProps {
  id: string;
  title: string;
  category: string;
  photoUrl: string | null;
  submitterName: string;
  /** When set, the submitter's name links through to their profile. */
  submittedById?: string | null;
  /** Shown only where unpublished recipes are visible (your own profile). */
  status?: "PENDING" | "PUBLISHED" | "REJECTED";
}

export function RecipeCard({
  id,
  title,
  category,
  photoUrl,
  submitterName,
  submittedById,
  status,
}: RecipeCardProps) {
  return (
    // The title link is stretched over the whole card via `after:inset-0`, so
    // the submitter link below can sit beside it instead of nesting inside it.
    <Card className="relative h-full overflow-hidden transition-shadow hover:shadow-md">
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photoUrl} alt={title} className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-sidebar text-text-muted">
          No photo
        </div>
      )}
      <div className="p-4">
        <Link
          href={`/recipes/${id}`}
          className="font-medium text-text after:absolute after:inset-0 after:content-['']"
        >
          {title}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge>{category}</Badge>
          {status && status !== "PUBLISHED" && (
            <Badge className={status === "REJECTED" ? "bg-danger/10 text-danger" : ""}>
              {status === "PENDING" ? "Awaiting review" : "Not accepted"}
            </Badge>
          )}
          {submittedById ? (
            <Link
              href={`/profile/${submittedById}`}
              // Sits above the stretched title link so it stays clickable.
              className="relative z-10 text-xs text-text-muted hover:text-accent hover:underline"
            >
              by {submitterName}
            </Link>
          ) : (
            <span className="text-xs text-text-muted">by {submitterName}</span>
          )}
        </div>
      </div>
    </Card>
  );
}
