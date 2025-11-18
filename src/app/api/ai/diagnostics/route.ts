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
    getBulkVehicleAttributesTool
} from '@/app/(features)/ai/AIDiagnostics/tools/motor-daas-tools';
import { getVehicleHistoryTool } from '@/app/(features)/ai/AIDiagnostics/tools/vehicle-tools';
import { estimateRepairCostTool } from '@/app/(features)/ai/AIDiagnostics/tools/cost-estimation-tools';
import { AI_DIAGNOSTICS_PROMPT } from '@/app/(features)/ai/AIDiagnostics/lib/prompts';

export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json();
        const { messages, selectedVehicleId, testShopId } = body;

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
                console.error('Error building vehicle context:', error);
                // Continue without context rather than failing
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
            getVehicleHistory: getVehicleHistoryTool,
            estimateRepairCost: estimateRepairCostTool
        };

        // Use OpenAI GPT-4 as primary model
        // Updated to use gpt-4o which is supported in AI SDK v5
        const model = openai('gpt-4o');

        // Stream response
        const result = await streamText({
            model,
            system: systemMessage,
            messages,
            tools,
            temperature: 0.7,
            onError: ({ error }: { error: unknown }) => {
                console.error('AI streaming error:', error);
            }
        });

        // Return streaming response in UI message stream format for AI SDK 5.0
        // Use toUIMessageStreamResponse() for proper useChat integration
        return result.toUIMessageStreamResponse();

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