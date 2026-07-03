import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const recipes = [
  {
    title: "Grandma's Sunday Roast Chicken",
    category: "Main Dishes",
    tags: ["dinner", "classic"],
    ingredients: "1 whole chicken\n2 tbsp butter, softened\nSalt and pepper\n1 lemon, halved\n4 sprigs rosemary\n2 cups baby potatoes",
    instructions: "Preheat oven to 425°F. Pat the chicken dry, rub with butter, salt, and pepper. Stuff the cavity with lemon and rosemary. Arrange potatoes around the chicken in a roasting pan. Roast for 60-75 minutes until the internal temperature reaches 165°F. Rest for 10 minutes before carving.",
    submitterName: "Chapter Founders",
  },
  {
    title: "Five-Minute Chocolate Mug Cake",
    category: "Desserts",
    tags: ["quick", "chocolate"],
    ingredients: "4 tbsp flour\n4 tbsp sugar\n2 tbsp cocoa powder\n1/4 tsp baking powder\nPinch of salt\n3 tbsp milk\n3 tbsp oil\nSplash of vanilla",
    instructions: "Whisk dry ingredients in a large mug. Add milk, oil, and vanilla; stir until smooth. Microwave for 90 seconds. Let cool slightly before eating straight from the mug.",
    submitterName: "Social Chair",
  },
  {
    title: "Study Night Trail Mix",
    category: "Snacks",
    tags: ["vegetarian", "no-bake"],
    ingredients: "1 cup pretzels\n1 cup mixed nuts\n1 cup dried cranberries\n1 cup chocolate chips\n1/2 cup pumpkin seeds",
    instructions: "Combine all ingredients in a large bowl. Store in an airtight container for up to two weeks.",
    submitterName: "Academic Chair",
  },
  {
    title: "Big/Little Reveal Brunch Casserole",
    category: "Breakfast",
    tags: ["make-ahead", "brunch"],
    ingredients: "8 eggs\n1 cup milk\n1 lb breakfast sausage, cooked\n2 cups shredded cheddar\n6 cups cubed bread\nSalt and pepper",
    instructions: "Whisk eggs and milk together. Layer bread, sausage, and cheese in a greased 9x13 dish. Pour egg mixture over the top and press down gently. Refrigerate overnight. Bake at 350°F for 45 minutes until set and golden.",
    submitterName: "New Member Educator",
  },
];

async function main() {
  for (const recipe of recipes) {
    const existing = await prisma.recipe.findFirst({ where: { title: recipe.title } });
    if (existing) continue;
    await prisma.recipe.create({
      data: { ...recipe, status: "PUBLISHED" },
    });
  }
  console.log(`Seeded ${recipes.length} sample recipes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
