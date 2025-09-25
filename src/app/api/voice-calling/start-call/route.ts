import { vapi } from "@/lib/integrations/vapi/vapi-client"
import { MiaCallingService } from "@/app/(features)/voice-calling/lib/mia-calling-service"
import { getShopIdForUser } from "@/utils/get-shop-id"
import { formatPhoneNumberE164, isValidPhoneNumber } from "@/utils/format-phone"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            vehicle_info,
            parts_info,
            suppliers,
            priority,
            notes,
            parts_request_id,
            user_id
        } = body

        // Get first supplier for the call
        if (!suppliers || !Array.isArray(suppliers) || suppliers.length === 0) {
            return NextResponse.json(
                { error: 'No suppliers provided' },
                { status: 400 }
            )
        }

        const supplier = suppliers[0]
        const rawPhoneNumber = supplier.phone_number
        const supplier_name = supplier.name
        const supplier_contact_person = supplier.contact_person
        const supplier_id = supplier.id

        if (!rawPhoneNumber) {
            return NextResponse.json(
                { error: 'Supplier phone number is required' },
                { status: 400 }
            )
        }

        // Format and validate phone number
        if (!isValidPhoneNumber(rawPhoneNumber)) {
            return NextResponse.json(
                { error: 'Invalid phone number format' },
                { status: 400 }
            )
        }

        const phone_number = formatPhoneNumberE164(rawPhoneNumber)

        // Get shop ID from authenticated user
        const userShopId = await getShopIdForUser()
        if (!userShopId) {
            return NextResponse.json(
                { error: 'Shop ID not found for user' },
                { status: 403 }
            )
        }

        // Create dynamic system prompt with form context
        const systemPrompt = `**VAPI Parts Quote Request Prompt**

[Identity]  
You are Mia, an AI assistant calling on behalf of AutoPro Mechanics to request parts quotes. Provide the account number if the supplier asks for one.

[Tone]
Direct, efficient, and clear. Focus on speed and efficiency.

1. **Vehicle & Parts Request**  
   - "Vehicle: ${vehicle_info.year} ${vehicle_info.make} ${vehicle_info.model}"  
   - "Parts needed: ${parts_info.quantity} ${parts_info.partName}${parts_info.partNumber ? `, part number ${parts_info.partNumber}` : ''}${vehicle_info.engine ? `. Engine: ${vehicle_info.engine}` : ''}."
   ${parts_info.description ? `- "Additional details: ${parts_info.description}"` : ''}

2. **Quote Information**  
   - "Can you provide the price, availability, and delivery time for these parts?"

3. **Details to Collect**  
   - Part availability: In stock/Backordered/Discontinued  
   - Shop price: $[PRICE]  
   - Delivery time: [DELIVERY_DAYS] business days  
   - Part number: [PART_NUMBER]  
   - Contact person name: [CONTACT_NAME]  

4. **Confirmation and End**  
   - "Just to confirm, that's ${parts_info.quantity} ${parts_info.partName} for $[PRICE], available, delivery in [DELIVERY_DAYS] business days."  
   - "Perfect, I have everything. Thank you, goodbye."

5. **On Hold**
    - When the parts supplier put you on hold, you should wait until the user speaks again. There may be background noise and call waiting music. Just wait until someone speaks againa and says "Hello" or "Thanks for holding".

**Fallback/Clarification Handling**  
- If unclear, request clarification on missing info:  
  - "Could you confirm the part number or price again?"  
  - "Can you clarify the delivery time for me?"
  - There will be moments of silence because the user is looking for parts, so you should wait until the user speaks again.

**Priority Level**: ${priority}
**Shop Notes**: ${notes || 'None'}
`;

        // Create call session with Vapi using transient assistant
        const call = await vapi.calls.create({
            phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
            customer: { 
                number: phone_number 
            },
            assistant: {
                model: {
                    provider: "openai",
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: systemPrompt
                        }
                    ],
                    temperature: 0.7
                },
                voice: {
                    voiceId: "Paige",
                    provider: "vapi",
                },
                backgroundSound: "off",
                firstMessage: "Hi, I'm calling to place a parts order.",
                recordingEnabled: true,
                endCallMessage: "Thanks for the quote. We'll call back again to place the order if needed.",
                endCallFunctionEnabled: true,
                silenceTimeoutSeconds: 300,
                transcriber: {
                    provider: "deepgram",
                    model: "nova-2",
                    language: "en"
                },
                analysisPlan: {
                    summaryPlan: {
                        messages: [
                            {
                                content: "You are analyzing a voice call between Mia AI (representing an auto shop) and a parts supplier. \n\nCreate a concise summary that includes:\n\n1. **Call Outcome**: Was the call successful? (Quote received, voicemail, busy, no answer, etc.)\n2. **Parts Discussed**: What specific parts were requested?\n3. **Vehicle Information**: Year, make, model mentioned\n4. **Supplier Response**: \n   - Availability (in stock, backorder, discontinued)\n   - Pricing information provided\n   - Delivery timeframe\n   - Part numbers given\n5. **Contact Information**: Who was spoken to at the supplier\n6. **Next Steps**: Any follow-up actions mentioned\n\nKeep the summary under 200 words and focus on actionable information that would help the auto shop owner understand the call results at a glance.\n",
                                role: "system"
                            },
                            {
                                content: "Here is the transcript:\n\n{{transcript}}\n\n. Here is the ended reason of the call:\n\n{{endedReason}}\n\n",
                                role: "user"
                            }
                        ]
                    },
                    structuredDataPlan: {
                        enabled: true,
                        messages: [
                            {
                                content: "Extract structured data from this voice call conversation between Mia AI and a parts supplier.\n\nReturn a JSON object with the following structure:\n\n{\n  \"call_outcome\": {\n    \"status\": \"successful|partial|failed|voicemail|no_answer\",\n    \"contact_person\": \"Name of person spoken to\",\n    \"department\": \"Parts, Service, Sales, etc.\",\n    \"notes\": \"Any additional important notes\"\n  },\n  \"supplier_info\": {\n    \"supplier_name\": \"Name from conversation\",\n    \"contact_person\": \"Primary contact name\",\n    \"phone_number\": \"Phone number if mentioned\",\n    \"account_number\": \"Account number if provided\"\n  },\n  \"parts_info\": [\n    {\n      \"part_name\": \"Brake Pads\",\n      \"part_number\": \"BP-1234\",\n      \"brand\": \"Brembo\",\n      \"quantity\": 2,\n      \"vehicle_application\": \"2015 Chevrolet Cruze\",\n      \"availability\": \"in_stock|backorder|discontinued|unknown\",\n      \"unit_price\": 85.00,\n      \"total_price\": 170.00,\n      \"delivery_days\": 3,\n      \"delivery_method\": \"standard|expedited|pickup\",\n      \"warranty\": \"Warranty information if mentioned\",\n      \"notes\": \"Any part-specific notes\"\n    }\n  ],\n  \"quote_details\": {\n    \"subtotal\": 170.00,\n    \"shipping_cost\": 15.00,\n    \"tax\": 13.60,\n    \"total_cost\": 198.60,\n    \"currency\": \"USD\",\n    \"quote_valid_until\": \"2024-01-15\",\n    \"payment_terms\": \"Net 30, COD, etc.\",\n    \"minimum_order\": \"Minimum order amount if mentioned\"\n  },\n  \"vehicle_info\": {\n    \"year\": \"2015\",\n    \"make\": \"Chevrolet\",\n    \"model\": \"Cruze\",\n    \"engine\": \"1.4L Turbo\",\n    \"vin\": \"VIN if mentioned\",\n    \"mileage\": \"Mileage if relevant\"\n  },\n  \"next_steps\": {\n    \"order_ready\": true,\n    \"requires_approval\": false,\n    \"follow_up_needed\": false,\n    \"follow_up_date\": \"2024-01-10\",\n    \"additional_info_needed\": \"Any missing information\",\n    \"special_instructions\": \"Special ordering instructions\"\n  },\n  \"call_metadata\": {\n    \"call_duration\": \"Duration in seconds if available\",\n    \"call_quality\": \"good|fair|poor\",\n    \"language\": \"en\",\n    \"timestamp\": \"Call timestamp if available\"\n  }\n}\n\nImportant guidelines:\n- Only include fields with actual data from the conversation\n- Use null for unavailable information\n- Ensure pricing is in decimal format (85.00, not $85)\n- Use ISO date format (YYYY-MM-DD) for dates\n- Be conservative with assumptions - if uncertain, use null\n- Standardize availability values to the exact options provided\n- Extract exact part numbers, don't guess or abbreviate\n\nIf multiple parts were discussed, include each as a separate object in the parts_info array.\n\nJson Schema:\n{{schema}}\n\nOnly respond with the JSON.",
                                role: "system"
                            },
                            {
                                content: "Here is the transcript:\n\n{{transcript}}\n\n. Here is the ended reason of the call:\n\n{{endedReason}}\n\n",
                                role: "user"
                            }
                        ]
                    },
                    successEvaluationPlan: {
                        messages: [
                            {
                                content: "Determine if this voice call was successful based on the conversation content.\n\nA call is considered SUCCESSFUL if:\nConnected to a live person (not voicemail)\nDiscussed the requested parts\nReceived pricing information OR availability status\nObtained part numbers or specifications\nGot delivery timeframe information\nCompleted the quote request process\n\nA call is considered UNSUCCESSFUL if:\nReached voicemail only\nCall was not answered\nHung up immediately\nUnable to discuss parts (wrong department, etc.)\nNo pricing or availability information provided\nTechnical issues prevented communication\n\nReturn only one of these values:\n- \"successful\" - Quote information was obtained\n- \"partial\" - Some information obtained but incomplete\n- \"failed\" - No useful information obtained\n- \"voicemail\" - Reached voicemail\n- \"no_answer\" - Call was not answered\n- \"technical_issue\" - Call had technical problems\n\nConsider the overall value of information obtained for the auto shop's parts ordering process.\n\nRubric:\n\n{{rubric}}\n\nOnly respond with the evaluation result.",
                                role: "system"
                            },
                            {
                                content: "Here is the transcript of the call:\n\n{{transcript}}\n\n. Here is the ended reason of the call:\n\n{{endedReason}}\n\n",
                                role: "user"
                            },
                            {
                                content: "Here was the system prompt of the call:\n\n{{systemPrompt}}\n\n",
                                role: "user"
                            }
                        ]
                    }
                }
            }
        })

        // Log the call in our database
        // Only include supplier_id if it's a valid UUID format
        const isValidUUID = (str: string) => {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            return uuidRegex.test(str);
        };

        const voiceCallLog = await MiaCallingService.createVoiceCallLog({
            shop_id: userShopId,
            phone_number,
            vapi_call_id: call.id,
            parts_request_id,
            supplier_id: supplier_id && isValidUUID(supplier_id) ? supplier_id : null,
            user_id: user_id && isValidUUID(user_id) ? user_id : null
        })

        return NextResponse.json({
            success: true,
            callId: call.id,
            voiceCallId: voiceCallLog.id,
            message: 'Call initiated successfully'
        })

    } catch (error: any) {
        console.error('Error starting call:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to start call' },
            { status: 500 }
        )
    }
}