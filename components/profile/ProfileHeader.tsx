import { Badge } from "@/components/ui/card";
import { LevelBadge } from "@/components/level/LevelBadge";

interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatarUrl: string | null;
  pledgeClass: string | null;
  graduationYear: number | null;
  bondNumber: string | null;
  xp: number;
}

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  pledgeClass,
  graduationYear,
  bondNumber,
  xp,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-16 w-16 rounded-full border border-separator-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-separator-border bg-background-secondary-default text-title-2-semibold text-text-secondary">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="flex items-center gap-2 text-title-1-semibold text-text-primary">
          {name}
          <LevelBadge xp={xp} className="text-body-regular" />
        </h1>
        {email && <p className="text-body-regular text-text-secondary">{email}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {pledgeClass && <Badge>{pledgeClass}</Badge>}
          {graduationYear && <Badge>Class of {graduationYear}</Badge>}
          {bondNumber && <Badge>Bond #{bondNumber}</Badge>}
        </div>
      </div>
    </div>
  );
}
