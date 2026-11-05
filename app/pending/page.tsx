import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function PendingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status === "APPROVED") redirect("/recipes");

  const rejected = session.user.status === "REJECTED";

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ShieldLogo height={64} preload />
        </div>
        <h1 className="text-title-1-semibold text-text-primary">
          {rejected ? "Access denied" : "Awaiting approval"}
        </h1>
        <p className="mt-2 text-body-regular text-text-secondary">
          {rejected
            ? "Your account request was not approved. If you think this is a mistake, reach out to the admin."
            : "Thanks for signing in! An admin needs to approve your account before you can browse recipes. Check back soon."}
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
