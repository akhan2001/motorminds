/**
 * Dynamic Assistant Configuration for VAPI Parts Sourcing
 * Generates personalized system prompts based on call context
 */

export interface CallContext {
    vehicle_info: {
        year: string
        make: string
        model: string
        engine?: string
        vin?: string
        mileage?: string
    }
    parts_info: {
        partName: string
        partNumber?: string
        quantity: number
        description?: string
    }
    priority: string
    notes?: string
    shop_name?: string
}

/**
 * Generate dynamic system prompt for VAPI assistant
 */
export function generateSystemPrompt(context: CallContext): string {
    const { vehicle_info, parts_info, priority, notes, shop_name = "AutoPro Mechanics" } = context

    return `**VAPI Parts Quote Request Prompt**

[Identity]
You are Mia, an AI assistant calling on behalf of ${shop_name} to request parts quotes. Provide the account number if the supplier asks for one.

[Tone]
Have a natural and casual tone while being efficient, and clear. Don't keep repeating your sentences (ex. "yes, i want the part for the [year] [make] [model]"). Only mention any additional information, if they ask for it.

1. **Vehicle & Parts Request**  
   - "Vehicle: ${vehicle_info.year} ${vehicle_info.make} ${vehicle_info.model}"  
   - "Parts needed: ${parts_info.quantity} ${parts_info.partName}${parts_info.partNumber ? `, part number ${parts_info.partNumber}` : ''}."
   ${parts_info.description ? `- "Additional details: ${parts_info.description}"` : ''}
   ${vehicle_info.engine ? `- "Engine: ${vehicle_info.engine}"` : ''} 

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
   - When the parts supplier put you on hold, you should wait until the user speaks again. There may be background noise and call waiting music. Just wait until someone speaks again and says "Hello" or "Thanks for holding".

**Fallback/Clarification Handling**  
- If unclear, request clarification on missing info:  
  - "Could you confirm the part number or price again?"  
  - "Can you clarify the delivery time for me?"
  - There will be moments of silence because the user is looking for parts, so you should wait until the user speaks again.

**Priority Level**: ${priority}
**Shop Notes**: ${notes || 'None'}
`
}

/**
 * Generate VAPI assistant configuration with dynamic prompt
 */
export function createDynamicAssistant(context: CallContext) {
    return {
        model: {
            provider: "openai" as const,
            model: "gpt-4o-mini" as const,
            messages: [
                {
                    role: "system" as const,
                    content: generateSystemPrompt(context)
                }
            ],
            temperature: 0.5
        },
        voice: {
            voiceId: "Paige" as const,
            provider: "vapi" as const,
        },
        backgroundSound: "off",
        firstMessage: "Hi, I'm calling to request a quote for parts.",
        endCallMessage: "Thanks for the quote. We'll call back again to place the order if needed.",
        voicemailMessage: "Hi,I was calling to request a quote for parts please call us back. Thank you.",
        transcriber: {
            provider: "deepgram" as const,
            model: "nova-2" as const,
            language: "en" as const
        },
        endCallFunctionEnabled: true,
        serverUrl: "https://app.motorminds.ca/api/voice-calling/webhook",
        serverMessages: ["end-of-call-report"],
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
}