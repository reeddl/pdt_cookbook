import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { FamilyTree } from "@/components/family/FamilyTree";
import { LevelCard } from "@/components/profile/LevelCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { getFamilyMembers, getBigChain, getLittlesTree } from "@/lib/family";
import { getMemberProfile } from "@/lib/profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateOwnProfile } from "./actions";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [profile, members] = await Promise.all([
    getMemberProfile(session.user.id, { includeUnpublished: true }),
    getFamilyMembers(),
  ]);

  if (!profile) notFound();

  const { user, recipes, breakdown, badges } = profile;
  const bigChain = getBigChain(user.id, members);
  const littles = getLittlesTree(user.id, members);

  return (
    <div>
      <ProfileHeader
        name={user.name}
        email={user.email}
        avatarUrl={user.avatarUrl}
        pledgeClass={user.pledgeClass}
        graduationYear={user.graduationYear}
        bondNumber={user.bondNumber}
        xp={user.xp}
      />

      <section className="mt-8">
        <LevelCard xp={user.xp} breakdown={breakdown} earnedBadges={badges} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-title-3-semibold text-text-primary">Profile details</h2>
        <form action={updateOwnProfile} className="max-w-md space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required defaultValue={user.name} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bondNumber">Bond number</Label>
              <Input id="bondNumber" name="bondNumber" defaultValue={user.bondNumber ?? ""} />
            </div>
            <div>
              <Label htmlFor="pledgeClass">Pledge class</Label>
              <Input id="pledgeClass" name="pledgeClass" defaultValue={user.pledgeClass ?? ""} />
            </div>
          </div>
          <div>
            <Label htmlFor="graduationYear">Graduation year</Label>
            <Input
              id="graduationYear"
              name="graduationYear"
              type="number"
              defaultValue={user.graduationYear ?? ""}
            />
          </div>
          <SubmitButton pendingLabel="Saving…">Save changes</SubmitButton>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-title-3-semibold text-text-primary">
          Recipes submitted {recipes.length > 0 && `(${recipes.length})`}
        </h2>
        {recipes.length === 0 ? (
          <p className="text-body-regular text-text-secondary">
            You haven&apos;t submitted a recipe yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                photoUrl={recipe.photoUrl}
                submitterName={recipe.submitterName}
                submittedById={recipe.submittedById}
                status={recipe.status}
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-title-3-semibold text-text-primary">Family</h2>
        <FamilyTree bigChain={bigChain} littles={littles} />
      </section>

      <p className="mt-10 text-body-regular text-text-secondary">
        Looking for recipes you&apos;ve liked?{" "}
        <Link href="/likes" className="text-button-ghost-foreground underline">
          See your liked recipes
        </Link>
        .
      </p>
    </div>
  );
}
