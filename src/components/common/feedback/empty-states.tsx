import { Package, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description: string
    action?: {
        label: string
        onClick: () => void
    }
    className?: string
}

export function EmptyState({ 
    icon = <Package className="h-12 w-12 text-gray-400" />, 
    title, 
    description, 
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <Card className={className}>
            <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="mx-auto mb-4">
                        {icon}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {title}
                    </h3>
                    <p className="text-gray-600 mb-4">
                        {description}
                    </p>
                    {action && (
                        <Button onClick={action.onClick}>
                            <Plus className="h-4 w-4 mr-2" />
                            {action.label}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
