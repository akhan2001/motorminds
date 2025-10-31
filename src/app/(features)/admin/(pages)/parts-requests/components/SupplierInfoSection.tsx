'use client'

import { Building2, Phone, Mail, MapPin, Hash } from 'lucide-react'
import { PartsRequest } from '@/app/(features)/parts/types/parts'

interface SupplierInfoSectionProps {
  request: PartsRequest
}

export function SupplierInfoSection({ request }: SupplierInfoSectionProps) {
  const supplierInfo = request.supplier_info as any
  const selectedSuppliers = supplierInfo?.selected_suppliers || []
  const hasSupplierData = selectedSuppliers.length > 0

  return (
    <div className="bg-[#0a0a0a] p-4 rounded-lg border border-[#2a2a2a] hover:border-[#3a3a3a] transition-colors">
      <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-green-400" />
        Supplier Information
        {supplierInfo?.total_suppliers && (
          <span className="text-xs text-blue-400 ml-2">({supplierInfo.total_suppliers} supplier{supplierInfo.total_suppliers !== 1 ? 's' : ''})</span>
        )}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        {!hasSupplierData && (
          <div className="md:col-span-2 text-gray-400 text-sm italic">
            No supplier information provided with this parts request.
          </div>
        )}
        
        {/* Display supplier summary stats */}
        {supplierInfo && (supplierInfo.total_suppliers > 0) && (
          <div className="md:col-span-2 mb-2">
            <div className="flex gap-4 text-xs text-gray-400">
              <span>Total: {supplierInfo.total_suppliers}</span>
              <span>Completed: {supplierInfo.completed_suppliers}</span>
              <span>Failed: {supplierInfo.failed_suppliers}</span>
            </div>
          </div>
        )}

        {/* Display each selected supplier */}
        {selectedSuppliers.map((supplier: any, idx: number) => (
          <div key={idx} className={`${selectedSuppliers.length === 1 ? 'md:col-span-2' : ''} bg-[#1a1a1a] p-3 rounded border border-[#2a2a2a]`}>
            <div className="space-y-2">
              <div className="font-medium text-gray-200 flex items-center gap-2">
                <Building2 className="h-3 w-3" />
                {supplier.name || 'Unknown Supplier'}
                {supplier.isCustom && (
                  <span className="text-xs text-blue-400 bg-blue-500/20 px-2 py-1 rounded">Custom</span>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-1 text-xs">
                {supplier.phone_number && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone className="h-3 w-3" />
                    <span>{supplier.phone_number}</span>
                  </div>
                )}
                {supplier.contact_person && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <span>Contact: {supplier.contact_person}</span>
                  </div>
                )}
                {supplier.email && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Mail className="h-3 w-3" />
                    <span>{supplier.email}</span>
                  </div>
                )}
                {supplier.address && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin className="h-3 w-3" />
                    <span>{supplier.address}</span>
                  </div>
                )}
                {supplier.account_number && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Hash className="h-3 w-3" />
                    <span>Account: {supplier.account_number}</span>
                  </div>
                )}
                {supplier.city && (
                  <div className="text-gray-400">
                    <span>City: {supplier.city}</span>
                  </div>
                )}
                {supplier.province && (
                  <div className="text-gray-400">
                    <span>Province: {supplier.province}</span>
                  </div>
                )}
                {supplier.postal_code && (
                  <div className="text-gray-400">
                    <span>Postal: {supplier.postal_code}</span>
                  </div>
                )}
                {supplier.website && (
                  <div className="text-gray-400">
                    <span>Website: </span>
                    <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                      {supplier.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Legacy format support - if supplier_info has direct properties */}
        {!hasSupplierData && supplierInfo?.supplier_name && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Supplier:</span> {request.supplier_info.supplier_name}
          </div>
        )}
        {request.supplier_info?.contact_person && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Contact:</span> {request.supplier_info.contact_person}
          </div>
        )}
        {request.supplier_info?.phone_number && (
          <div className="text-gray-300 flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span className="text-gray-500 font-medium">Phone:</span> {request.supplier_info.phone_number}
          </div>
        )}
        {(request.supplier_info as any)?.email && (
          <div className="text-gray-300 flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="text-gray-500 font-medium">Email:</span> {(request.supplier_info as any).email}
          </div>
        )}
        {(request.supplier_info as any)?.account_number && (
          <div className="text-gray-300 flex items-center gap-2">
            <Hash className="h-3 w-3" />
            <span className="text-gray-500 font-medium">Account #:</span> {(request.supplier_info as any).account_number}
          </div>
        )}
        {(request.supplier_info as any)?.address && (
          <div className="text-gray-300 flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span className="text-gray-500 font-medium">Address:</span> {(request.supplier_info as any).address}
          </div>
        )}
        {(request.supplier_info as any)?.city && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">City:</span> {(request.supplier_info as any).city}
          </div>
        )}
        {(request.supplier_info as any)?.province && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Province:</span> {(request.supplier_info as any).province}
          </div>
        )}
        {(request.supplier_info as any)?.postal_code && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Postal Code:</span> {(request.supplier_info as any).postal_code}
          </div>
        )}
        {(request.supplier_info as any)?.website && (
          <div className="text-gray-300">
            <span className="text-gray-500 font-medium">Website:</span> 
            <a href={(request.supplier_info as any).website} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 ml-1">
              {(request.supplier_info as any).website}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
