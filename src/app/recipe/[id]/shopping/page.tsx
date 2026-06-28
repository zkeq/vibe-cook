import { mockRecipe } from "@/lib/mock";
import { ShoppingClient } from "./shopping-client";

export default function ShoppingPage({ params }: { params: { id: string } }) {
  const recipe = mockRecipe;

  return <ShoppingClient recipe={recipe} />;
}
