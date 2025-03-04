"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"

import { ArrowRight } from "lucide-react"
import { useState, useEffect } from "react"

import { InfoHoverCard } from "@/app/components/InfoHoverCard"
import { RewardsTable } from "./rewards-table"
import { CustomersTable } from "./customers-table"
import { getRewardsCount, getActiveRewards, getNumberOfRewardPoints } from "../utils/LoyaltyUtils"
import RewardForm from "./RewardForm"

export default function LoyaltyDashboard() {
    const [isAdding, setIsAdding] = useState(false)
    const [rewardsCount, setRewardsCount] = useState(0)
    const [activeRewards, setActiveRewards] = useState(0)
    const [numberOfRewardPoints, setNumberOfRewardPoints] = useState(0)
    const shop_id = "850e8400-e29b-41d4-a716-446655440001"

    useEffect(() => {
        const fetchRewardsCount = async () => {
            const count = await getRewardsCount(shop_id)
            const activeRewards = await getActiveRewards(shop_id)
            const numberOfRewardPoints = await getNumberOfRewardPoints(shop_id)
            setRewardsCount(count || 0)
            setActiveRewards(activeRewards.length || 0)
            setNumberOfRewardPoints(numberOfRewardPoints || 0)
        }
        fetchRewardsCount()
    }, [])

    return (
        <main className="flex items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">Welcome to Loyalty Program
                    <InfoHoverCard text="The loyalty program is still being developed. If you have any questions, please contact support." />
                </h1>
                <p className="text-gray-400 mb-10">
                    Create a loyalty program that rewards customers for repeat business and referrals. You can set up points,
                    rewards, and track engagement in real time.
                </p>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Quick actions</h2>
                    <div className="space-y-4">
                        {/* Locked Card - Set up points */}
                        <Card className="bg-[#111] border-[#222] relative overflow-hidden">
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
                        </Card>

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
                    <h2 className="text-xl font-semibold mb-4">Points activity</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 w-[70%]">
                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Total Rewards Created</p>
                                <p className="text-2xl font-bold text-green-500">{rewardsCount}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Total Rewards Redeemed</p>
                                <p className="text-2xl font-bold text-red-500">{numberOfRewardPoints}</p>
                            </CardContent>
                        </Card>

                        <Card className="bg-[#111] border-[#222]">
                            <CardContent className="p-6">
                                <p className="text-sm text-gray-400 mb-1">Active Rewards</p>
                                <p className="text-2xl font-bold text-green-500">{activeRewards}</p>
                            </CardContent>
                        </Card>
                    </div>
                </section>

                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Your Rewards</h2>
                    <RewardsTable />
                </section>
                <section className="mb-10">
                    <h2 className="text-xl font-semibold mb-4">Customers who have claimed rewards</h2>
                    <CustomersTable />
                </section>

                <section className="mb-10">
                {/* Add/Edit Reward Modal */}
                {isAdding && <RewardForm onClose={() => setIsAdding(false)} />}
                </section>
            </div>
        </main>
    )
}

