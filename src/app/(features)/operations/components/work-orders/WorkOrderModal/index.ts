// DEPRECATED: This directory structure has been reorganized
// Please use the new phase-based imports:
// - Create phase: ../create
// - Manage phase: ../manage  
// - Complete phase: ../complete
// - Shared components: ../shared

// Backwards compatibility exports (will be removed in future)
export { WorkOrderDetailsModal } from '../manage/work-order-edit-modal'
export type { WorkOrderDetailsModalProps } from '../manage/work-order-edit-modal'

export { WorkOrderCreateModal } from '../create/work-order-create-modal'
export type { WorkOrderCreateModalProps } from '../create/work-order-create-modal'

// Supporting components
export { WorkOrderItemsPanel } from './work-order-items-panel'
export type { WorkOrderItemsPanelProps } from './work-order-items-panel'
