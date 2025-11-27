/**
 * Centralized formatting utilities
 * Re-exports all formatting functions from specialized modules
 */

// Currency formatting
export {
    formatCurrency,
    formatCurrencyDetailed,
    formatCompactNumber,
    formatPercentage,
    parseCurrency,
    calculatePercentageChange,
    formatNumber,
    calculateCAGR
} from './currency'

// Date formatting
export {
    formatDate,
    formatDateTime,
    formatRelativeTime,
    isWithinDays,
    getCurrentMonthRange
} from './date'

// Phone number formatting
export {
    formatPhoneNumber,
    formatPhoneNumberDisplay,
    formatPhoneNumberE164,
    cleanPhoneNumber,
    isValidPhoneNumber,
    isValidE164
} from '@/utils/format-phone'

