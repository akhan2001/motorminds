interface SparklineProps {
  data: { date: string; value: number }[];
  positive?: boolean;
  width?: number;
  height?: number;
}

export default function Sparkline({ 
  data, 
  positive = true, 
  width = 80, 
  height = 20 
}: SparklineProps) {
  if (!data || data.length === 0) return null;
  
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 4);
    const y = (height - 4) - ((d.value - minValue) / range) * (height - 8);
    return `${x + 2},${y + 2}`;
  }).join(' ');
  
  return (
    <svg width={width} height={height} className="absolute bottom-3 right-4">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeWidth="1.5"
        className="opacity-80"
      />
    </svg>
  );
} 