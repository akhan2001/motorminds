import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const rewards = [
{
    id: 1,
    name: "$20 off any service",
    points: 2000,
    redeemed: 150,
    remaining: 1850,
},
{
    id: 2,
    name: "Free oil change",
    points: 5000,
    redeemed: 0,
    remaining: 5000,
},
{
    id: 3,
    name: "$50 off brake service",
    points: 3000,
    redeemed: 0,
    remaining: 3000,
},
{
    id: 4,
    name: "$100 off engine repair",
    points: 10000,
    redeemed: 0,
    remaining: 10000,
},
{
    id: 5,
    name: "Free car wash",
    points: 1000,
    redeemed: 0,
    remaining: 1000,
},
]

export function RewardsTable() {
    return (
        <div className="rounded-md border border-[#222] overflow-hidden">
            <Table>
                <TableHeader className="bg-[#222]">
                    <TableRow className="hover:bg-[#222] border-b-0">
                        <TableHead className="text-white font-medium">Reward</TableHead>
                        <TableHead className="text-white font-medium text-right">Points</TableHead>
                        <TableHead className="text-white font-medium text-right">Redeemed</TableHead>
                        <TableHead className="text-white font-medium text-right">Remaining</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                {rewards.map((reward) => (
                    <TableRow key={reward.id} className="hover:bg-[#1a1a1a] border-b border-[#222]">
                    <TableCell>{reward.name}</TableCell>
                    <TableCell className="text-right">{reward.points}</TableCell>
                    <TableCell className="text-right">{reward.redeemed}</TableCell>
                    <TableCell className="text-right">{reward.remaining}</TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
        </div>
    )
}

