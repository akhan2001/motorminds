import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function FilterCard({ title, value, description }: { title: string, value: number, description: string }) {
    return (
        <Card className="bg-[#1A1A1A] border-[#333] text-white">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-gray-400">{description}</p>
            </CardContent>
        </Card>
    )
}