import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights } from '@/app/mia/types/MiaInsights';
import { supabase } from '@/lib/supabase';
import { getVehicleInfoById } from '@/app/vehicles/utils/vehicle_utils';
// Define interfaces for type safety
interface OrderDetails {
    description: string;
    notes: string;
    parts: string;
    labour: string;
    mileage: string;
    total: number;
}

interface VehicleInfo {
    year: string;
    make: string;
    model: string;
    color: string;
    engine_type: string;
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to extract JSON from various formats
function extractJsonFromString(str: string): any {
    // Try to find JSON inside markdown code blocks first
    const jsonBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
        try {
            return JSON.parse(jsonBlockMatch[1]);
        } catch (e) {
            console.log("Failed to parse JSON from code block, trying full string...");
        }
    }
    
    // Try to parse the whole string as JSON
    try {
        return JSON.parse(str.trim());
    } catch (e) {
        throw new Error("Could not extract valid JSON from the response");
    }
}

export async function POST(req: Request) {
    try {
        // Extract workOrderData and shopId from the request
        const { workOrderData, shopId } = await req.json();
        
        if (!workOrderData) {
            return NextResponse.json(
                { success: false, error: 'Work order data is required' },
                { status: 400 }
            );
        }

        if (!shopId) {
            return NextResponse.json(
                { success: false, error: 'Shop ID is required' },
                { status: 400 }
            );
        }

        // Get shop information
        const { data: shopData, error: shopError } = await supabase
            .from('shops')
            .select('shop_about')
            .eq('id', shopId)
            .single();

        if (shopError) {
            console.error('Error fetching shop data:', shopError);
            return NextResponse.json(
                { success: false, error: 'Failed to fetch shop information' },
                { status: 500 }
            );
        }

        // Initialize with default values
        let orderDetails: OrderDetails = {
            description: '',
            notes: '',
            parts: '',
            labour: '',
            mileage: '',
            total: 0
        };
        
        // Extract order details
        if (workOrderData.repair_order_details && 
            Array.isArray(workOrderData.repair_order_details) && 
            workOrderData.repair_order_details.length > 0) {
            
            const details = workOrderData.repair_order_details[0];
            orderDetails = {
                description: details.description || '',
                notes: details.notes || '',
                parts: details.parts || '',
                labour: details.labour || '',
                mileage: details.mileage || '',
                total: details.cost || 0
            };
        }
        
        // Get vehicle information using the utility function
        const vehicleId = workOrderData.vehicle_id || workOrderData.vehicle?.id;
        const vehicleInfo = vehicleId ? await getVehicleInfoById(vehicleId) : null;

        console.log("vehicleInfo", vehicleInfo);
        console.log("orderDetails", orderDetails);

        // Construct prompt with all available information and shop customization
        const prompt = `
            You are Mia, an AI assistant for auto repair shops.
            Generate upsell suggestions that are quick, cheap and relevant to the work order based on the following information:
            
            ${shopData?.shop_about ? `Shop Information: ${shopData.shop_about}` : ''}
            
            ${vehicleInfo ? `Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.color} ${vehicleInfo.engine_type}` : 'Vehicle: Information not available'}
            Title: ${orderDetails.description}
            Notes: ${orderDetails.notes}
            Parts: ${orderDetails.parts}
            Labour: ${orderDetails.labour}
            Mileage: ${orderDetails.mileage} - Mileage is in kilometers
            Total: ${orderDetails.total}
            
            ${shopData?.shop_about ? 'IMPORTANT: Customize your suggestions based on the shop\'s specialties and services mentioned in the shop information.' : ''}
            
            Return a JSON object with EXACTLY this structure:
            {
              "upsell_suggestions": [
                {
                  "title": "string",
                  "description": "string",
                  "estimatedValue": number,
                  "priority": "high" | "medium" | "low"
                }
              ],
              "flags": [
                {
                  "type": "warning" | "urgent" | "info",
                  "message": "string"
                }
              ],
              "summary": "string"
            }
            
            RETURN ONLY THE JSON OBJECT WITHOUT ANY EXPLANATION OR MARKDOWN FORMATTING.
        `;

        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { 
                    role: 'system', 
                    content: 'You are a car repair shop AI. Respond with JSON only, no explanation or markdown.'
                },
                { role: 'user', content: prompt }
            ],
            temperature: 0.3
        });

        // Extract and parse the AI response
        const aiResponse = response.choices[0]?.message?.content;
        if (!aiResponse) {
            throw new Error('Empty response from AI');
        }

        let parsedResponse;
        try {
            parsedResponse = extractJsonFromString(aiResponse);
        } catch (error) {
            console.error('Failed to extract JSON:', error);
            parsedResponse = {
                upsell_suggestions: [
                    {
                        title: "Regular Maintenance",
                        description: "General vehicle inspection",
                        estimatedValue: 50,
                        priority: "medium"
                    }
                ],
                flags: [
                    {
                        type: "info",
                        message: "Unable to generate specific recommendations"
                    }
                ],
                summary: "Consider a general maintenance check"
            };
        }
        
        return NextResponse.json({
            success: true,
            insights: parsedResponse
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Failed to generate insights' },
            { status: 500 }
        );
    }
}
