export default function LoadingSkeleton() {
    return (
        <div className="animate-pulse">
            {/* Header Skeleton */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <div className="h-8 bg-[#1a1a1a] rounded w-64 mb-2"></div>
                    <div className="h-4 bg-[#1a1a1a] rounded w-80"></div>
                </div>
                <div className="h-10 bg-[#1a1a1a] rounded w-32"></div>
            </div>

            {/* MainSummaryCards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="h-28 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-28 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-28 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-28 bg-[#1a1a1a] rounded-xl"></div>
            </div>

            {/* QuickActions Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="h-36 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-36 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-36 bg-[#1a1a1a] rounded-xl"></div>
                <div className="h-36 bg-[#1a1a1a] rounded-xl"></div>
            </div>
        </div>
    );
} 