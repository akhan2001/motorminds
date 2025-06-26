'use client'

import { useSearchParams, useParams } from 'next/navigation'
import { NewWorkOrder } from './components/newWorkOrder'
// import { EditWorkOrder } from './components/editWorkOrder'
import { ViewWorkOrder } from './components/viewWorkOrder'
import { getWorkOrder } from './WorkOrderActions'
import { useEffect, useState } from 'react'
import { WorkOrder } from '@/hooks/useWorkOrders'

export default function WorkOrderManager() {
  const params = useParams()
  const searchParams = useSearchParams()

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)

  // Assuming the route is /work-orders/[workOrderId]/[action]
  const workOrderId = params && Array.isArray(params.slug) ? params.slug[0] : undefined
  const action = params && Array.isArray(params.slug) ? params.slug[1] : undefined

  // Also checking search params for 'view'
  const view = searchParams ? searchParams.get('view') : null

  useEffect(() => {
    if (workOrderId) {
      setLoading(true)
      getWorkOrder(workOrderId)
        .then(wo => {
          setWorkOrder(wo)
          setLoading(false)
        })
        .catch(() => {
          setWorkOrder(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [workOrderId])

  if (view === 'new' || action === 'new') {
    return <NewWorkOrder />
  }

  if (loading) {
    return <div>Loading Work Order...</div>
  }
  
//   if (workOrderId && (view === 'edit' || action === 'edit')) {
//       return <EditWorkOrder workOrderId={workOrderId} />
//   }

  if (workOrderId && workOrder) {
    // This will be the default view if an ID is present
    return <ViewWorkOrder workOrder={workOrder} />
  }


  // Default view: can be a list of work orders or instructions.
  return (
    <div>
      <h1>Work Order Manager</h1>
      <p>
        Select a work order, or create a new one.
      </p>
    </div>
  )
}