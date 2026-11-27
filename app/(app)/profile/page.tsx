import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { FamilyTree } from "@/components/family/FamilyTree";
import { RejectedRecipes } from "@/components/recipes/RejectedRecipes";
import { LevelCard } from "@/components/profile/LevelCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileDetails } from "@/components/profile/ProfileDetails";
import { getFamilies, getFamilyMembers, getBigChain, getLittlesTree } from "@/lib/family";
import { getMemberProfile } from "@/lib/profile";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ resubmitted?: string }>;
}) {
  const { resubmitted } = await searchParams;
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.status !== "APPROVED") redirect("/recipes");

  const [profile, members, families] = await Promise.all([
    getMemberProfile(session.user.id, { includeUnpublished: true }),
    getFamilyMembers(),
    getFamilies(),
  ]);

  if (!profile) notFound();

  const { user, breakdown, badges } = profile;
  // Rejected recipes get their own "sent back" section, so they're not repeated below.
  const rejected = profile.recipes.filter((r) => r.status === "REJECTED");
  const recipes = profile.recipes.filter((r) => r.status !== "REJECTED");
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
        familyName={user.family?.name}
        xp={user.xp}
      />

      {resubmitted && (
        <div className="mt-6 rounded-3xl bg-status-lime-background p-4 text-body-regular text-status-lime-text">
          Resubmitted — your recipe is back in the review queue.
        </div>
      )}
      <RejectedRecipes recipes={rejected} />

      <section className="mt-8">
        <LevelCard xp={user.xp} breakdown={breakdown} earnedBadges={badges} />
      </section>

      <ProfileDetails
        name={user.name}
        bondNumber={user.bondNumber}
        pledgeClass={user.pledgeClass}
        graduationYear={user.graduationYear}
        family={user.family}
        families={families}
      />

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
        <FamilyTree bigChain={bigChain} littles={littles} familyName={user.family?.name} />
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
