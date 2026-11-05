import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { FamilyTree } from "@/components/family/FamilyTree";
import { FoodieScoreCard } from "@/components/profile/FoodieScoreCard";
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

  const { user, recipes, parts, score } = profile;
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
      />

      <section className="mt-8">
        <FoodieScoreCard score={score} parts={parts} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg text-text">
          Recipes submitted {recipes.length > 0 && `(${recipes.length})`}
        </h2>
        {recipes.length === 0 ? (
          <p className="text-sm text-text-muted">
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
        <h2 className="mb-4 font-display text-lg text-text">Family</h2>
        <FamilyTree bigChain={bigChain} littles={littles} />
      </section>
    </div>
  );
}
