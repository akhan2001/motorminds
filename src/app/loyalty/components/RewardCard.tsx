import { Card, CardContent } from "@/components/ui/card";

export default function RewardCard({ reward }: { reward: any }) {
    return (
        <Card className="bg-[#111] border-[#222] p-4 w-full">
            <CardContent className="flex flex-row justify-between items-center">
                <h3 className="text-white">{reward.name}</h3>
                <p className="text-gray-400">Points: {reward.points}</p>
                <p className="text-gray-500">Redeemed: {reward.redeemed} | Remaining: {reward.remaining}</p>
            </CardContent>
        </Card>
    );
}
