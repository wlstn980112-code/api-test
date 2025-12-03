"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import {
  parseNutritionInfo,
  getCookingSteps,
  parseHashTags,
  parseIngredients,
  type RecipeItem,
  type NutritionInfo,
} from "@/services/mfdsRecipeApi";
import NutritionCharts from "@/components/NutritionCharts";

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const recipeId = params.recipeId as string;

  const [recipe, setRecipe] = useState<RecipeItem | null>(null);
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);
  const [cookingSteps, setCookingSteps] = useState<
    Array<{ step: number; description: string; imageUrl: string }>
  >([]);
  const [hashTags, setHashTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecipeDetail() {
      try {
        console.log("[상세 페이지] 레시피 상세 정보 로딩 시작:", recipeId);
        setLoading(true);
        setError(null);

        // Next.js API 라우트를 통해 서버 사이드에서 데이터 가져오기
        // 레시피 ID를 기반으로 해당 레시피를 찾기 위해 충분한 범위의 데이터를 가져옵니다
        const response = await fetch(
          "/api/recipes?start=1&end=500&maxRecipes=500"
        );

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();

        console.log("[상세 페이지] API 응답:", {
          success: data.success,
          recipesCount: data.recipes?.length,
        });

        if (!data.success) {
          throw new Error(
            data.error || "레시피를 불러오는 중 오류가 발생했습니다."
          );
        }

        if (!data.recipes || data.recipes.length === 0) {
          throw new Error("레시피 데이터가 없습니다.");
        }

        console.log("[상세 페이지] 받은 레시피 수:", data.recipes.length);
        console.log(
          "[상세 페이지] 찾는 레시피 ID:",
          recipeId,
          "타입:",
          typeof recipeId
        );
        console.log(
          "[상세 페이지] 첫 번째 레시피 ID:",
          data.recipes[0]?.RCP_SEQ,
          "타입:",
          typeof data.recipes[0]?.RCP_SEQ
        );
        console.log(
          "[상세 페이지] 첫 5개 레시피 ID:",
          data.recipes.slice(0, 5).map((r: RecipeItem) => r.RCP_SEQ)
        );

        // 레시피 ID로 해당 레시피 찾기 (문자열 비교)
        const foundRecipe = data.recipes.find(
          (r: RecipeItem) => String(r.RCP_SEQ) === String(recipeId)
        );

        if (!foundRecipe) {
          console.error("[상세 페이지] 레시피를 찾을 수 없음:", recipeId);
          setError("레시피를 찾을 수 없습니다.");
          return;
        }

        console.log("[상세 페이지] 레시피 찾음:", foundRecipe.RCP_NM);
        setRecipe(foundRecipe);

        const nutritionInfo = parseNutritionInfo(foundRecipe);
        setNutrition(nutritionInfo);

        const steps = getCookingSteps(foundRecipe);
        setCookingSteps(steps);

        const tags = parseHashTags(foundRecipe);
        setHashTags(tags);

        const ingList = parseIngredients(foundRecipe);
        setIngredients(ingList);

        console.log("[상세 페이지] 레시피 상세 정보 로딩 완료");
        console.log("[상세 페이지] 조리 과정 데이터:", steps);
        console.log("[상세 페이지] 조리 과정 개수:", steps.length);
        console.log("[상세 페이지] 해시태그:", tags);
        console.log("[상세 페이지] 재료 개수:", ingList.length);
      } catch (err) {
        console.error("[상세 페이지] 레시피 로딩 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "레시피를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    if (recipeId) {
      fetchRecipeDetail();
    }
  }, [recipeId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">레시피 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">오류가 발생했습니다</p>
          <p className="text-gray-600 mb-4">
            {error || "레시피를 찾을 수 없습니다."}
          </p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push("/")}
            className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
          >
            ← 목록으로 돌아가기
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{recipe.RCP_NM}</h1>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 기본 정보 */}
        <section className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                레시피 정보
              </h2>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-medium">조리 방법:</span>{" "}
                  {recipe.RCP_WAY2 || "정보 없음"}
                </p>
                <p>
                  <span className="font-medium">요리 종류:</span>{" "}
                  {recipe.RCP_PAT2 || "정보 없음"}
                </p>
                <div>
                  <span className="font-medium">재료:</span>
                  {ingredients.length > 0 ? (
                    <ul className="mt-2 space-y-1 list-disc list-inside">
                      {ingredients.map((ingredient, idx) => (
                        <li key={idx} className="text-gray-700">
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="ml-2">
                      {recipe.RCP_PARTS_DTLS || "정보 없음"}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                영양 정보
              </h2>
              <div className="space-y-2 text-gray-700">
                <p>
                  <span className="font-medium">칼로리:</span>{" "}
                  {nutrition?.calories.toFixed(0) || 0} kcal
                </p>
                <p>
                  <span className="font-medium">탄수화물:</span>{" "}
                  {nutrition?.carbohydrate.toFixed(1) || 0} g
                </p>
                <p>
                  <span className="font-medium">단백질:</span>{" "}
                  {nutrition?.protein.toFixed(1) || 0} g
                </p>
                <p>
                  <span className="font-medium">지방:</span>{" "}
                  {nutrition?.fat.toFixed(1) || 0} g
                </p>
                <p>
                  <span className="font-medium">나트륨:</span>{" "}
                  {nutrition?.sodium.toFixed(1) || 0} mg
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 해시태그 */}
        {hashTags.length > 0 && (
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              해시태그
            </h2>
            <div className="flex flex-wrap gap-2">
              {hashTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* 영양 성분 시각화 */}
        {nutrition && (
          <section className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              영양 성분 시각화
            </h2>
            <NutritionCharts nutrition={nutrition} />
          </section>
        )}

        {/* 조리 과정 */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            조리 과정
          </h2>
          <div className="space-y-8">
            {cookingSteps.length > 0 ? (
              cookingSteps.map((step) => {
                console.log("[상세 페이지] 조리 과정 렌더링:", step);
                return (
                  <div
                    key={step.step}
                    className="border-l-4 border-blue-500 pl-6"
                  >
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
                          {step.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-gray-700 mb-4 leading-relaxed">
                          {step.description}
                        </p>
                        {step.imageUrl && (
                          <div className="relative w-full max-w-md h-64 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={step.imageUrl}
                              alt={`${recipe.RCP_NM} - 조리 과정 ${step.step}`}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-600">조리 과정 정보가 없습니다.</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
