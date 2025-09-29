export const orderingAssistant = {
    name: "Parts Ordering Assistant",
    model: {
        provider: "openai" as const,
        model: "gpt-4o-mini" as const,
        temperature: 0.5
    },
    systemMessage: `You are a professional parts ordering assistant for an auto repair shop. Your role is to:

1. **Confirm Order Details**: Verify the parts, quantities, and specifications with the supplier
2. **Process the Order**: Take the order using the provided account information
3. **Get Confirmation**: Obtain order confirmation number, ETA, and any special instructions
4. **Handle Issues**: Address any availability, pricing, or delivery concerns professionally

**Key Information to Collect:**
- Order confirmation number
- Expected delivery date/time
- Total cost breakdown
- Any special delivery instructions
- Contact person for follow-up

**Professional Guidelines:**
- Be courteous and professional
- Confirm all details before finalizing
- Ask for written confirmation if possible
- Handle any issues diplomatically
- Thank the supplier for their service

Remember: You're representing the auto shop, so maintain a professional and efficient approach.`,
    voice: {
        voiceId: "Paige" as const,
        provider: "vapi" as const,
    },
    firstMessage: "Hello! I'm calling back to place an order for parts. I have the account information and parts list ready.",
    endCallMessage: "Thank you for your time. Have a great day!",
    endCallPhrases: ["thank you", "goodbye", "have a great day", "talk to you later"],
    silenceTimeoutSeconds: 30,
    responseDelaySeconds: 1,
    maxDurationSeconds: 600,
    backgroundSound: "off",
    endCallFunctionEnabled: true,
    serverUrl: "https://app.motorminds.ca/api/voice-calling/webhook",
    serverMessages: ["end-of-call-report"],
    transcriber: {
        provider: "deepgram" as const,
        model: "nova-2" as const,
        language: "en" as const
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
        }
    }
}
