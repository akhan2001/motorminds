import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        console.log('📊 Structured data received:', JSON.stringify(body, null, 2))

        // Extract structured data from Vapi's function call
        const structuredData = body.functionCall?.parameters || body.structuredData || body

        const {
            partNumber,
            partName,
            price,
            retailPrice,
            quantity = 1,
            availability,
            eta,
            deliveryDays,
            supplierPartNumber,
            brand,
            condition = 'new',
            warranty,
            minimumOrderQuantity,
            supplierName,
            contactPerson,
            quoteValidUntil,
            specialInstructions,
            coreCharge,
            shipping,
            quoteProbability,
            alternativeParts,
            // Additional context from call
            callId,
            partsRequestId,
            timestamp = new Date().toISOString()
        } = structuredData

        // Validate required fields
        if (!partNumber || !partName || !price || !availability || !eta || !supplierName) {
            return NextResponse.json({
                error: 'Missing required fields',
                required: ['partNumber', 'partName', 'price', 'availability', 'eta', 'supplierName'],
                received: Object.keys(structuredData)
            }, { status: 400 })
        }

        const supabase = await createClient()

        // Save structured data to database
        const { data: savedData, error: saveError } = await supabase
            .from('structured_parts_data')
            .insert({
                call_id: callId,
                parts_request_id: partsRequestId,
                part_number: partNumber,
                part_name: partName,
                price: Number(price),
                retail_price: retailPrice ? Number(retailPrice) : null,
                quantity: Number(quantity),
                availability,
                eta,
                delivery_days: deliveryDays ? Number(deliveryDays) : null,
                supplier_part_number: supplierPartNumber,
                brand,
                condition,
                warranty,
                minimum_order_quantity: minimumOrderQuantity ? Number(minimumOrderQuantity) : null,
                supplier_name: supplierName,
                contact_person: contactPerson,
                quote_valid_until: quoteValidUntil,
                special_instructions: specialInstructions,
                core_charge: coreCharge ? Number(coreCharge) : null,
                shipping_info: shipping || {},
                quote_probability: quoteProbability,
                alternative_parts: alternativeParts || [],
                extracted_at: timestamp,
                raw_data: structuredData
            })
            .select()
            .single()

        if (saveError) {
            console.error('❌ Database save error:', saveError)
            return NextResponse.json({
                error: 'Failed to save structured data',
                details: saveError.message
            }, { status: 500 })
        }

        // Also update the parts request if ID is provided
        if (partsRequestId) {
            try {
                const { error: updateError } = await supabase
                    .from('parts_requests')
                    .update({
                        status: 'quoted',
                        quote_provided: {
                            supplier_name: supplierName,
                            contact_person: contactPerson,
                            quote_date: timestamp,
                            parts: [{
                                part_name: partName,
                                part_number: partNumber,
                                quantity: Number(quantity),
                                supplier_part_number: supplierPartNumber,
                                availability,
                                cost_price: Number(price),
                                retail_price: retailPrice ? Number(retailPrice) : Number(price),
                                delivery_days: deliveryDays || 0,
                                eta,
                                notes: specialInstructions || '',
                                brand,
                                condition,
                                warranty
                            }],
                            total_quote: Number(price) * Number(quantity),
                            call_notes: `Structured data extracted automatically`,
                            quote_valid_until: quoteValidUntil
                        },
                        total_estimated_price: Number(price) * Number(quantity),
                        updated_at: timestamp
                    })
                    .eq('id', partsRequestId)

                if (updateError) {
                    console.error('⚠️ Failed to update parts request:', updateError)
                    // Don't fail the main request, just log the error
                }
            } catch (updateError) {
                console.error('⚠️ Parts request update error:', updateError)
            }
        }

        console.log('✅ Structured data saved successfully:', savedData.id)

        return NextResponse.json({
            success: true,
            message: 'Structured data extracted and saved successfully',
            instruction: 'Thank you for the information. I have recorded all the details.',
            data: {
                id: savedData.id,
                partNumber,
                partName,
                price,
                availability,
                eta,
                supplierName
            },
            // Tell Vapi to continue or end based on data completeness
            shouldContinue: !partNumber || !price || !availability
        })

    } catch (error: any) {
        console.error('❌ Error processing structured data:', error)
        return NextResponse.json({
            error: 'Failed to process structured data',
            details: error.message
        }, { status: 500 })
    }
}
