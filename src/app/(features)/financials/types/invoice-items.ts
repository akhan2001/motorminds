export type InvoiceItemType = 'labor' | 'part' | 'service' | 'fee' | 'discount' | 'package'

export interface InvoiceItem {
  id: string
  invoice_id: string
  work_order_item_id?: string | null
  item_type: InvoiceItemType
  description: string
  part_number?: string | null
  supplier?: string | null
  category?: string | null
  quantity: number
  unit_price: number
  total_price: number
  unit_cost?: number | null
  total_cost?: number | null
  labor_hours?: number | null
  technician_id?: string | null
  is_from_work_order: boolean
  is_modified: boolean
  original_work_order_item?: any | null
  invoice_specific_notes?: string | null
  invoice_specific_discount?: number | null
  warranty_period?: string | null
  active: boolean
  created_at: string
  updated_at: string
  shop_id: string
}

export interface InvoiceItemFormData {
  item_type: InvoiceItemType
  description: string
  part_number?: string
  supplier?: string
  category?: string
  quantity: number
  unit_price: number
  unit_cost?: number
  labor_hours?: number
  technician_id?: string
  invoice_specific_notes?: string
  invoice_specific_discount?: number
  warranty_period?: string
}

export interface InvoiceItemCreateData extends InvoiceItemFormData {
  invoice_id: string
  shop_id: string
  work_order_item_id?: string
  is_from_work_order?: boolean
  original_work_order_item?: any
}

export interface InvoiceItemUpdateData extends Partial<InvoiceItemFormData> {
  is_modified?: boolean
}

export interface InvoiceItemSummary {
  subtotal: number
  partsTotal: number
  laborTotal: number
  servicesTotal: number
  feesTotal: number
  totalDiscount: number
  tax: number
  grandTotal: number
  itemCount: number
  laborHoursTotal: number
}

export interface WorkOrderItemImport {
  work_order_item_id: string
  description: string
  item_type: InvoiceItemType
  quantity: number
  unit_price: number
  total_price: number
  part_number?: string
  supplier?: string
  category?: string
  labor_hours?: number
  technician_id?: string
  unit_cost?: number
  total_cost?: number
}

