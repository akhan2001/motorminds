/**
 * Unified status system for voice calling and parts requests
 */

// Parts Request Status - Primary business logic status
export type PartsRequestStatus = 
    | 'pending'           // Just created, no calls yet
    | 'quote_requested'   // Initial call made
    | 'quote_received'    // Got pricing info, needs review
    | 'ready_to_order'    // All info gathered, ready to place order
    | 'order_placed'      // Ordering call completed
    | 'completed'         // Order confirmed and closed
    | 'failed'           // All attempts failed
    | 'cancelled'        // User cancelled

// Voice Call Status - Technical call states
export type VoiceCallStatus = 
    | 'pending'          // Call queued but not started
    | 'connecting'       // Vapi is initiating the call
    | 'in_progress'      // Call is active
    | 'completed'        // Call finished successfully
    | 'failed'          // Call failed (no answer, busy, error)
    | 'cancelled'       // Call was cancelled

// Voice Call Purpose - Why the call is being made
export type VoiceCallPurpose = 
    | 'quote_request'    // Initial call to get pricing/availability
    | 'order_followup'   // Call to confirm details, get ETA, etc.
    | 'parts_ordering'   // Final call to place the actual order
    | 'general_inquiry'  // General information call

// Status transitions and business logic
export const PARTS_REQUEST_TRANSITIONS: Record<PartsRequestStatus, PartsRequestStatus[]> = {
    'pending': ['quote_requested', 'cancelled'],
    'quote_requested': ['quote_received', 'failed', 'pending'], // Can retry
    'quote_received': ['ready_to_order', 'quote_requested'], // Can get more quotes
    'ready_to_order': ['order_placed', 'quote_requested'], // Can reorder or get new quote
    'order_placed': ['completed', 'ready_to_order'], // Can retry order
    'completed': [], // Final state
    'failed': ['pending'], // Can restart process
    'cancelled': ['pending'] // Can restart process
}

// Available actions per status
export interface StatusAction {
    action: string
    label: string
    purpose: VoiceCallPurpose
    description: string
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export const STATUS_ACTIONS: Record<PartsRequestStatus, StatusAction[]> = {
    'pending': [
        {
            action: 'start_quote_call',
            label: 'Get Quote',
            purpose: 'quote_request',
            description: 'Call supplier to get pricing and availability',
            variant: 'default'
        }
    ],
    'quote_requested': [
        {
            action: 'retry_quote_call',
            label: 'Retry Quote',
            purpose: 'quote_request',
            description: 'Retry the quote request call',
            variant: 'outline'
        }
    ],
    'quote_received': [
        {
            action: 'place_order',
            label: 'Place Order',
            purpose: 'parts_ordering',
            description: 'Place the parts order with supplier',
            variant: 'default'
        },
        {
            action: 'followup_call',
            label: 'Get More Info',
            purpose: 'order_followup',
            description: 'Call to clarify details or get more information',
            variant: 'outline'
        }
    ],
    'ready_to_order': [
        {
            action: 'place_order',
            label: 'Place Order',
            purpose: 'parts_ordering',
            description: 'Place the parts order with supplier',
            variant: 'default'
        }
    ],
    'order_placed': [
        {
            action: 'check_status',
            label: 'Check Status',
            purpose: 'order_followup',
            description: 'Call to check order status or delivery time',
            variant: 'outline'
        },
        {
            action: 'complete_order',
            label: 'Mark Complete',
            purpose: 'general_inquiry',
            description: 'Mark this order as completed and received',
            variant: 'default'
        }
    ],
    'completed': [],
    'failed': [
        {
            action: 'restart_process',
            label: 'Start Over',
            purpose: 'quote_request',
            description: 'Restart the entire process',
            variant: 'outline'
        }
    ],
    'cancelled': [
        {
            action: 'restart_process',
            label: 'Restart',
            purpose: 'quote_request',
            description: 'Restart the parts request process',
            variant: 'outline'
        }
    ]
}

// Status display configuration
export interface StatusConfig {
    label: string
    color: string
    bgColor: string
    description: string
}

export const PARTS_STATUS_CONFIG: Record<PartsRequestStatus, StatusConfig> = {
    'pending': {
        label: 'Pending',
        color: 'text-gray-300',
        bgColor: 'bg-gray-800',
        description: 'Waiting to start quote process'
    },
    'quote_requested': {
        label: 'Getting Quote',
        color: 'text-blue-300',
        bgColor: 'bg-blue-900',
        description: 'AI is calling supplier for quote'
    },
    'quote_received': {
        label: 'Quote Received',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-900',
        description: 'Quote received, ready for review'
    },
    'ready_to_order': {
        label: 'Ready to Order',
        color: 'text-green-300',
        bgColor: 'bg-green-900',
        description: 'Ready to place order with supplier'
    },
    'order_placed': {
        label: 'Order Placed',
        color: 'text-purple-300',
        bgColor: 'bg-purple-900',
        description: 'Order has been placed with supplier'
    },
    'completed': {
        label: 'Completed',
        color: 'text-green-400',
        bgColor: 'bg-green-800',
        description: 'Order completed successfully'
    },
    'failed': {
        label: 'Failed',
        color: 'text-red-300',
        bgColor: 'bg-red-900',
        description: 'Process failed, needs attention'
    },
    'cancelled': {
        label: 'Cancelled',
        color: 'text-gray-400',
        bgColor: 'bg-gray-800',
        description: 'Request was cancelled'
    }
}

export const CALL_STATUS_CONFIG: Record<VoiceCallStatus, StatusConfig> = {
    'pending': {
        label: 'Pending',
        color: 'text-gray-300',
        bgColor: 'bg-gray-800',
        description: 'Call queued'
    },
    'connecting': {
        label: 'Connecting',
        color: 'text-blue-300',
        bgColor: 'bg-blue-900',
        description: 'Initiating call'
    },
    'in_progress': {
        label: 'In Progress',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-900',
        description: 'Call active'
    },
    'completed': {
        label: 'Completed',
        color: 'text-green-300',
        bgColor: 'bg-green-900',
        description: 'Call finished'
    },
    'failed': {
        label: 'Failed',
        color: 'text-red-300',
        bgColor: 'bg-red-900',
        description: 'Call failed'
    },
    'cancelled': {
        label: 'Cancelled',
        color: 'text-gray-400',
        bgColor: 'bg-gray-800',
        description: 'Call cancelled'
    }
}

// Helper functions
export function getStatusConfig(status: PartsRequestStatus): StatusConfig {
    return PARTS_STATUS_CONFIG[status] || PARTS_STATUS_CONFIG['pending']
}

export function getCallStatusConfig(status: VoiceCallStatus): StatusConfig {
    return CALL_STATUS_CONFIG[status] || CALL_STATUS_CONFIG['pending']
}

export function getAvailableActions(status: PartsRequestStatus): StatusAction[] {
    return STATUS_ACTIONS[status] || []
}

export function canTransitionTo(from: PartsRequestStatus, to: PartsRequestStatus): boolean {
    return PARTS_REQUEST_TRANSITIONS[from]?.includes(to) || false
}
