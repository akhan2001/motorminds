// Refactored to use container/presentational pattern
// Main export now uses the container component
'use client'

// Re-export the container component as the main component for backwards compatibility
export { WorkOrderEditModal, type WorkOrderEditModalProps, type WorkOrderDetailsModalProps } from './WorkOrderEditModalContainer'

// Backwards compatibility export
export { WorkOrderEditModal as WorkOrderDetailsModal } from './WorkOrderEditModalContainer'
