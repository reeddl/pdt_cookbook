import Link from "next/link";
import { Card, Badge } from "@/components/ui/card";

interface RecipeCardProps {
  id: string;
  title: string;
  category: string;
  photoUrl: string | null;
  submitterName: string;
}

export function RecipeCard({ id, title, category, photoUrl, submitterName }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${id}`}>
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoUrl} alt={title} className="h-40 w-full object-cover" />
        ) : (
          <div className="flex h-40 w-full items-center justify-center bg-sidebar text-text-muted">
            No photo
          </div>
        )}
        <div className="p-4">
          <p className="font-medium text-text">{title}</p>
          <div className="mt-2 flex items-center gap-2">
            <Badge>{category}</Badge>
            <span className="text-xs text-text-muted">by {submitterName}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
