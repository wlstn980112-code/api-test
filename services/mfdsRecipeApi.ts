/**
 * 식약처 레시피 API 서비스 모듈
 * 레시피 목록 및 상세 정보를 가져오는 함수들을 제공합니다.
 */

const API_KEY = process.env.NEXT_PUBLIC_MFDS_API_KEY;
const BASE_URL = process.env.NEXT_PUBLIC_MFDS_BASE_URL;
const SERVICE_ID = "COOKRCP01";

export interface RecipeItem {
  RCP_NM: string; // 레시피 이름
  RCP_SEQ: string; // 레시피 번호
  INFO_ENG: string; // 칼로리
  ATT_FILE_NO_MAIN: string; // 대표 이미지
  ATT_FILE_NO_MK: string; // 조리법 이미지
  RCP_PARTS_DTLS: string; // 재료 정보
  RCP_WAY2: string; // 조리 방법
  RCP_PAT2: string; // 요리 종류
  RCP_WAY?: string; // 조리 방법 코드
  RCP_PAT?: string; // 요리 종류 코드
  HASH_TAG?: string; // 해시태그
  MANUAL01: string; // 조리법 01
  MANUAL02: string;
  MANUAL03: string;
  MANUAL04: string;
  MANUAL05: string;
  MANUAL06: string;
  MANUAL07: string;
  MANUAL08: string;
  MANUAL09: string;
  MANUAL10: string;
  MANUAL11: string;
  MANUAL12: string;
  MANUAL13: string;
  MANUAL14: string;
  MANUAL15: string;
  MANUAL16: string;
  MANUAL17: string;
  MANUAL18: string;
  MANUAL19: string;
  MANUAL20: string;
  MANUAL_IMG01: string; // 조리법 이미지 01
  MANUAL_IMG02: string;
  MANUAL_IMG03: string;
  MANUAL_IMG04: string;
  MANUAL_IMG05: string;
  MANUAL_IMG06: string;
  MANUAL_IMG07: string;
  MANUAL_IMG08: string;
  MANUAL_IMG09: string;
  MANUAL_IMG10: string;
  MANUAL_IMG11: string;
  MANUAL_IMG12: string;
  MANUAL_IMG13: string;
  MANUAL_IMG14: string;
  MANUAL_IMG15: string;
  MANUAL_IMG16: string;
  MANUAL_IMG17: string;
  MANUAL_IMG18: string;
  MANUAL_IMG19: string;
  MANUAL_IMG20: string;
  INFO_CAR: string; // 탄수화물
  INFO_PRO: string; // 단백질
  INFO_FAT: string; // 지방
  INFO_NA: string; // 나트륨
  [key: string]: string | undefined; // 인덱스 시그니처
}

export interface RecipeApiResponse {
  COOKRCP01: {
    total_count: string;
    row: RecipeItem[];
  };
}

export interface NutritionInfo {
  calories: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  sodium: number;
}

/**
 * 식약처 레시피 목록을 가져옵니다.
 * @param start 시작 번호 (1부터 시작)
 * @param end 종료 번호
 * @returns 레시피 목록 배열
 */
