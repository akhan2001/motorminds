import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { ImmediateInsights } from '@/app/mia/types/MiaInsights';
import { supabase } from '@/lib/supabase';
// vehicle_utils doesn't exist - needs refactoring
// import { getVehicleInfoById } from '@/app/vehicles/utils/vehicle_utils';
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
        // TODO: Refactor - getVehicleInfoById doesn't exist
        const vehicleInfo = null; // vehicleId ? await getVehicleInfoById(vehicleId) : null;

        console.log("vehicleInfo", vehicleInfo);
        console.log("orderDetails", orderDetails);

        // Construct prompt with all available information and shop customization
        const prompt = `
            You are Mia, an expert automotive diagnostic AI assistant with 20+ years of hands-on repair experience. Analyze this work order with detailed technical knowledge and provide specific diagnostic insights.
            
            ${shopData?.shop_about ? `Shop Specialties: ${shopData.shop_about}` : ''}
            
            DETAILED WORK ORDER INFORMATION:
            Vehicle: ${vehicleInfo ? `${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model} ${vehicleInfo.color} ${vehicleInfo.engine_type}` : 'Information not available'}
            Work Description: ${orderDetails.description}
            Technical Notes: ${orderDetails.notes}
            Parts Used/Needed: ${orderDetails.parts}
            Labor Required: ${orderDetails.labour}
            Current Mileage: ${orderDetails.mileage} km
            Service Cost: $${orderDetails.total}
            
            CRITICAL DIAGNOSTIC REQUIREMENTS:
            1. For inspection work: Provide SPECIFIC potential causes, not generic "could be X or Y" statements
            2. For symptom-based work: Give detailed technical analysis of what specific components likely cause those symptoms
            3. For maintenance work: Identify related systems that typically fail around the same service intervals
            4. Use your technical expertise to make educated assessments based on symptoms, mileage, and vehicle type
            
            TECHNICAL ANALYSIS APPROACH:
            - Sounds/symptoms: Match specific noises to likely component failures (e.g., "wooing" = wheel bearings, "clicking" = CV joints/stabilizer links)
            - Mileage-based: Identify components that typically fail at current mileage intervals
            - Related systems: Components that should be checked when accessing the current repair area
            - Preventive opportunities: Parts that commonly fail soon after current repair if not addressed
            
            PROVIDE DETAILED INSIGHTS INCLUDING:
            - Specific component diagnoses based on symptoms (not just "needs inspection")
            - Technical explanations of WHY certain parts likely need attention
            - Proactive maintenance based on access points during current repair
            - Safety-critical items that should be checked while vehicle is serviced
            - Cost-effective bundling opportunities (parts accessed during current work)
            - Customer education on WHY these services matter
            
            ${shopData?.shop_about ? 'IMPORTANT: Prioritize services that align with shop specialties and technical capabilities.' : ''}
            
            Return ONLY a JSON object with this EXACT structure:
            {
              "upsell_suggestions": [
                {
                  "title": "string",
                  "description": "string - explain how this relates to current work and vehicle condition",
                  "estimatedValue": number,
                  "priority": "high" | "medium" | "low",
                  "category": "immediate" | "preventive" | "safety" | "seasonal"
                }
              ],
              "flags": [
                {
                  "type": "warning" | "urgent" | "info",
                  "message": "string - specific flag related to this work order",
                  "category": "safety" | "maintenance" | "cost" | "timing"
                }
              ],
              "work_order_analysis": {
                "current_work_assessment": "string - detailed analysis of the specific work being done",
                "related_systems": ["string"] - systems that should be checked while vehicle is here,
                "mileage_considerations": "string - what maintenance is due at this mileage",
                "timing_recommendations": "string - optimal timing for additional services"
              },
              "summary": "string - comprehensive summary focused on this specific work order"
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
                        title: "Regular Maintenance Inspection",
                        description: "Comprehensive vehicle inspection while in shop for current service",
                        estimatedValue: 75,
                        priority: "medium",
                        category: "preventive"
                    }
                ],
                flags: [
                    {
                        type: "info",
                        message: "Unable to generate specific recommendations from available work order data",
                        category: "maintenance"
                    }
                ],
                work_order_analysis: {
                    current_work_assessment: "Unable to analyze current work from available data.",
                    related_systems: ["General inspection recommended"],
                    mileage_considerations: "Consider standard maintenance schedule review",
                    timing_recommendations: "Complete current service before additional work"
                },
                summary: "Consider general maintenance inspection while vehicle is being serviced"
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
