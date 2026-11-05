import { signIn } from "@/auth";
import { ShieldLogo } from "@/components/brand/ShieldLogo";
import { Card } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center px-4">
      <Card className="w-full max-w-sm p-8 text-center">
        <div className="mb-4 flex justify-center">
          <ShieldLogo height={72} preload />
        </div>
        <h1 className="text-title-1-semibold text-text-primary">PDT Cookbook</h1>
        <p className="mt-2 text-body-regular text-text-secondary">
          Sign in with your Google account to view the recipe collection.
        </p>
        <form
          className="mt-6"
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/recipes" });
          }}
        >
          <SubmitButton className="w-full" pendingLabel="Taking you to Google…">
            Sign in with Google
          </SubmitButton>
        </form>
      </Card>
    </div>
  );
}
