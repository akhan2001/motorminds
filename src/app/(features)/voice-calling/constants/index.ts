// API Constants
export const DEBOUNCE_DELAY = 300 // ms
export const REFRESH_COOLDOWN = 2000 // ms
export const MAX_RETRY_ATTEMPTS = 3

// UI Constants
export const PARTS_PREVIEW_LIMIT = 3
export const CALLS_PREVIEW_LIMIT = 2
export const PAGE_SIZE = 20

// Status Colors
export const STATUS_COLORS = {
    pending: 'text-gray-400 bg-gray-800',
    connecting: 'text-blue-400 bg-blue-900',
    in_progress: 'text-yellow-400 bg-yellow-900',
    completed: 'text-green-400 bg-green-900',
    failed: 'text-red-400 bg-red-900',
    cancelled: 'text-gray-400 bg-gray-800'
} as const

// Toast Messages
export const TOAST_MESSAGES = {
    REFRESH_SUCCESS: 'Refreshed supplier call statuses',
    REFRESH_ERROR: 'Failed to refresh request',
    CALL_INITIATED: 'Initiating calls to suppliers...',
    CALL_SUCCESS: 'Calls initiated successfully',
    CALL_ERROR: 'Failed to initiate calls',
    REQUEST_CREATED: 'Parts request created successfully! You can now call suppliers from the dashboard.',
    INVALID_PHONE: 'Invalid phone number format',
    MISSING_SUPPLIER: 'No suppliers found for this request'
} as const

// Animation Durations
export const ANIMATION = {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500
} as const

