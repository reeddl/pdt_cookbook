import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default async function PendingPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status === "APPROVED") redirect("/recipes");

  const rejected = session.user.status === "REJECTED";

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <h1 className="font-display text-2xl text-text">
          {rejected ? "Access denied" : "Awaiting approval"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
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
          <Button type="submit" variant="secondary" className="w-full">
            Sign out
          </Button>
        </form>
      </Card>
    </div>
  );
}
