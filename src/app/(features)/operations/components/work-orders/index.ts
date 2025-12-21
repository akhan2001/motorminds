// Export all work order components

export { default as WorkOrderKanban } from './work-order-kanban'
export type { WorkOrderKanbanProps } from './work-order-kanban'

export { default as WorkOrderHeader } from './work-order-header'

export { default as WorkOrderCard } from './work-order-card'
export type { WorkOrderCardProps } from './work-order-card'

export { default as WorkOrderCardSmall } from './work-order-card-small'
export type { WorkOrderCardSmallProps } from './work-order-card-small'

// Phase-based exports (new structure) - Named exports for better tree-shaking
export { WorkOrderCreateModal } from './create'
export type { WorkOrderCreateModalProps } from './create'

export { WorkOrderEditModal, WorkOrderDetailsModal, WorkOrderDeleteConfirmation } from './manage'
export type { WorkOrderEditModalProps, WorkOrderDetailsModalProps } from './manage'

export { WorkOrderCompletionModal, WorkOrderReview, WorkOrderCostSummary } from './complete'

// Shared components - import directly when needed to avoid pulling in all components
export { CustomerInformation } from './shared/customer-information'
export { VehicleInformation } from './shared/vehicle-information'
export { WorkOrderInformation } from './shared/work-order-information'
export { WorkOrderNotes } from './shared/work-order-notes'
export { WorkOrderModalHeader } from './shared/work-order-modal-header'
export { WorkOrderModalFooter } from './shared/work-order-modal-footer'
export { WorkOrderStatusBar } from './shared/work-order-status-bar'
export { WorkOrderRightPanel } from './shared/work-order-right-panel'
export { ChatPanel } from './shared/chat-panel'
export { InvoiceHistoryPanel } from './shared/invoice-history-panel'
export { WorkOrderLaborItems, WorkOrderPartsItems, WorkOrderGenericItems } from './shared/items'
export { WorkOrderFinancialSummary } from './shared/work-order-financial-summary'

// TODO: Add other work order components as they are created
// export { default as WorkOrderList } from './work-order-list'
// export { default as WorkOrderForm } from './work-order-form'
// export { default as WorkOrderDetails } from './work-order-details'
// export { default as WorkOrderStatusBadge } from './work-order-status-badge'
// export { default as WorkOrderSearch } from './work-order-search'
// export { default as WorkOrderTimeline } from './work-order-timeline'
