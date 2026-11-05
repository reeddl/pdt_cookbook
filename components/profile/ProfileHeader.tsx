import { Badge } from "@/components/ui/card";

interface ProfileHeaderProps {
  name: string;
  email?: string;
  avatarUrl: string | null;
  pledgeClass: string | null;
  graduationYear: number | null;
  bondNumber: string | null;
}

export function ProfileHeader({
  name,
  email,
  avatarUrl,
  pledgeClass,
  graduationYear,
  bondNumber,
}: ProfileHeaderProps) {
  return (
    <div className="flex items-center gap-4">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl}
          alt=""
          className="h-16 w-16 rounded-full border border-border object-cover"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-sidebar font-display text-xl text-text-muted">
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl text-text">{name}</h1>
        {email && <p className="text-sm text-text-muted">{email}</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {pledgeClass && <Badge>{pledgeClass}</Badge>}
          {graduationYear && <Badge>Class of {graduationYear}</Badge>}
          {bondNumber && <Badge>Bond #{bondNumber}</Badge>}
        </div>
      </div>
    </div>
  );
}
