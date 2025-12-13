// src/app/api/ai/diagnostics/route.ts

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { NextRequest } from 'next/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { buildVehicleContext, formatVehicleContextForAI } from '@/app/(features)/ai/AIDiagnostics/lib/context-builder';
import {
    getVehicleInfoTool,
    lookupDTCTool,
    getServiceProcedureTool,
    getPartsTool,
    getMaintenanceScheduleTool,
    getSpecificationsTool,
    getWorkTimeTool,
    getTSBTool,
    getWiringDiagramsTool,
    getBulkVehicleAttributesTool,
    getRecommendedFluidsTool
} from '@/app/(features)/ai/AIDiagnostics/tools/motor-daas-tools';
import { getVehicleHistoryTool } from '@/app/(features)/ai/AIDiagnostics/tools/vehicle-tools';
import { estimateRepairCostTool } from '@/app/(features)/ai/AIDiagnostics/tools/cost-estimation-tools';
import { AI_DIAGNOSTICS_PROMPT } from '@/app/(features)/ai/AIDiagnostics/lib/prompts';

// Convert UI messages (with parts) to standard messages (with role and content)
function convertUIMessagesToStandard(messages: any[]): Array<{ role: 'user' | 'assistant' | 'system'; content: string }> {
    return messages.map((msg: any) => {
        // If message already has content (standard format), return as-is
        if (msg.content && typeof msg.content === 'string') {
            return {
                role: msg.role,
                content: msg.content
            };
        }

        // If message has parts (UI message format), extract text content
        if (msg.parts && Array.isArray(msg.parts)) {
            const textParts = msg.parts.filter((part: any) => part.type === 'text');
            const content = textParts.map((part: any) => part.text).join('');
            
            return {
                role: msg.role,
                content: content
            };
        }

        // Fallback: try to extract content from message
        return {
            role: msg.role || 'user',
            content: msg.text || msg.content || ''
        };
    });
}

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        // Handle both top-level and nested body structure
        // useChat sends body params nested, but we also support top-level for direct API calls
        const messages = body.messages || body.data?.messages || [];
        const selectedVehicleId = body.selectedVehicleId || body.data?.selectedVehicleId;
        const testShopId = body.testShopId || body.data?.testShopId;
        const workOrderId = body.workOrderId || body.data?.workOrderId;
        const baseVehicleId = body.baseVehicleId || body.data?.baseVehicleId;

        if (!messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: 'Invalid request: messages array required' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Get shop ID for authentication
        // Allow testShopId in development mode for testing
        let shopId: string | null;
        const isDevelopment = process.env.NODE_ENV === 'development';
        
        if (isDevelopment && testShopId) {
            // Allow test shop ID in development mode
            shopId = testShopId;
        } else {
            shopId = await getShopIdForUser();
        }

        if (!shopId) {
            return new Response(
                JSON.stringify({ 
                    error: 'Unauthorized: No shop access',
                    ...(isDevelopment && { 
                        hint: 'In development mode, you can pass testShopId in the request body' 
                    })
                }),
                { status: 401, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Build vehicle context if vehicle is selected
        let systemMessage = AI_DIAGNOSTICS_PROMPT;

        if (selectedVehicleId) {
            try {
                const vehicleContext = await buildVehicleContext(selectedVehicleId, Number(shopId));
                const formattedContext = formatVehicleContextForAI(vehicleContext);

                systemMessage += `\n\n## CURRENT VEHICLE CONTEXT:\n\n${formattedContext}\n\nThis vehicle's complete history is available above. Use this context to inform your diagnosis and recommendations.`;
            } catch (error) {
                // Silently continue without context for sandbox vehicles or vehicles not in database
                // This is expected when using MOTOR sandbox vehicles that don't exist in our CRM
                if (process.env.NODE_ENV === 'development') {
                    console.log('[AI Diagnostics] Vehicle context not available (sandbox vehicle or not in database)');
                }
            }
        }

        // Prepare AI tools
        const tools = {
            getVehicleInfo: getVehicleInfoTool,
            lookupDTC: lookupDTCTool,
            getServiceProcedure: getServiceProcedureTool,
            getParts: getPartsTool,
            getMaintenanceSchedule: getMaintenanceScheduleTool,
            getSpecifications: getSpecificationsTool,
            getWorkTime: getWorkTimeTool,
            getTSB: getTSBTool,
            getWiringDiagrams: getWiringDiagramsTool,
            getBulkVehicleAttributes: getBulkVehicleAttributesTool,
            getRecommendedFluids: getRecommendedFluidsTool,
            getVehicleHistory: getVehicleHistoryTool,
            estimateRepairCost: estimateRepairCostTool
        };

        // Convert UI messages to standard format for streamText
        const standardMessages = convertUIMessagesToStandard(messages);

        // Use OpenAI GPT-4 as primary model
        // Updated to use gpt-4o which is supported in AI SDK v5
        const model = openai('gpt-4o');

        // Stream response
        // @ts-ignore - Type mismatch between AI SDK versions, but works at runtime
        const result = await streamText({
            model,
            system: systemMessage,
            messages: standardMessages,
            // @ts-ignore - Type mismatch between AI SDK versions, but works at runtime
            tools,
            temperature: 0.7,
            onError: ({ error }: { error: unknown }) => {
                console.error('AI streaming error:', error);
            }
        });

        // Return streaming response in data stream format for AI SDK 5.0
        // For useChat from @ai-sdk/react, return the data stream directly
        // @ts-ignore - Type mismatch between AI SDK versions, but works at runtime
        return new Response(result.toDataStream(), {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });

    } catch (error) {
        console.error('Diagnostics API error:', error);

        // User-friendly error messages
        let errorMessage = 'An error occurred while processing your request';
        let statusCode = 500;

        if (error instanceof Error) {
            if (error.message.includes('rate limit')) {
                errorMessage = 'Rate limit exceeded. Please try again in a few moments.';
                statusCode = 429;
            } else if (error.message.includes('authentication')) {
                errorMessage = 'Authentication failed. Please check your credentials.';
                statusCode = 401;
            } else if (error.message.includes('not found')) {
                errorMessage = 'Requested resource not found.';
                statusCode = 404;
            }
        }

        return new Response(
            JSON.stringify({ error: errorMessage }),
            {
                status: statusCode,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Optional: Support GET for testing
export async function GET() {
    return new Response(
        JSON.stringify({
            status: 'AI Diagnostics API is running',
            version: '1.0.0',
            endpoints: {
                POST: 'Send messages array and optional selectedVehicleId',
                ...(process.env.NODE_ENV === 'development' && {
                    testMode: 'In development, you can pass testShopId in the request body'
                })
            }
        }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}