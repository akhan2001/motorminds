/**
 * Vapi Assistant Configuration for Mia AI - Parts Requesting
 * Pre-configured assistant ID: 8f1236c2-aba3-4741-8a12-3227c72de173
 */

export interface VapiAssistantConfiguration {
    id: string
    orgId: string
    name: string
    voice: {
        voiceId: string
        provider: string
    }
    createdAt: string
    updatedAt: string
    model: {
        model: string
        toolIds: string[]
        messages: Array<{
            role: string
            content: string
        }>
        provider: string
        temperature: number
    }
    recordingEnabled: boolean
    firstMessage: string
    voicemailMessage: string
    endCallFunctionEnabled: boolean
    endCallMessage: string
    transcriber: {
        model: string
        language: string
        numerals: boolean
        provider: string
        endpointing: number
    }
    clientMessages: string[]
    endCallPhrases: string[]
    hipaaEnabled: boolean
    analysisPlan: {
        minMessagesThreshold: number
    }
    backgroundDenoisingEnabled: boolean
    startSpeakingPlan: {
        waitSeconds: number
        smartEndpointingEnabled: string
    }
    isServerUrlSecretSet: boolean
}

export const MIA_ASSISTANT_CONFIG: VapiAssistantConfiguration = {
    id: "8f1236c2-aba3-4741-8a12-3227c72de173",
    orgId: "ef9bd12c-d19c-49a7-8ead-b9bdc6443802",
    name: "Mia AI - Parts Requesting",
    voice: {
        voiceId: "Paige",
        provider: "vapi"
    },
    createdAt: "2025-09-19T03:36:06.398Z",
    updatedAt: "2025-09-24T16:15:37.705Z",
    model: {
        model: "gpt-5-nano",
        toolIds: [
            "2db0e30c-90ee-449c-b841-3957d217d67e"
        ],
        messages: [
            {
                role: "system",
                content: `**VAPI Parts Quote Request Prompt**

[Identity]  
Mia, AI assistant calling on behalf of auto shops to request parts quotes.

[Tone]  
Direct, efficient, and clear. Focus on speed and professionalism.

---

**[VAPI Prompt]**

1. **Introduction**  
   - "Hi, this is Mia calling from AutoPro Mechanics. I need a quick quote for parts."

2. **Vehicle & Parts Request**  
   - "Vehicle: 2015 Chevrolet Cruze"  
   - "Parts needed: 2 Brembo brake pads for front axle. Engine: 1.4L Turbo."

3. **Quote Information**  
   - "Can you provide the price, availability, and delivery time for these parts?"

4. **Details to Collect**  
   - Part availability: In stock/Backordered/Discontinued  
   - Shop price: $[PRICE]  
   - Delivery time: [DELIVERY_DAYS] business days  
   - Part number: [PART_NUMBER]  
   - Contact person name: [CONTACT_NAME]  

5. **Confirmation and End**  
   - "Just to confirm, that's 2 Brembo brake pads for $150, available, delivery in 3 business days."  
   - "Perfect, I have everything. Thank you, goodbye."

6. **Save & End Call**  
   - Trigger savePartsInfo function with gathered details.  
   - Immediately terminate call via end_call_tool function.

---

**Fallback/Clarification Handling**  
- If unclear, request clarification on missing info:  
  - "Could you confirm the part number or price again?"  
  - "Can you clarify the delivery time for me?"`
            }
        ],
        provider: "openai",
        temperature: 0.5
    },
    recordingEnabled: false,
    firstMessage: "Hi, I'm calling to place a parts order. Can I speak with parts department?",
    voicemailMessage: "Hello, this is Riley from Wellness Partners. I'm calling about your appointment. Please call us back at your earliest convenience so we can confirm your scheduling details.",
    endCallFunctionEnabled: true,
    endCallMessage: "Thanks for the order. Expecting delivery [DATE]. Order confirmation [NUMBER]. Good day",
    transcriber: {
        model: "nova-3",
        language: "en",
        numerals: true,
        provider: "deepgram",
        endpointing: 150
    },
    clientMessages: [
        "conversation-update",
        "function-call",
        "hang",
        "model-output",
        "speech-update",
        "status-update",
        "transfer-update",
        "transcript",
        "tool-calls",
        "user-interrupted",
        "voice-input",
        "workflow.node.started"
    ],
    endCallPhrases: [
        "goodbye",
        "talk to you soon"
    ],
    hipaaEnabled: false,
    analysisPlan: {
        minMessagesThreshold: 2
    },
    backgroundDenoisingEnabled: true,
    startSpeakingPlan: {
        waitSeconds: 0.4,
        smartEndpointingEnabled: "livekit"
    },
    isServerUrlSecretSet: false
}

/**
 * Helper functions for working with the assistant configuration
 */
export class MiaAssistantHelper {
    /**
     * Get the assistant ID for Mia AI
     */
    static getAssistantId(): string {
        return MIA_ASSISTANT_CONFIG.id
    }

    /**
     * Get the tool IDs used by Mia AI
     */
    static getToolIds(): string[] {
        return MIA_ASSISTANT_CONFIG.model.toolIds
    }

    /**
     * Get the end call tool ID
     */
    static getEndCallToolId(): string {
        return MIA_ASSISTANT_CONFIG.model.toolIds[0] // "2db0e30c-90ee-449c-b841-3957d217d67e"
    }

    /**
     * Get the system prompt for Mia AI
     */
    static getSystemPrompt(): string {
        return MIA_ASSISTANT_CONFIG.model.messages[0].content
    }

    /**
     * Get the voice configuration
     */
    static getVoiceConfig() {
        return MIA_ASSISTANT_CONFIG.voice
    }

    /**
     * Get the transcriber configuration
     */
    static getTranscriberConfig() {
        return MIA_ASSISTANT_CONFIG.transcriber
    }

    /**
     * Check if recording is enabled
     */
    static isRecordingEnabled(): boolean {
        return MIA_ASSISTANT_CONFIG.recordingEnabled
    }

    /**
     * Get the first message Mia will say
     */
    static getFirstMessage(): string {
        return MIA_ASSISTANT_CONFIG.firstMessage
    }

    /**
     * Get the end call message
     */
    static getEndCallMessage(): string {
        return MIA_ASSISTANT_CONFIG.endCallMessage
    }

    /**
     * Get the end call phrases that trigger call termination
     */
    static getEndCallPhrases(): string[] {
        return MIA_ASSISTANT_CONFIG.endCallPhrases
    }

    /**
     * Get client messages that should be sent to the client
     */
    static getClientMessages(): string[] {
        return MIA_ASSISTANT_CONFIG.clientMessages
    }

    /**
     * Get the full configuration object
     */
    static getFullConfig(): VapiAssistantConfiguration {
        return MIA_ASSISTANT_CONFIG
    }
}

export default MIA_ASSISTANT_CONFIG
