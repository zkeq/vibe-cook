"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useRecipeStore } from "@/store/recipe-store";
import { ShoppingClient } from "./shopping-client";

export default function ShoppingPage() {
  const params = useParams();
  const id = params.id as string;
  const { currentRecipe, fetchRecipeById, isLoading } = useRecipeStore();

  useEffect(() => {
    fetchRecipeById(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (isLoading || !currentRecipe) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <ShoppingClient recipe={currentRecipe} />;
}
