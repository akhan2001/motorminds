/**
 * Build a transient assistant configuration for parts ordering calls.
 * Optimized system prompt for Mia AI Parts Requesting Agent.
 */
export function buildTransientMiaAssistant(callContext: any, firstMessage: string) {
    const shopName = callContext?.shop_info?.name || 'MotorMinds Auto Shop'
    const accountGeneral = callContext?.shop_info?.account_numbers?.general || 'MM-2024'
    const supplierName = callContext?.supplier_info?.name || 'the supplier'

    const vehicle = callContext?.vehicle_info || {}
    const parts = callContext?.parts_info || {}

    const systemPrompt = `You are Mia, an AI service advisor for ${shopName}, calling ${supplierName}'s parts department.
Your role is to request a quote and capture clear details on price, availability, and delivery for automotive parts.

## OBJECTIVE
Get a reliable quote for the requested part(s) including:
- Unit price and total cost
- Stock/availability
- Delivery ETA (in days)

## CONTEXT
- Shop: ${shopName}
- Account #: ${accountGeneral}
- Supplier: ${supplierName}
- Vehicle: ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.engine ? '(' + vehicle.engine + ')' : ''}
- VIN: ${vehicle.vin || ''}
- Part: ${parts.partName || parts.part_name || 'parts'} ${parts.partNumber ? '(PN: ' + parts.partNumber + ')' : ''}
- Quantity: ${parts.quantity || 1}
- Notes: ${parts.description || ''}

## CALL FLOW
1. Start the call without introducing your name. Say: "I'm calling from ${shopName} looking for ${parts.partName || parts.part_name || 'parts'} for a ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}."
2. If asked, provide the account number: ${accountGeneral}.
3. Give clear vehicle + part details (name, number, year/make/model, quantity).
4. Ask directly: “Can you confirm price, availability, and delivery time?”
5. Confirm aloud: restate part name/number, unit price, total, stock/ETA.
6. Close politely: thank them, confirm order/quote is noted, and end the call.

## STYLE
- Professional, concise, confident
- Use clear automotive terminology
- Repeat part numbers, prices, and ETA clearly for accuracy
- Avoid chit-chat: stay focused on getting the quote
- Do not repeat the vehicle year/make/model more than once unless specifically asked
- Do not introduce yourself by name; start directly with the shop and request

## IMPORTANT
- Always summarize the quote before ending
- After summary, call the **end_call_tool** to hang up`

    // Build tools list with end_call_tool if a public HTTPS webhook is configured
    const tools: any[] = []
    const baseWebhook = process.env.NEXT_PUBLIC_SITE_URL || process.env.VAPI_PUBLIC_WEBHOOK_URL || ''
    const endCallUrl = baseWebhook ? `${baseWebhook.replace(/\/$/, '')}/api/vapi/end-call` : ''
    if (endCallUrl.startsWith('https://')) {
        tools.push({
            type: 'function',
            function: {
                name: 'end_call_tool',
                description: 'Ends the current phone call immediately after the quote summary.',
                parameters: { type: 'object', properties: { callId: { type: 'string', description: 'Vapi call ID (optional; usually passed via header)' } }, required: [] }
            },
            server: { url: endCallUrl, timeoutSeconds: 15 }
        })
    }

    // Add user-provided example tool
    tools.push({
        type: 'function',
        function: {
            name: 'check_inventory',
            description: "Check product inventory for the customer's specific region",
            parameters: {
                type: 'object',
                properties: {
                    productId: { type: 'string', description: 'The product ID to check' },
                    region: { type: 'string', description: "Customer's region code" }
                },
                required: ['productId', 'region']
            }
        },
        server: { url: 'https://api.customer-integration.com/inventory', timeoutSeconds: 30 }
    })

    // Optional webhook for call lifecycle events (requires public HTTPS base URL)
    const webhookBase = process.env.NEXT_PUBLIC_SITE_URL || process.env.VAPI_PUBLIC_WEBHOOK_URL || ''
    const webhookUrl = webhookBase ? `${webhookBase.replace(/\/$/, '')}/api/vapi/webhook` : ''

    return {
        model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.4,
            maxTokens: 300,
            messages: [
                { role: 'system', content: systemPrompt }
            ],
            tools
        },
        analysisPlan: {
            minMessagesThreshold: 2,
            summaryPlan: {
                enabled: true
            },
            structuredDataPlan: {
                enabled: true,
                schema: {
                    type: 'object',
                    properties: {
                        parts_info: {
                            type: 'object',
                            properties: {
                                part_name: { type: 'string' },
                                part_number: { type: 'string' },
                                quantity: { type: 'number' },
                                requested_part_number: { type: 'string' }
                            }
                        },
                        quote_details: {
                            type: 'object',
                            properties: {
                                unit_price: { type: 'number' },
                                total_cost: { type: 'number' },
                                currency: { type: 'string' },
                                availability: { type: 'string' },
                                delivery_eta: { type: 'string' },
                                delivery_days: { type: 'number' }
                            }
                        },
                        supplier_info: {
                            type: 'object',
                            properties: {
                                supplier_name: { type: 'string' },
                                contact_person: { type: 'string' },
                                account_used: { type: 'string' }
                            }
                        },
                        call_outcome: {
                            type: 'object',
                            properties: {
                                quote_provided: { type: 'boolean' },
                                quote_accepted: { type: 'boolean' },
                                follow_up_needed: { type: 'boolean' },
                                notes: { type: 'string' }
                            }
                        }
                    }
                }
            },
            successEvaluationPlan: {
                enabled: true,
                rubric: 'PassFail'
            }
        },
        voice: {
            provider: '11labs',
            voiceId: 'paula',
            speed: 1.05
        },
        transcriber: {
            provider: 'deepgram',
            model: 'nova-2',
            language: 'en'
        },
        firstMessage: firstMessage,
        firstMessageMode: 'assistant-speaks-first',
        endCallFunctionEnabled: true,
        endCallMessage: 'Thanks for your help. Goodbye.',
        ...(webhookUrl.startsWith('https://') ? { server: { url: webhookUrl } } : {})
    }
}
