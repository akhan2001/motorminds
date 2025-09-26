import { VapiClient } from "@vapi-ai/server-sdk";

// Initialize Vapi client
export const vapi = new VapiClient({
    token: process.env.VAPI_API_KEY!
});