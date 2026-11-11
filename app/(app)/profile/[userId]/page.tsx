import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { FamilyTree } from "@/components/family/FamilyTree";
import { LevelCard } from "@/components/profile/LevelCard";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { getFamilyMembers, getBigChain, getLittlesTree } from "@/lib/family";
import { getMemberProfile } from "@/lib/profile";

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const { userId } = await params;

  if (userId === session.user.id) redirect("/profile");

  const [profile, members] = await Promise.all([getMemberProfile(userId), getFamilyMembers()]);

  if (!profile) notFound();

  const { user, recipes, breakdown, badges } = profile;
  const bigChain = getBigChain(user.id, members);
  const littles = getLittlesTree(user.id, members);

  return (
    <div>
      <ProfileHeader
        name={user.name}
        avatarUrl={user.avatarUrl}
        pledgeClass={user.pledgeClass}
        graduationYear={user.graduationYear}
        bondNumber={user.bondNumber}
        familyName={user.family?.name}
        xp={user.xp}
      />

      <section className="mt-8">
        <LevelCard xp={user.xp} breakdown={breakdown} earnedBadges={badges} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-title-3-semibold text-text-primary">
          Recipes submitted {recipes.length > 0 && `(${recipes.length})`}
        </h2>
        {recipes.length === 0 ? (
          <p className="text-body-regular text-text-secondary">
            {user.name} hasn&apos;t had a recipe published yet.
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
              />
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-title-3-semibold text-text-primary">Family</h2>
        <FamilyTree bigChain={bigChain} littles={littles} familyName={user.family?.name} />
      </section>
    </div>
  );
}
