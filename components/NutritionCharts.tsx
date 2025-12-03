"use client";

import { useEffect, useState } from "react";

interface NutritionInfo {
  calories: number;
  carbohydrate: number;
  protein: number;
  fat: number;
  sodium: number;
}

interface NutritionChartsProps {
  nutrition: NutritionInfo;
}

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function NutritionCharts({ nutrition }: NutritionChartsProps) {
  // 모든 hooks를 최상단에 선언 (React Hooks 규칙 준수)
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import("recharts").then((mod) => {
      console.log("[NutritionCharts] Recharts 로드 완료");
      setRecharts(mod);
    });
  }, []);

  // 조건부 return은 hooks 호출 이후에
  if (!isClient || !Recharts) {
    return (
      <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">영양 차트를 준비하는 중...</p>
      </div>
    );
  }

  // 영양 성분 차트 데이터 (도넛 차트용)
  const pieChartData = [
    { name: "탄수화물", value: nutrition?.carbohydrate || 0 },
    { name: "단백질", value: nutrition?.protein || 0 },
    { name: "지방", value: nutrition?.fat || 0 },
  ].filter((item) => item.value > 0);

  // 레이더 차트 데이터
  const radarChartData = [
    {
      subject: "칼로리",
      value: Math.min((nutrition?.calories || 0) / 10, 100), // 0-100 스케일로 정규화
      fullMark: 100,
    },
    {
      subject: "탄수화물",
      value: Math.min((nutrition?.carbohydrate || 0) * 2, 100),
      fullMark: 100,
    },
    {
      subject: "단백질",
      value: Math.min((nutrition?.protein || 0) * 5, 100),
      fullMark: 100,
    },
    {
      subject: "지방",
      value: Math.min((nutrition?.fat || 0) * 5, 100),
      fullMark: 100,
    },
    {
      subject: "나트륨",
      value: Math.min((nutrition?.sodium || 0) / 10, 100),
      fullMark: 100,
    },
  ];

  const {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Legend,
    Tooltip,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar,
  } = Recharts;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* 도넛 차트 */}
      {pieChartData.length > 0 ? (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            주요 영양 성분 비율
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(1)} g`,
                  "영양 성분",
                ]}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-lg">
          <p className="text-gray-500">영양 성분 데이터가 없습니다.</p>
        </div>
      )}

      {/* 레이더 차트 */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          영양 성분 레이더 차트
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarChartData}>
            <PolarGrid />
            <PolarAngleAxis dataKey="subject" />
            <PolarRadiusAxis angle={90} domain={[0, 100]} />
            <Radar
              name="영양 성분"
              dataKey="value"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
            />
            <Tooltip />
            <Legend />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
