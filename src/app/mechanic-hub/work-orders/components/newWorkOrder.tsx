'use client'

import React from 'react'
import { WorkOrderForm } from '@/components/work-order-form' // Assuming this is a general purpose form
import { createWorkOrder } from '../WorkOrderActions'
import { useRouter } from 'next/navigation'

export function NewWorkOrder() {
  const router = useRouter()

  const handleSave = async (formData: any) => {
    try {
      // The formData from WorkOrderForm might need to be transformed
      // into the structure expected by createWorkOrder.
      await createWorkOrder(formData)
      router.push('/mechanic-hub')
    } catch (error) {
      console.error('Failed to create work order:', error)
      // Handle error display to the user
    }
  }

  const handleClose = () => {
    router.back()
  }

  return <WorkOrderForm onSave={handleSave} onClose={handleClose} />
}
