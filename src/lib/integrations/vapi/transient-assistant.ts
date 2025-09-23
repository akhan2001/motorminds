/**
 * Build a transient assistant configuration for parts ordering calls.
 * No server hooks or external tool URLs are used to avoid invalid localhost URLs.
 */
export function buildTransientMiaAssistant(callContext: any, firstMessage: string) {
    const shopName = callContext?.shop_info?.name || 'MotorMinds Auto Shop'
    const accountGeneral = callContext?.shop_info?.account_numbers?.general || 'MM-2024'
    const supplierName = callContext?.supplier_info?.name || 'the supplier'

    const vehicle = callContext?.vehicle_info || {}
    const parts = callContext?.parts_info || {}

    const systemPrompt = `You are Mia, calling automotive parts suppliers on behalf of ${shopName}.

GOAL: Efficiently obtain a quote for the requested part(s) and clearly capture:
- Price (unit and total), availability/stock, and delivery ETA/days.

CONTEXT:
- Supplier: ${supplierName}
- Shop account: ${accountGeneral}
- Vehicle: ${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''} ${vehicle.engine ? '(' + vehicle.engine + ')' : ''}
- VIN: ${vehicle.vin || ''}
- Part: ${parts.partName || parts.part_name || 'parts'} ${parts.partNumber ? '(PN: ' + parts.partNumber + ')' : ''}
- Quantity: ${parts.quantity || 1}
- Notes: ${parts.description || ''}

CALL FLOW:
1) Greet casually and state you’re calling from ${shopName}.
2) Provide account if asked: ${accountGeneral}.
3) Give vehicle/part details. Ask for price, availability, and delivery.
4) Confirm and restate the quote succinctly: part, unit price, total, stock/ETA.
5) Close politely and end the call.`

    return {
        model: {
            provider: 'openai',
            model: 'gpt-4o-mini',
            temperature: 0.5,
            maxTokens: 300,
            messages: [
                { role: 'system', content: systemPrompt }
            ]
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
        endCallMessage: 'Thanks for your help. Goodbye.'
    }
}


