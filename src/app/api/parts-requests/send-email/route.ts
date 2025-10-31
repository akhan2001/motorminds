import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/integrations/resend/resend-client'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
    console.log('Parts request email API route called')
    try {
        const body = await request.json()
        const { 
            partsRequestId, 
            shopId, 
            vehicleInfo, 
            partsRequested, 
            customerNotes, 
            notes, 
            totalEstimatedPrice,
            priority 
        } = body

        if (!partsRequestId || !shopId || !partsRequested || !Array.isArray(partsRequested) || partsRequested.length === 0) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get shop details
        console.log('Looking up shop with ID:', shopId)
        const supabase = await createClient()
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('shop_name, shop_email, shop_phone, shop_address, shop_city, shop_province')
            .eq('id', shopId)
            .single()
        
        console.log('Shop query result:', { shopData, shopError })
        
        // Use shop data if found, otherwise create fallback
        let shop
        if (shopData && !shopError) {
            shop = shopData
            console.log('Found existing shop:', shop)
        } else {
            console.log('Shop not found, using fallback')
            shop = {
                shop_name: 'Motorminds Shop',
                shop_email: 'info@motorminds.ca'
            }
        }

        // Format parts list
        const partsList = partsRequested.map((part: any, index: number) => {
            const partName = part.part_name || part.name || 'Unknown Part'
            const partNumber = part.part_number || part.articleNo || 'N/A'
            const quantity = part.quantity || 1
            const price = part.price || part.estimated_price || 0
            const supplier = part.supplier || 'N/A'
            
            return `
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${index + 1}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">
                        <strong>${partName}</strong><br>
                        <small style="color: #666;">Part #: ${partNumber}</small>
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${quantity}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">$${price.toFixed(2)} CAD</td>
                    <td style="padding: 8px; border-bottom: 1px solid #ddd;">${supplier}</td>
                </tr>
            `
        }).join('')

        // Format vehicle info
        let vehicleSection = ''
        if (vehicleInfo) {
            const vehicleDetails = []
            if (vehicleInfo.customer_name) vehicleDetails.push(`<p><strong>Customer:</strong> ${vehicleInfo.customer_name}</p>`)
            if (vehicleInfo.year) vehicleDetails.push(`<p><strong>Year:</strong> ${vehicleInfo.year}</p>`)
            if (vehicleInfo.make) vehicleDetails.push(`<p><strong>Make:</strong> ${vehicleInfo.make}</p>`)
            if (vehicleInfo.model) vehicleDetails.push(`<p><strong>Model:</strong> ${vehicleInfo.model}</p>`)
            if (vehicleInfo.engine?.engineName) vehicleDetails.push(`<p><strong>Engine:</strong> ${vehicleInfo.engine.engineName}</p>`)
            
            if (vehicleDetails.length > 0) {
                vehicleSection = `
                    <h3 style="margin-top: 20px;">Vehicle Information</h3>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                        ${vehicleDetails.join('')}
                    </div>
                `
            }
        }

        // Create email content
        const subject = `Parts Request - ${partsRequestId.substring(0, 8)} - ${shop.shop_name}`
        const emailBody = `
            <h2>New Parts Request</h2>
            <p><strong>Shop:</strong> ${shop.shop_name}</p>
            <p><strong>Request ID:</strong> ${partsRequestId}</p>
            <p><strong>Priority:</strong> ${priority || 'normal'}</p>
            <p><strong>Created:</strong> ${new Date().toLocaleString('en-CA')}</p>
            
            ${vehicleSection}
            
            <h3 style="margin-top: 20px;">Parts Requested</h3>
            <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
                <thead>
                    <tr style="background: #333; color: white;">
                        <th style="padding: 10px; text-align: left;">#</th>
                        <th style="padding: 10px; text-align: left;">Part Name</th>
                        <th style="padding: 10px; text-align: left;">Quantity</th>
                        <th style="padding: 10px; text-align: left;">Price</th>
                        <th style="padding: 10px; text-align: left;">Supplier</th>
                    </tr>
                </thead>
                <tbody>
                    ${partsList}
                </tbody>
            </table>
            
            ${totalEstimatedPrice ? `<p style="margin-top: 15px;"><strong>Total Estimated Price: $${totalEstimatedPrice.toFixed(2)} CAD</strong></p>` : ''}
            
            ${customerNotes ? `
                <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #2196f3;">
                    <p style="margin: 0;"><strong>Customer Notes:</strong></p>
                    <p style="margin: 5px 0 0 0;">${customerNotes.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${notes ? `
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #ffc107;">
                    <p style="margin: 0;"><strong>Shop Notes:</strong></p>
                    <p style="margin: 5px 0 0 0;">${notes.replace(/\n/g, '<br>')}</p>
                </div>
            ` : ''}
            
            ${shop.shop_phone ? `<p><strong>Shop Phone:</strong> ${shop.shop_phone}</p>` : ''}
            ${shop.shop_email ? `<p><strong>Shop Email:</strong> ${shop.shop_email}</p>` : ''}
            
            <hr style="margin: 20px 0;">
            <p><small>This parts request was submitted via the Motorminds application.</small></p>
            <p><small>To respond, please visit: <a href="https://app.motorminds.ca/admin/parts-requests">Admin Dashboard</a></small></p>
        `

        // Send email via Resend
        const { data, error } = await resend.emails.send({
            from: `Motorminds Parts <${process.env.RESEND_FROM_EMAIL || 'noreply@motorminds.ca'}>`,
            to: [process.env.FEEDBACK_EMAIL || 'info@motorminds.ca'],
            replyTo: shop.shop_email || 'info@motorminds.ca',
            subject: subject,
            html: emailBody,
        })

        if (error) {
            console.error('Resend email error:', error)
            return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
        }

        return NextResponse.json({ 
            success: true, 
            resendId: data?.id 
        })

    } catch (error) {
        console.error('Parts request email API error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

