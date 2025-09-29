import { Card, CardContent } from '@/components/ui/card'

interface LoadingCardProps {
    title: string
    description?: string
}

export function LoadingCard({ title, description }: LoadingCardProps) {
    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="flex items-center gap-4 p-6">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <div>
                    <p className="text-white font-medium">{title}</p>
                    {description && (
                        <p className="text-gray-400 text-sm">{description}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
