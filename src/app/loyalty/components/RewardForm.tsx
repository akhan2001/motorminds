import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createReward } from "../utils/LoyaltyUtils";

export default function RewardForm({ onClose, shopId, onRewardCreated }: { 
    onClose: () => void, 
    shopId: string,
    onRewardCreated?: () => void 
}) {
    const [rewardName, setRewardName] = useState("");
    const [rewardDescription, setRewardDescription] = useState("");
    const [points, setPoints] = useState(0);

    const handleSubmit = async () => {
        // console.log({ rewardName, rewardDescription, points });
        // const shopID = await getShopID();

        // // Create a new reward with app/loyalty/api/route.ts
        // const response = await fetch("/loyalty/api", {
        //     method: "POST",
        //     headers: {
        //         "Content-Type": "application/json",
        //     },
        //     body: JSON.stringify({ name: rewardName, description: rewardDescription, points_required: points, shop_id: shopID }),
        // });

        // if (response.ok) {
        //     console.log("Reward created successfully");
        //     toast.success("Reward created successfully");
        // } else {
        //     console.log("Failed to create reward");
        //     toast.error("Failed to create reward. Try again later.");
        // }
        
        const rewardData = {
            name: rewardName,
            description: rewardDescription,
            points_required: points,
            shop_id: shopId
        }

        try {
            const response = await createReward(rewardData);
            toast.success("Reward created successfully");
            // Call onRewardCreated before closing
            if (onRewardCreated) {
                onRewardCreated();
            }
            onClose();
        } catch (error) {
            toast.error("Failed to create reward. Try again later.");
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border border-[#626262]">
                <DialogHeader className="gap-2">
                    <DialogTitle className="text-white">Create a Customer Reward</DialogTitle>
                    <DialogDescription className="text-gray-400 text-sm">
                        Create an exclusive offer for customers to redeem in your shop.  
                        Rewards will be visible in the **Marketplace** where customers can claim and use them at your shop.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Reward Title */}
                    <div>
                        <label className="text-gray-300 text-sm">Reward Title</label>
                        <Input 
                            className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1"
                            placeholder="E.g., Free Oil Change, 10% Off Next Service" 
                            value={rewardName} 
                            onChange={(e) => setRewardName(e.target.value)} 
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Enter a short and catchy title for the reward.
                        </p>
                    </div>

                    {/* Reward Description */}
                    <div>
                        <label className="text-gray-300 text-sm">Reward Description</label>
                        <textarea
                            className="bg-[#292929] text-white text-sm border border-[#626262] mt-1 w-full p-2 rounded-md"
                            placeholder="Describe what the customer gets when they redeem this reward."
                            value={rewardDescription}
                            onChange={(e) => setRewardDescription(e.target.value)}
                            rows={3}
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Explain any conditions or details about how customers can use this reward.
                        </p>
                    </div>

                    {/* Reward Points */}
                    {/* <div>
                        <label className="text-gray-300 text-sm">Reward Points</label>
                        <Select onValueChange={(value) => setPoints(parseInt(value))} disabled={true}>
                            <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                                <SelectValue placeholder="Select a reward point value" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1">
                                <SelectItem value="0">0</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                                <SelectItem value="200">200</SelectItem>
                                <SelectItem value="300">300</SelectItem>
                                <SelectItem value="500">500</SelectItem>
                                <SelectItem value="1000">1000</SelectItem>
                                <Input 
                                type="number" 
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 mt-1" 
                                placeholder="Enter a custom point value"
                                value={points}
                                onChange={(e) => setPoints(parseInt(e.target.value))}
                                />
                            </SelectContent>
                        </Select>
                    </div> */}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                    >
                        Save Reward
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
