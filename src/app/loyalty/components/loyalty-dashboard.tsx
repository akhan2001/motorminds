"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import { RewardsTable } from "./rewards-table"
import { CustomersTable } from "./customers-table"

export default function LoyaltyDashboard() {
  return (
    <main className="flex-1 p-8">
        <div className="max-w-5xl">
            <h1 className="text-3xl font-bold mb-2">Welcome to Loyalty Program</h1>
            <p className="text-gray-400 mb-10">
                Create a loyalty program that rewards customers for repeat business and referrals. You can set up points,
                rewards, and track engagement in real time.
            </p>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Quick actions</h2>
                <div className="space-y-4">
                    <Card className="bg-[#111] border-[#222]">
                        <CardContent className="p-6 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-medium mb-1 text-white">Set up points</h3>
                                <p className="text-gray-400">
                                Reward customers with points for every dollar they spend at your shop.
                                </p>
                            </div>
                            <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10">Get started<ArrowRight className="h-4 w-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111] border-[#222]">
                        <CardContent className="p-6 flex justify-between items-center">
                        <div>
                            <h3 className="text-lg font-medium mb-1 text-white">Create a reward</h3>
                            <p className="text-gray-400">
                            Show customers how much you appreciate their business by offering them a reward.
                            </p>
                        </div>
                        <Button variant="ghost" className="gap-2 text-red-500 hover:text-red-500 hover:bg-red-500/10">Get started<ArrowRight className="h-4 w-4" />
                        </Button>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section>
                <h2 className="text-xl font-semibold mb-4">Points activity</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card className="bg-[#111] border-[#222]">
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-400 mb-1">All-time points earned</p>
                            <p className="text-2xl font-bold">3,450,000</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111] border-[#222]">
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-400 mb-1">All-time points redeemed</p>
                            <p className="text-2xl font-bold">1,500,000</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111] border-[#222]">
                        <CardContent className="p-6">
                            <p className="text-sm text-gray-400 mb-1">Total points balance</p>
                            <p className="text-2xl font-bold">1,950,000</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Top Rewards</h2>
                <RewardsTable />
            </section>
            <section className="mb-10">
                <h2 className="text-xl font-semibold mb-4">Top Rewards</h2>
                <CustomersTable />
            </section>
        </div>
    </main>
    )
}

