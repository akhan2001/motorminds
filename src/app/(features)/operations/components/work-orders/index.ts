// Export all work order components

export { default as WorkOrderKanban } from './work-order-kanban'
export type { WorkOrderKanbanProps } from './work-order-kanban'

export { default as WorkOrderHeader } from './work-order-header'

export { default as WorkOrderCard } from './work-order-card'
export type { WorkOrderCardProps } from './work-order-card'

// Export modular modal components
export * from './WorkOrderModal'

// Legacy export for backward compatibility
export { default as WorkOrderDetailsModal } from './work-order-details-modal'
export type { WorkOrderDetailsModalProps } from './work-order-details-modal'

// TODO: Add other work order components as they are created
// export { default as WorkOrderList } from './work-order-list'
// export { default as WorkOrderForm } from './work-order-form'
// export { default as WorkOrderDetails } from './work-order-details'
// export { default as WorkOrderStatusBadge } from './work-order-status-badge'
// export { default as WorkOrderSearch } from './work-order-search'
// export { default as WorkOrderTimeline } from './work-order-timeline'
