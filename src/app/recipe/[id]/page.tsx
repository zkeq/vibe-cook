import { mockRecipe, mockRecipeList } from "@/lib/mock";
import { DetailClient } from "./detail-client";

export function generateStaticParams() {
  return mockRecipeList.map((r) => ({ id: r.id }));
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 实际应用中这里应该从 API 获取数据
  // const recipe = await fetchRecipe(id);
  const recipe = mockRecipe;

  return <DetailClient recipe={recipe} />;
}
