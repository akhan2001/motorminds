// Hook for calculating work order statistics

interface WorkOrderColumn {
    id: string
    items: any[]
}

export interface WorkOrderStats {
    totalCount: number
    pendingCount: number
    inProgressCount: number
    completedCount: number
}

// Helper function to get count for a specific column status
function getColumnCount(columns: WorkOrderColumn[], columnId: string): number {
    return columns.find(col => col.id === columnId)?.items.length || 0
}

export function useWorkOrderStats(columns: WorkOrderColumn[]): WorkOrderStats {
    // Calculate total count efficiently
    const totalCount = columns.reduce((sum, column) => sum + column.items.length, 0)
    
    // Get specific column counts using helper
    const pendingCount = getColumnCount(columns, 'pending')
    const inProgressCount = getColumnCount(columns, 'in-progress')
    const completedCount = getColumnCount(columns, 'completed')

    return {
        totalCount,
        pendingCount,
        inProgressCount,
        completedCount
    }
}
