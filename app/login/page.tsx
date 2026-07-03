import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <h1 className="font-display text-3xl text-text">PDT Cookbook</h1>
        <p className="mt-2 text-sm text-text-muted">
          Sign in with your Google account to view the recipe collection.
        </p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/recipes" });
          }}
        >
          <Button type="submit" className="w-full">
            Sign in with Google
          </Button>
        </form>
      </Card>
    </div>
  );
}
