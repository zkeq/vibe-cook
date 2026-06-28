"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRecipeStore } from "@/store/recipe-store";
import { CookClient } from "./cook-client";

export default function CookPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentRecipe, fetchRecipeById, isLoading } = useRecipeStore();

  useEffect(() => {
    if (!currentRecipe || currentRecipe.id !== id) {
      fetchRecipeById(id);
    }
  }, [id, currentRecipe, fetchRecipeById]);

  if (isLoading || !currentRecipe) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">准备烹饪中...</p>
        </div>
      </div>
    );
  }

  return <CookClient recipe={currentRecipe} />;
}
