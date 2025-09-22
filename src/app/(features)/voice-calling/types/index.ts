/**
 * Voice Calling Types Index
 * Centralized exports for all voice-calling related types
 */

// Parts Request Types
export * from './parts-request'

// Re-export commonly used types with shorter names
export type {
    PartsRequest,
    CreatePartsRequestData,
    UpdatePartsRequestData,
    PartsRequestResponse,
    PartsRequestListResponse,
    VehicleInfo,
    PartItem,
    SelectedSupplier,
    SupplierInfo,
    QuoteInfo,
    PartsRequestStatus,
    PartsRequestPriority,
    PartsRequestFormState,
    PartsRequestValidation,
    PartsRequestFilter,
    PartsRequestSort,
    PartsRequestStats
} from './parts-request'

// Type namespace for easier consumption
export { PartsRequestTypes } from './parts-request'
