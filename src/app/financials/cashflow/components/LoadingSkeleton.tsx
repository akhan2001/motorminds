export default function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div className="h-8 bg-[#1a1a1a] rounded w-1/3"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-[#1a1a1a] rounded-xl"></div>
        ))}
      </div>
      <div className="h-96 bg-[#1a1a1a] rounded-xl"></div>
    </div>
  );
} 