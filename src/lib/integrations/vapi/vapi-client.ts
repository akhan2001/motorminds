import { VapiClient } from "@vapi-ai/server-sdk";

// Initialize Vapi client
export const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY!
});

// Your pre-configured assistant ID
export const MIA_ASSISTANT_ID = '8f1236c2-aba3-4741-8a12-3227c72de173';

/**
 * Create a call with your pre-configured assistant and rich context
 */
export async function createMiaCall(phoneNumber: string, callContext?: any) {
    console.log('🤖 Creating call with Mia assistant:', MIA_ASSISTANT_ID);
    
    // Structure the context data for the assistant
    const contextData = {
        source: 'motorminds',
        timestamp: new Date().toISOString(),
        call_context: {
            shop_info: callContext?.shop_info || {},
            supplier_info: callContext?.supplier_info || {},
            vehicle_info: callContext?.vehicle_info || {},
            parts_info: callContext?.parts_info || {},
            parts_request_id: callContext?.parts_request_id
        }
    };

    console.log('📋 Call context being sent:', JSON.stringify(contextData, null, 2));
    
    const call = await vapi.calls.create({
        phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID!,
        customer: { 
            number: phoneNumber 
        },
        assistantId: MIA_ASSISTANT_ID,
        metadata: contextData
    });
    
    return call;
}

/**
 * Get call status
 */
export async function getCallStatus(callId: string) {
    const call = await vapi.calls.get(callId);
    return call;
}
