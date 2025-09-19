import { VapiClient } from "@vapi-ai/server-sdk";

// Initialize Vapi client
export const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY!
});

// Interface for call creation parameters
export interface CreateCallParams {
    phoneNumber: string;
    assistantId?: string;
    phoneNumberId?: string;
    metadata?: Record<string, any>;
}

// Create an outbound call
export async function createVoiceCall(params: CreateCallParams) {
    const { phoneNumber, assistantId, phoneNumberId } = params;
    
    const call = await vapi.calls.create({
        phoneNumberId: phoneNumberId || process.env.VAPI_PHONE_NUMBER_ID!,
        customer: { number: phoneNumber },
        assistantId: assistantId || process.env.VAPI_ASSISTANT_ID!
    });

    return call;
}

// Get call status
export async function getCallStatus(callId: string) {
    const call = await vapi.calls.get(callId);
    return call;
}

// List recent calls
export async function getRecentCalls(limit: number = 10) {
    const calls = await vapi.calls.list({ limit });
    return calls;
}
