import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function PendingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  // Only rejected accounts land here; pending ones browse the cookbook view-only.
  if (session.user.status !== "REJECTED") redirect("/recipes");

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ShieldLogo height={64} preload />
        </div>
        <h1 className="text-title-1-semibold text-text-primary">
          Access denied
        </h1>
        <p className="mt-2 text-body-regular text-text-secondary">
          Your account request was not approved. If you think this is a mistake, reach out to the admin.
        </p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <SubmitButton variant="secondary" className="w-full" pendingLabel="Signing out…">
            Sign out
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
