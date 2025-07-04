import { Nav } from "@/app/components/nav";

export default function LoadingSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <div className="animate-pulse">
            {/* Breadcrumb */}
            <div className="h-5 bg-[#1a1a1a] rounded w-1/4 mb-8"></div>
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="w-1/2 space-y-2">
                    <div className="h-8 bg-[#1a1a1a] rounded w-2/3"></div>
                    <div className="h-4 bg-[#1a1a1a] rounded w-1/2"></div>
                </div>
                <div className="h-10 bg-[#1a1a1a] rounded w-32"></div>
            </div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-[#1a1a1a] rounded-xl"></div>
                ))}
            </div>
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 my-8">
                <div className="lg:col-span-3 h-72 bg-[#1a1a1a] rounded-xl"></div>
                <div className="lg:col-span-2 h-72 bg-[#1a1a1a] rounded-xl"></div>
            </div>
            {/* Statement Table */}
            <div className="h-64 bg-[#1a1a1a] rounded-xl"></div>
        </div>
      </main>
    </div>
  );
} 