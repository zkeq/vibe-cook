import { mockRecipe } from "@/lib/mock";
import { CookClient } from "./cook-client";

export default async function CookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = mockRecipe;

  return <CookClient recipe={recipe} />;
}
