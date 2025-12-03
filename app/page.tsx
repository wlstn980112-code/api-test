"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  parseNutritionInfo,
  parseHashTags,
  parseIngredients,
  type RecipeItem,
} from "@/services/mfdsRecipeApi";
import BarChartComponent from "@/components/BarChartComponent";

interface ChartData {
  name: string;
  칼로리: number;
}

type SortOption = "name" | "calories-asc" | "calories-desc";

export default function Home() {
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터 및 검색 상태
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCookingMethod, setSelectedCookingMethod] =
    useState<string>("all");
  const [sortOption, setSortOption] = useState<SortOption>("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHashTag, setSelectedHashTag] = useState<string>("");
  const itemsPerPage = 16;

  useEffect(() => {
    async function fetchRecipes() {
      try {
        console.log("[메인 페이지] 레시피 목록 로딩 시작");
        setLoading(true);
        setError(null);

        // Next.js API 라우트를 통해 서버 사이드에서 데이터 가져오기
        const response = await fetch(
          "/api/recipes?start=1&end=500&maxRecipes=500"
        );

        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(
            data.error || "레시피를 불러오는 중 오류가 발생했습니다."
          );
        }

        console.log(
          "[메인 페이지] 레시피 목록 로딩 완료:",
          data.recipes.length,
          "개"
        );
        console.log(
          "[메인 페이지] 차트 데이터 생성 완료:",
          data.chartData.length,
          "개"
        );

        setRecipes(data.recipes);
        setChartData(data.chartData);
      } catch (err) {
        console.error("[메인 페이지] 레시피 로딩 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "레시피를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchRecipes();
  }, []);

  // 카테고리 및 조리 방법 목록 추출
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.RCP_PAT2 && recipe.RCP_PAT2.trim()) {
        categorySet.add(recipe.RCP_PAT2.trim());
      }
    });
    return Array.from(categorySet).sort();
  }, [recipes]);

  const cookingMethods = useMemo(() => {
    const methodSet = new Set<string>();
    recipes.forEach((recipe) => {
      if (recipe.RCP_WAY2 && recipe.RCP_WAY2.trim()) {
        methodSet.add(recipe.RCP_WAY2.trim());
      }
    });
    return Array.from(methodSet).sort();
  }, [recipes]);

  // 모든 해시태그 추출
  const allHashTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((recipe) => {
      const tags = parseHashTags(recipe);
      tags.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [recipes]);

  // 필터링 및 정렬된 레시피 목록
  const filteredAndSortedRecipes = useMemo(() => {
    let filtered = recipes.filter((recipe) => {
      // 검색어 필터
      const matchesSearch =
        searchQuery === "" ||
        recipe.RCP_NM.toLowerCase().includes(searchQuery.toLowerCase());

      // 카테고리 필터
      const matchesCategory =
        selectedCategory === "all" ||
        recipe.RCP_PAT2?.trim() === selectedCategory;

      // 조리 방법 필터
      const matchesMethod =
        selectedCookingMethod === "all" ||
        recipe.RCP_WAY2?.trim() === selectedCookingMethod;

      // 해시태그 필터
      const matchesHashTag =
        selectedHashTag === "" ||
        parseHashTags(recipe).includes(selectedHashTag);

      return (
        matchesSearch && matchesCategory && matchesMethod && matchesHashTag
      );
    });

    // 정렬
    filtered.sort((a, b) => {
      const nutritionA = parseNutritionInfo(a);
      const nutritionB = parseNutritionInfo(b);

      switch (sortOption) {
        case "name":
          return a.RCP_NM.localeCompare(b.RCP_NM, "ko");
        case "calories-asc":
          return nutritionA.calories - nutritionB.calories;
        case "calories-desc":
          return nutritionB.calories - nutritionA.calories;
        default:
          return 0;
      }
    });

    return filtered;
  }, [
    recipes,
    searchQuery,
    selectedCategory,
    selectedCookingMethod,
    selectedHashTag,
    sortOption,
  ]);

  // 페이지네이션
  const totalPages = Math.ceil(filteredAndSortedRecipes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRecipes = filteredAndSortedRecipes.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // 필터 변경 시 첫 페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchQuery,
    selectedCategory,
    selectedCookingMethod,
    selectedHashTag,
    sortOption,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">레시피를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">오류가 발생했습니다</p>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">식약처 레시피</h1>
          <p className="text-gray-600 mt-2">
            음식 레시피 및 영양 정보를 확인하세요
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 차트 섹션 */}
        <section className="mb-12 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            레시피별 칼로리 분포{" "}
            {chartData.length > 0 && `(총 ${chartData.length}개)`}
          </h2>
          {chartData.length > 0 ? (
            <BarChartComponent data={chartData} />
          ) : (
            <div className="h-[400px] flex items-center justify-center">
              <p className="text-gray-500">차트 데이터를 불러오는 중...</p>
            </div>
          )}
        </section>

        {/* 레시피 목록 */}
        <section>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <h2 className="text-2xl font-semibold text-gray-900">
              레시피 목록
              <span className="text-lg font-normal text-gray-600 ml-2">
                ({filteredAndSortedRecipes.length}개)
              </span>
            </h2>
          </div>

          {/* 필터 및 검색 영역 */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* 검색 */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  레시피 검색
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="레시피 이름으로 검색..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 카테고리 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  요리 종류
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* 조리 방법 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  조리 방법
                </label>
                <select
                  value={selectedCookingMethod}
                  onChange={(e) => setSelectedCookingMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">전체</option>
                  {cookingMethods.map((method) => (
                    <option key={method} value={method}>
                      {method}
                    </option>
                  ))}
                </select>
              </div>

              {/* 해시태그 필터 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  해시태그
                </label>
                <select
                  value={selectedHashTag}
                  onChange={(e) => setSelectedHashTag(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">전체</option>
                  {allHashTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 정렬 옵션 */}
            <div className="mt-4 flex items-center gap-4">
              <label className="text-sm font-medium text-gray-700">정렬:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSortOption("name")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOption === "name"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  이름순
                </button>
                <button
                  onClick={() => setSortOption("calories-asc")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOption === "calories-asc"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  칼로리 낮은순
                </button>
                <button
                  onClick={() => setSortOption("calories-desc")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    sortOption === "calories-desc"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  칼로리 높은순
                </button>
              </div>
            </div>
          </div>

          {/* 레시피 그리드 */}
          {paginatedRecipes.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedRecipes.map((recipe) => {
                  const nutrition = parseNutritionInfo(recipe);
                  const hashTags = parseHashTags(recipe);
                  const mainImage =
                    recipe.ATT_FILE_NO_MAIN || recipe.ATT_FILE_NO_MK || "";
                  const firstStepImage = recipe.MANUAL_IMG01 || "";

                  return (
                    <Link
                      key={recipe.RCP_SEQ}
                      href={`/recipes/${recipe.RCP_SEQ}`}
                      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
                    >
                      <div className="relative h-48 w-full bg-gray-200">
                        {mainImage ? (
                          <Image
                            src={mainImage}
                            alt={recipe.RCP_NM}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : firstStepImage ? (
                          <Image
                            src={firstStepImage}
                            alt={recipe.RCP_NM}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            이미지 없음
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {recipe.RCP_NM}
                        </h3>
                        {/* 해시태그 표시 */}
                        {hashTags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {hashTags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedHashTag(tag);
                                }}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded cursor-pointer hover:bg-blue-200 transition-colors"
                              >
                                {tag}
                              </span>
                            ))}
                            {hashTags.length > 3 && (
                              <span className="text-xs text-gray-500 px-2 py-1">
                                +{hashTags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="font-medium">칼로리:</span>
                          <span className="ml-2 text-blue-600 font-semibold">
                            {nutrition.calories.toFixed(0)} kcal
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center items-center gap-2">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    이전
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === pageNum
                              ? "bg-blue-600 text-white"
                              : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                    }
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === totalPages
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                    }`}
                  >
                    다음
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">
                검색 조건에 맞는 레시피가 없습니다.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setSelectedCookingMethod("all");
                  setSelectedHashTag("");
                }}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                필터 초기화
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
