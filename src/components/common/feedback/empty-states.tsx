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
    icon = <Package className="h-12 w-12 text-muted-foreground dark:text-gray-400" />, 
    title, 
    description, 
    action,
    className = ''
}: EmptyStateProps) {
    return (
        <Card className={`bg-card dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a] ${className}`}>
            <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex justify-center">
                        {icon}
                    </div>
                    <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
                        {title}
                    </h3>
                    <p className="text-muted-foreground dark:text-gray-400 mb-4">
                        {description}
                    </p>
                    {action && (
                        <Button 
                            onClick={action.onClick}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            {action.label}
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
