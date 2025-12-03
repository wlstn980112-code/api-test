'use client';

import { useEffect, useState } from 'react';

interface ChartData {
  name: string;
  칼로리: number;
}

interface BarChartComponentProps {
  data: ChartData[];
}

export default function BarChartComponent({ data }: BarChartComponentProps) {
  // 모든 hooks를 최상단에 선언 (React Hooks 규칙 준수)
  const [isClient, setIsClient] = useState(false);
  const [Recharts, setRecharts] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
    import('recharts').then((mod) => {
      console.log('[BarChartComponent] Recharts 로드 완료');
      setRecharts(mod);
    });
  }, []);

  // 조건부 return은 hooks 호출 이후에
  if (!isClient) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트 데이터가 없습니다.</p>
      </div>
    );
  }

  if (!Recharts) {
    return (
      <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
        <p className="text-gray-500">차트를 준비하는 중...</p>
      </div>
    );
  }

  console.log('[BarChartComponent] 차트 렌더링:', data.length, '개 데이터');

  // 데이터가 너무 많으면 샘플링 (성능 최적화)
  const displayData = data.length > 50 ? data.slice(0, 50) : data;

  const {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
  } = Recharts;

  return (
    <div className="w-full bg-white p-4 rounded-lg" style={{ minHeight: '400px' }}>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={displayData} margin={{ top: 20, right: 30, left: 20, bottom: 100 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
            tick={{ fontSize: 10 }}
          />
          <YAxis 
            label={{ value: '칼로리 (kcal)', angle: -90, position: 'insideLeft' }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number) => [`${value.toFixed(0)} kcal`, '칼로리']}
            labelStyle={{ color: '#000' }}
          />
          <Legend />
          <Bar dataKey="칼로리" fill="#3b82f6" name="칼로리 (kcal)" />
        </BarChart>
      </ResponsiveContainer>
      {data.length > 50 && (
        <p className="text-sm text-gray-500 mt-2 text-center">
          총 {data.length}개 레시피 중 상위 50개만 표시됩니다.
        </p>
      )}
    </div>
  );
}

