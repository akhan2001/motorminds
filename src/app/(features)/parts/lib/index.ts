// Parts Service exports
export { PartsService } from './partsService'
export type { PartsRequestFilters, PartsRequestsResponse } from './partsService'

// Parts Hooks exports
export { 
  usePartsService, 
  usePartsRequestsByStatus, 
  usePartsRequestsWithQuotes 
} from '../hooks/usePartsService'
export type { UsePartsServiceOptions } from '../hooks/usePartsService'
