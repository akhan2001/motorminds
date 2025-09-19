// process_parts_order

// Function Name: process_parts_order
// URL: https://motorminds.ca/api/voice/process-order
// Method: POST

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
    const { order_data } = await request.json()

    console.log('order_data', order_data)

    return NextResponse.json({ message: 'Order processed successfully' })
}