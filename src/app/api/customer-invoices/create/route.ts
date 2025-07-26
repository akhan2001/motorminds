import { NextRequest, NextResponse } from 'next/server'
import { createCustomerInvoice } from '@/app/customer-invoice-intake/utils/customer-invoice-utils'

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    
    // Validate required fields
    const { shopId, customerId, vehicleId, serviceDescription, estimatedAmount } = body
    
    if (!shopId) {
      return NextResponse.json(
        { error: 'Shop ID is required' },
        { status: 400 }
      )
    }
    
    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID is required' },
        { status: 400 }
      )
    }
    
    if (!vehicleId) {
      return NextResponse.json(
        { error: 'Vehicle ID is required' },
        { status: 400 }
      )
    }
    
    if (!serviceDescription || serviceDescription.trim().length < 10) {
      return NextResponse.json(
        { error: 'Service description must be at least 10 characters' },
        { status: 400 }
      )
    }
    
    // Validate estimated amount (optional, but if provided must be valid)
    const parsedAmount = estimatedAmount ? parseFloat(estimatedAmount) : 0
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json(
        { error: 'Estimated amount must be a valid positive number' },
        { status: 400 }
      )
    }
    
    // Create the customer invoice
    const invoiceId = await createCustomerInvoice({
      shopId,
      customerId,
      vehicleId,
      serviceDescription: serviceDescription.trim(),
      estimatedAmount: parsedAmount
    })
    
    // Return success response
    return NextResponse.json({
      success: true,
      invoiceId,
      message: 'Customer invoice created successfully'
    }, { status: 201 })
    
  } catch (error) {
    console.error('Error in customer invoice creation API:', error)
    
    // Handle specific error types
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    // Generic error response
    return NextResponse.json(
      { error: 'Failed to create customer invoice' },
      { status: 500 }
    )
  }
}

// Handle preflight CORS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
} 