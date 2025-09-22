export interface PartItem {
  part_number: string;
  part_name: string;
  description?: string;
  quantity: number;
  estimated_price?: number;
  urgency?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface VehicleInfo {
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  engine?: string;
  vin?: string;
  mileage?: number;
  color?: string;
  transmission?: string;
  drivetrain?: string;
  fuel_type?: string;
  body_style?: string;
}

export interface SupplierInfo {
  supplier_id?: string;
  supplier_name: string;
  contact_person?: string;
  phone_number?: string;
  email?: string;
  account_number?: string;
}

export interface PartsRequest {
  id: string;
  created_at: string;
  updated_at: string;
  shop_id: string;
  user_id?: string;
  vehicle_info: VehicleInfo;
  parts_requested: PartItem[];
  total_estimated_price?: number;
  status: 'pending' | 'processing' | 'quoted' | 'approved' | 'ordered' | 'received' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  notes?: string;
  customer_notes?: string;
  assigned_to?: string;
  admin_notes?: string;
  quote_provided?: any;
  actual_cost?: number;
  supplier_info?: SupplierInfo;
  order_placed_at?: string;
  estimated_delivery?: string;
  fulfilled_at?: string;
}

export interface CreatePartsRequestRequest {
  vehicle_info: VehicleInfo;
  parts_requested: PartItem[];
  priority?: PartsRequest['priority'];
  notes?: string;
  customer_notes?: string;
}

export interface UpdatePartsRequestRequest extends Partial<CreatePartsRequestRequest> {
  status?: PartsRequest['status'];
  admin_notes?: string;
  quote_provided?: any;
  actual_cost?: number;
  order_placed_at?: string;
  estimated_delivery?: string;
}

export interface VoiceCall {
  id: string;
  shop_id: string;
  supplier_id: string;
  phone_number?: string;
  purpose: string;
  status: 'pending' | 'calling' | 'completed' | 'failed';
  call_duration?: number;
  transcript?: any;
  parts_discussed?: PartsRequest[];
  vapi_call_id?: string;
  created_at: string;
  updated_at: string;
  // Relations
  supplier?: {
    id: string;
    name: string;
    contact_person?: string;
  };
}
