import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

import { RewardsTable } from "./rewards-table"
import { getRewards, getActiveRewards, getNumberOfRewardPoints } from "../utils/LoyaltyUtils"
import RewardForm from "./RewardForm"
import { useRouter } from "next/navigation"

export default function LoyaltyDashboard({ shopId }: { shopId: string }) {
    const [isAdding, setIsAdding] = useState(false)
    const [rewards, setRewards] = useState<any[]>([])
    const [activeRewards, setActiveRewards] = useState<any[]>([])
    const [numberOfRewardPoints, setNumberOfRewardPoints] = useState(0)
    const [user, setUser] = useState<any>(null)
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const router = useRouter()

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    useEffect(() => {
        const loadRewards = async () => {
            const rewards = await getRewards(shopId)
            setRewards(rewards)
            const activeRewards = await getActiveRewards(shopId)
            setActiveRewards(activeRewards)
        }

        if (shopId) {
            loadRewards()
        }
    }, [shopId, refreshTrigger])

    return (
        <main className="flex items-center justify-center py-8 px-4">
            <div className="container mx-auto max-w-[1300px]">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Loyalty Program</h1>
                <p className="text-gray-400 mb-10">
                    Create a loyalty program that rewards customers for repeat business and referrals. You can set up points,
                    rewards, and track engagement in real time.
                </p>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Quick actions</h2>
                    <div className="space-y-4">
                        {/* Locked Card - Set up points */}
                        {/* <Card className="bg-[#111] border-[#222] relative overflow-hidden">
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-none"></div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <CardContent className="p-6 flex justify-between items-center opacity-50">
                                            <div>
                                                <h3 className="text-lg font-medium mb-1 text-white">Set up points</h3>
                                                <p className="text-gray-400">
                                                    Reward customers with points for every dollar they spend at your shop.
                                                </p>
                                            </div>
                                            <Button 
                                                variant="ghost" 
                                                className="gap-2 text-gray-500 hover:text-gray-500 hover:bg-transparent" 
                                                disabled
                                            >
                                            Get started <ArrowRight className="h-4 w-4" />
                                            </Button>
                                        </CardContent>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-[#1f1f1f] text-white border-none">
                                        Coming soon...
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </Card> */}

                        {/* Create a reward card */}
                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium mb-1 text-white">Create a reward</h3>
                                <p className="text-gray-400">
                                Show new potential customers by offering them a reward.
                                </p>
                            </div>
                            <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10" onClick={() => setIsAdding(true)}>Get started<ArrowRight className="h-4 w-4" />
                            </Button>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-4">Activity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-[70%]">
                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Total Rewards Created</p>
                                <p className="text-2xl font-bold text-white">{rewards.length}</p>
                            </CardContent>
                        </Card>

                        {/* <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Total Rewards Redeemed</p>
                                <p className="text-2xl font-bold text-red-500">{numberOfRewardPoints}</p>
                            </CardContent>
                        </Card> */}

                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Active Rewards</p>
                                <p className="text-2xl font-bold text-white">{activeRewards.length}</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Your Rewards</h2>
                        <RewardsTable shopId={shopId} refreshTrigger={refreshTrigger}/>
                </section>
                {/* <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Customers who have claimed rewards</h2>
                    <CustomersTable />
                </section> */}

                <section className="mb-10">
                {/* Add/Edit Reward Modal */}
                {isAdding && <RewardForm 
                    onClose={() => setIsAdding(false)} 
                    shopId={shopId}
                    onRewardCreated={handleRefresh}
                />}
                </section>
            </div>
        </main>
    )
}

