import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RecipeCard } from "@/components/recipes/RecipeCard";
import { FamilyTree } from "@/components/family/FamilyTree";
import { getFamilyMembers, getBigChain, getLittlesTree } from "@/lib/family";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateOwnProfile } from "./actions";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, favorites, members] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.favorite.findMany({
      where: { userId: session.user.id },
      include: { recipe: true },
      orderBy: { createdAt: "desc" },
    }),
    getFamilyMembers(),
  ]);

  const bigChain = getBigChain(user.id, members);
  const littles = getLittlesTree(user.id, members);

  return (
    <div>
      <h1 className="font-display text-2xl text-text">{user.name}</h1>
      <p className="text-sm text-text-muted">{user.email}</p>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg text-text">Profile details</h2>
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
          <Button type="submit">Save changes</Button>
        </form>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg text-text">Family</h2>
        <FamilyTree bigChain={bigChain} littles={littles} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-lg text-text">My favorites</h2>
        {favorites.length === 0 ? (
          <p className="text-sm text-text-muted">You haven&apos;t favorited any recipes yet.</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            {favorites.map(({ recipe }) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                category={recipe.category}
                photoUrl={recipe.photoUrl}
                submitterName={recipe.submitterName}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
