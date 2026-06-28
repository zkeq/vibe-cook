"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRecipeStore } from "@/store/recipe-store";
import { DetailClient } from "./detail-client";

export default function RecipeDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentRecipe, fetchRecipeById, isLoading, error } = useRecipeStore();

  useEffect(() => {
    // 如果当前没有菜谱或 ID 不匹配，重新获取
    if (!currentRecipe || currentRecipe.id !== id) {
      fetchRecipeById(id);
    }
  }, [id, currentRecipe, fetchRecipeById]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-sm text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchRecipeById(id)}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!currentRecipe) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground">菜谱不存在</p>
      </div>
    );
  }

  return <DetailClient recipe={currentRecipe} />;
}
