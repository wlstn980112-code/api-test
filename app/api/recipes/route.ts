import { NextResponse } from 'next/server';
import { getMfdsRecipeList, parseNutritionInfo, type RecipeItem } from '@/services/mfdsRecipeApi';

// 이 라우트는 항상 동적으로 렌더링되어야 함 (쿼리 파라미터 사용)
export const dynamic = 'force-dynamic';

/**
 * GET /api/recipes
 * 레시피 목록을 가져오는 API 엔드포인트
 */
export async function GET(request: Request) {
  try {
    console.log('[API 라우트] 레시피 목록 요청 시작');
    
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '1', 10);
    const end = parseInt(searchParams.get('end') || '100', 10);
    const maxRecipes = parseInt(searchParams.get('maxRecipes') || '500', 10);

    console.log('[API 라우트] 요청 파라미터:', { start, end, maxRecipes });

    const batchSize = 100;
    let recipeList: RecipeItem[] = [];
    
    // 여러 배치로 나누어 순차적으로 요청
    for (let batchStart = start; batchStart <= Math.min(end, maxRecipes); batchStart += batchSize) {
      const batchEnd = Math.min(batchStart + batchSize - 1, Math.min(end, maxRecipes));
      console.log(`[API 라우트] 배치 요청: ${batchStart} ~ ${batchEnd}`);
      
      try {
        const batch = await getMfdsRecipeList(batchStart, batchEnd);
        recipeList = [...recipeList, ...batch];
        
        // 배치 결과가 비어있으면 더 이상 데이터가 없음
        if (batch.length === 0) {
          console.log(`[API 라우트] ${batchStart}번째부터 데이터가 없어 요청 중단`);
          break;
        }
      } catch (err) {
        console.error(`[API 라우트] 배치 ${batchStart}-${batchEnd} 요청 실패:`, err);
        // 일부 배치 실패해도 계속 진행
        break;
      }
    }
    
    console.log('[API 라우트] 레시피 목록 로딩 완료:', recipeList.length, '개');

    // 차트 데이터 생성
    const chartData = recipeList.map((recipe) => {
      const nutrition = parseNutritionInfo(recipe);
      return {
        name: recipe.RCP_NM.length > 15 ? recipe.RCP_NM.substring(0, 15) + '...' : recipe.RCP_NM,
        칼로리: nutrition.calories,
      };
    });

    return NextResponse.json({
      success: true,
      recipes: recipeList,
      chartData,
      totalCount: recipeList.length,
    });
  } catch (error) {
    console.error('[API 라우트] 레시피 로딩 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '레시피를 불러오는 중 오류가 발생했습니다.',
        recipes: [],
        chartData: [],
        totalCount: 0,
      },
      { status: 500 }
    );
  }
}

