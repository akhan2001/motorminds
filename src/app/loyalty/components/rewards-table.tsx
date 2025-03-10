import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect } from "react"
import { useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getRewards } from "../utils/LoyaltyUtils"
import { RewardSheet } from "./RewardSheet"

export function RewardsTable({ shopId }: { shopId?: string }) {
    const [rewards, setRewards] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedReward, setSelectedReward] = useState<any>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleRewardClick = (reward: any) => {
        setSelectedReward(reward)
        setIsSheetOpen(true)
    }
    
    // Get rewards from /loyalty/utils/LoyaltyUtils.ts
    useEffect(() => {
        const fetchRewards = async () => {
            if (!shopId) {
                setError("No shop ID provided. Please select a shop first.")
                setIsLoading(false)
                return
            }
            
            // console.log("Fetching rewards for shop ID:", shopId)
            
            try {
                const data = await getRewards(shopId)
                if (data && data.length > 0) {
                    setRewards(data)
                } else {
                    setRewards([])
                }
            } catch (error) {
                console.error("Error fetching rewards:", error)
                setError("Failed to fetch rewards. Please try again later.")
                setRewards([])
            } finally {
                setIsLoading(false)
            }
        }
        
        setIsLoading(true)
        setError(null)
        fetchRewards()
    }, [shopId])
    

    return (
        <div className="rounded-md border border-[#222] overflow-hidden">
            {error ? (
                <div className="p-4 text-center text-red-500 bg-[#1a1a1a]">
                    {error}
                </div>
            ) : (
                <Table>
                    <TableHeader className="bg-[#222]">
                        <TableRow className="hover:bg-[#222] border-b-0">
                            <TableHead className="text-white font-medium">Reward</TableHead>
                            <TableHead className="text-white font-medium text-left">Description</TableHead>
                            <TableHead className="text-white font-medium text-right">Points</TableHead>
                            <TableHead className="text-white font-medium text-right">Active</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && (
                            <TableRow className="hover:none">
                                <TableCell className="text-center"><Skeleton className="h-4 w-full bg-[#222]" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-full bg-[#222]" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-full bg-[#222]" /></TableCell>
                                <TableCell className="text-center"><Skeleton className="h-4 w-full bg-[#222]" /></TableCell>
                            </TableRow>
                        )}
                        
                        {!isLoading && rewards.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-4">No rewards found</TableCell>
                            </TableRow>
                        )}
                        
                        {!isLoading && rewards.map((reward) => (
                            <TableRow key={reward.id} className="hover:bg-[#1a1a1a] border-b border-[#222] cursor-pointer" onClick={() => {
                                handleRewardClick(reward)
                            }}>
                                <TableCell>{reward.name}</TableCell>
                                <TableCell className="text-left">{reward.description}</TableCell>
                                <TableCell className="text-right">{reward.points_required === 0 ? "Free" : reward.points_required}</TableCell>
                                <TableCell className="text-right">{reward.is_active === true ? <span className="text-green-500 text-bold">Yes</span> : <span className="text-red-500 text-bold">No</span>}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
            <RewardSheet
                reward={selectedReward}
                isOpen={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />
        </div>
    )
}
