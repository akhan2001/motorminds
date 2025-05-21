import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { createReward } from "../utils/LoyaltyUtils";
import { Sparkles } from "lucide-react";

export default function RewardForm({ onClose, shopId, onRewardCreated }: { 
    onClose: () => void, 
    shopId: string,
    onRewardCreated?: () => void 
}) {
    const [rewardName, setRewardName] = useState("");
    const [rewardDescription, setRewardDescription] = useState("");
    const [points, setPoints] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
        });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const titleCaseValue = toTitleCase(e.target.value);
        setRewardName(titleCaseValue);
    };

    const generateDescription = async () => {
        if (!rewardName) return;
        
        setIsGenerating(true);
        try {
            const response = await fetch("/api/generate-reward-description", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    title: rewardName,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to generate description");
            }

            const data = await response.json();
            setRewardDescription(data.description);
            toast.success("Description generated!");
        } catch (error) {
            console.error("Error generating description:", error);
            toast.error("Failed to generate description. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async () => {
        const rewardData = {
            name: rewardName,
            description: rewardDescription,
            points_required: points,
            shop_id: shopId
        }

        try {
            const response = await createReward(rewardData);
            toast.success("Reward created successfully");
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
                            onChange={handleTitleChange}
                        />
                        <p className="text-gray-500 text-xs mt-1">
                            Enter a short and catchy title for the reward.
                        </p>
                    </div>

                    {/* Reward Description */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-gray-300 text-sm">Reward Description</label>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5 text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                onClick={generateDescription}
                                disabled={!rewardName || isGenerating}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                {isGenerating ? "Generating..." : "Generate Description"}
                            </Button>
                        </div>
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
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                        disabled={!rewardName || !rewardDescription}
                    >
                        Save Reward
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
