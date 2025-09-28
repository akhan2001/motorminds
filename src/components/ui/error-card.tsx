import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

interface ErrorCardProps {
    title: string
    description: string
    action?: React.ReactNode
}

export function ErrorCard({ title, description, action }: ErrorCardProps) {
    return (
        <Card className="bg-[#1a1a1a] border-[#2a2a2a]">
            <CardContent className="flex items-center gap-4 p-6">
                <AlertCircle className="h-6 w-6 text-red-500" />
                <div className="flex-1">
                    <p className="text-white font-medium">{title}</p>
                    <p className="text-gray-400 text-sm">{description}</p>
                </div>
                {action}
            </CardContent>
        </Card>
    )
}
