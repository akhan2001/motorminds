/**
 * Utility functions for formatting data across the application
 */

export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

export const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
        case 'pending': return 'bg-yellow-600'
        case 'connecting': return 'bg-blue-600'
        case 'in_progress': return 'bg-blue-600'
        case 'completed': return 'bg-green-600'
        case 'failed': return 'bg-red-600'
        case 'cancelled': return 'bg-gray-600'
        case 'ready_to_order': return 'bg-emerald-600'
        case 'recall_needed': return 'bg-orange-600'
        case 'quote_received': return 'bg-emerald-600'
        default: return 'bg-gray-600'
    }
}

export const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
        case 'urgent': return 'bg-red-600'
        case 'high': return 'bg-orange-600'
        case 'medium': return 'bg-yellow-600'
        case 'low': return 'bg-green-600'
        default: return 'bg-gray-600'
    }
}

export const getPurposeColor = (purpose: string) => {
    switch (purpose) {
        case 'parts_ordering': return 'bg-blue-600'
        case 'general_inquiry': return 'bg-purple-600'
        case 'quote_request': return 'bg-green-600'
        case 'order_followup': return 'bg-orange-600'
        default: return 'bg-gray-600'
    }
}

export const formatStatusLabel = (status: string) => {
    switch (status) {
        case 'ready_to_order': return 'Ready to Order'
        case 'recall_needed': return 'Recall Needed'
        case 'connecting': return 'Connecting'
        case 'in_progress': return 'In Progress'
        case 'parts_ordering': return 'Parts Ordering'
        case 'general_inquiry': return 'General Inquiry'
        case 'quote_request': return 'Quote Request'
        case 'order_followup': return 'Order Follow-up'
        default: return status.charAt(0).toUpperCase() + status.slice(1)
    }
}
