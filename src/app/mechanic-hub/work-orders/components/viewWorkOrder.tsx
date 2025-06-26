'use client'

import React from 'react'
import { WorkOrder } from '@/hooks/useWorkOrders'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ViewWorkOrderProps {
  workOrder: WorkOrder
}

export function ViewWorkOrder({ workOrder }: ViewWorkOrderProps) {
  if (!workOrder) {
    return <div>Work Order not found.</div>
  }

  const { customers, repair_order_details, status } = workOrder
  const details = repair_order_details?.[0]
  const vehicle = customers?.customer_vehicles?.[0]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Order Details</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <p>
            <strong>Status:</strong> {status}
          </p>
          <p>
            <strong>Customer:</strong> {customers?.customer_name}
          </p>
          <p>
            <strong>Vehicle:</strong> {vehicle?.year} {vehicle?.make} {vehicle?.model}
          </p>
          <p>
            <strong>Description:</strong> {details?.description}
          </p>
          <p>
            <strong>Mechanic:</strong> {details?.Assigned_to || 'Unassigned'}
          </p>
          <p>
            <strong>Notes:</strong> {details?.notes}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
