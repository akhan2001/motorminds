import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

// POST - Start a voice call to a specific supplier
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user and shop ID
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const shopId = request.headers.get('x-shop-id') || user.user_metadata?.shop_id
    if (!shopId) {
      return NextResponse.json({ error: 'Shop ID required' }, { status: 400 })
    }

    const { supplierId, partsRequests = [] } = await request.json()

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    // Get supplier information
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', supplierId)
      .eq('shop_id', shopId)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    if (!supplier.phone_number) {
      return NextResponse.json({ error: 'Supplier has no phone number' }, { status: 400 })
    }

    // Get parts requests for this supplier if not provided
    let parts = partsRequests
    if (parts.length === 0) {
      const { data: pendingParts } = await supabase
        .from('parts_requests')
        .select('*')
        .eq('supplier_id', supplierId)
        .eq('shop_id', shopId)
        .eq('status', 'pending')
        .limit(5)

      parts = pendingParts || []
    }

    // Create voice call record
    const { data: voiceCall, error: callError } = await supabase
      .from('voice_calls')
      .insert({
        shop_id: shopId,
        supplier_id: supplierId,
        phone_number: supplier.phone_number,
        purpose: 'parts_ordering',
        status: 'pending',
        parts_discussed: parts
      })
      .select()
      .single()

    if (callError) {
      console.error('Error creating voice call record:', callError)
      return NextResponse.json({ error: 'Failed to create call record' }, { status: 500 })
    }

    // Prepare parts summary for AI prompt
    const partsSummary = parts.map(part => 
      `${part.part_number} - ${part.part_name} (Qty: ${part.quantity})`
    ).join(', ')

    // Call the main voice calling API
    const voiceResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/voice/start-call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-shop-id': shopId,
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({
        phoneNumber: supplier.phone_number,
        context: {
          supplier: {
            name: supplier.name,
            contact_person: supplier.contact_person,
            account_number: supplier.account_number
          },
          parts: parts,
          callId: voiceCall.id
        },
        customPrompt: `You are calling ${supplier.name} on behalf of MotorMinds auto shop. 
        ${supplier.contact_person ? `Ask for ${supplier.contact_person}.` : ''}
        ${supplier.account_number ? `Our account number is ${supplier.account_number}.` : ''}
        
        We need to order the following parts: ${partsSummary}
        
        For each part, get:
        1. Availability (in stock, estimated delivery date)
        2. Current price in CAD
        3. Minimum order quantity
        4. Any substitutes if not available
        
        Be professional and efficient. Take notes on pricing and availability.`
      })
    })

    const voiceData = await voiceResponse.json()

    if (voiceResponse.ok) {
      // Update voice call with Vapi call ID
      await supabase
        .from('voice_calls')
        .update({
          vapi_call_id: voiceData.callId,
          status: 'calling'
        })
        .eq('id', voiceCall.id)

      return NextResponse.json({
        success: true,
        callId: voiceCall.id,
        vapiCallId: voiceData.callId,
        supplier: {
          name: supplier.name,
          phone_number: supplier.phone_number
        },
        partsCount: parts.length
      })
    } else {
      // Update call status to failed
      await supabase
        .from('voice_calls')
        .update({ status: 'failed' })
        .eq('id', voiceCall.id)

      return NextResponse.json({ 
        error: voiceData.error || 'Failed to start voice call' 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Call supplier error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