export async function getMfdsRecipeList(
  start: number = 1,
  end: number = 10
): Promise<RecipeItem[]> {
  if (!API_KEY || !BASE_URL) {
    console.error("[MFDS API] 환경 변수가 설정되지 않았습니다.");
    throw new Error("API 키 또는 Base URL이 설정되지 않았습니다.");
  }

  const url = `${BASE_URL}/${API_KEY}/${SERVICE_ID}/json/${start}/${end}`;

  console.log("[MFDS API] 레시피 목록 요청:", { start, end, url });

  try {
    const response = await fetch(url, {
      cache: "no-store", // 실시간 데이터를 위해 캐시 비활성화
    });

    if (!response.ok) {
      console.error(
        "[MFDS API] 응답 오류:",
        response.status,
        response.statusText
      );
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data: RecipeApiResponse = await response.json();

    console.log("[MFDS API] 응답 데이터:", {
      totalCount: data.COOKRCP01?.total_count,
      recipeCount: data.COOKRCP01?.row?.length || 0,
    });

    if (!data.COOKRCP01 || !data.COOKRCP01.row) {
      console.warn("[MFDS API] 예상하지 못한 데이터 구조:", data);
      return [];
    }

    return data.COOKRCP01.row;
  } catch (error) {
    console.error("[MFDS API] 레시피 목록 가져오기 실패:", error);
    throw error;
  }
}

/**
 * 레시피의 영양 성분 정보를 파싱하여 반환합니다.
 * @param recipe 레시피 아이템
 * @returns 영양 성분 정보 객체
 */
export function parseNutritionInfo(recipe: RecipeItem): NutritionInfo {
  console.log("[영양 성분 파싱] 레시피:", recipe.RCP_NM);

  const parseNumber = (value: string | undefined): number => {
    if (!value || value.trim() === "") return 0;
    const num = parseFloat(value.replace(/[^0-9.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  const nutrition: NutritionInfo = {
    calories: parseNumber(recipe.INFO_ENG),
    carbohydrate: parseNumber(recipe.INFO_CAR),
    protein: parseNumber(recipe.INFO_PRO),
    fat: parseNumber(recipe.INFO_FAT),
    sodium: parseNumber(recipe.INFO_NA),
  };

  console.log("[영양 성분 파싱] 결과:", nutrition);

  return nutrition;
}

/**
 * 레시피의 조리 과정 단계를 배열로 반환합니다.
 * @param recipe 레시피 아이템
 * @returns 조리 과정 배열 (설명, 이미지 URL)
 */
export function getCookingSteps(recipe: RecipeItem): Array<{
  step: number;
  description: string;
  imageUrl: string;
}> {
  const steps: Array<{ step: number; description: string; imageUrl: string }> =
    [];

  for (let i = 1; i <= 20; i++) {
    const manualKey = `MANUAL${String(i).padStart(2, "0")}` as keyof RecipeItem;
    const imageKey = `MANUAL_IMG${String(i).padStart(
      2,
      "0"
    )}` as keyof RecipeItem;

    let description = recipe[manualKey]?.trim() || "";
    const imageUrl = recipe[imageKey]?.trim() || "";

    // 설명 끝에 있는 단일 영어 문자 제거 (예: "설명.a" -> "설명.")
    description = description.replace(/\s*[a-zA-Z]\s*$/, "").trim();

    if (description || imageUrl) {
      steps.push({
        step: i,
        description,
        imageUrl,
      });
    }
  }

  console.log("[조리 과정] 단계 수:", steps.length);
  return steps;
}

/**
 * 레시피의 해시태그를 파싱하여 배열로 반환합니다.
 * @param recipe 레시피 아이템
 * @returns 해시태그 배열
 */
export function parseHashTags(recipe: RecipeItem): string[] {
  if (!recipe.HASH_TAG || recipe.HASH_TAG.trim() === "") {
    return [];
  }

  console.log(
    "[해시태그 파싱] 레시피:",
    recipe.RCP_NM,
    "해시태그 원본:",
    recipe.HASH_TAG
  );

  // 해시태그를 쉼표, 공백, #으로 분리하고 정리
  const tags = recipe.HASH_TAG.split(/[,\s#]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`)); // #이 없으면 추가

  console.log("[해시태그 파싱] 결과:", tags);
  return tags;
}

/**
 * 재료 정보를 파싱하여 배열로 반환합니다.
 * @param recipe 레시피 아이템
 * @returns 재료 배열
 */
export function parseIngredients(recipe: RecipeItem): string[] {
  if (!recipe.RCP_PARTS_DTLS || recipe.RCP_PARTS_DTLS.trim() === "") {
    return [];
  }

  console.log(
    "[재료 파싱] 레시피:",
    recipe.RCP_NM,
    "재료 원본:",
    recipe.RCP_PARTS_DTLS
  );

  // 재료를 쉼표, 줄바꿈, 공백으로 분리
  const ingredients = recipe.RCP_PARTS_DTLS.split(/[,\n\r]+/)
    .map((ingredient) => ingredient.trim())
    .filter((ingredient) => ingredient.length > 0);

  console.log("[재료 파싱] 결과:", ingredients.length, "개");
  return ingredients;
}
