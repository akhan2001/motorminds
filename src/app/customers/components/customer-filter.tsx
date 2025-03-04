import { Card, CardContent } from "@/components/ui/card"; 

export function CustomerFilter() {
    return (
        <section className="mb-10 w-[70%]">
            <h2 className="text-xl font-semibold mb-4">Customer Activity</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-400 mb-1">Total Rewards Created</p>
                        <p className="text-2xl font-bold text-green-500">1,500,000</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-400 mb-1">Total Rewards Redeemed</p>
                        <p className="text-2xl font-bold text-red-500">1,500,000</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-400 mb-1">Active Rewards</p>
                        <p className="text-2xl font-bold text-green-500">1,950,000</p>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
