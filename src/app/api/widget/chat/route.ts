import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@/utils/supabase/server";
import { corsHeaders } from "@/utils/cors";

const formatMessage = (message: VercelChatMessage) => {
    return `${message.role}: ${message.content}`;
};

const WIDGET_TEMPLATE = `
You are a friendly and professional customer service assistant for {shop_name}.
You are an auto repair shop assistant helping customers with their automotive needs.

Shop Information:
- Business Name: {shop_name}
- Location: {shop_address}
- Phone: {shop_phone}
- Services: {services_offered}
- Operating Hours: {operating_hours}
- About: {shop_about}

Your goal is to:
- Answer customer questions about automotive services
- Provide information about {shop_name}'s services and capabilities
- Help customers understand pricing and scheduling
- Help customers book appointments when they're ready

APPOINTMENT BOOKING:
When a customer wants to book an appointment, collect the following information:
1. Customer name (first and last)
2. Email address
3. Phone number
4. Vehicle information (year, make, model, license plate)
5. Service type needed
6. Preferred date and time

Once you have all this information, respond with:
"BOOK_APPOINTMENT: [customer_name] | [email] | [phone] | [vehicle_year] [vehicle_make] [vehicle_model] | [license_plate] | [service_type] | [preferred_date] | [preferred_time]"

Example: "BOOK_APPOINTMENT: John Smith | john@email.com | (555) 123-4567 | 2020 Toyota Camry | ABC123 | Oil Change | 2024-01-15 | 10:00 AM"

For general questions, provide helpful information and direct them to call {shop_phone} if needed.

Current Conversation:
{chat_history}

User: {input}
Assistant:`;


export async function POST(req: NextRequest) {
    const { messages, conversation_id, shopId } = await req.json();
    
    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: "Shop ID is required" }), { 
            status: 400, 
            headers: corsHeaders 
        });
    }

    // Fetch shop information
    const supabase = await createClient();
    const { data: shop, error: shopError } = await supabase
        .from("shops")
        .select("shop_name, shop_address, shop_phone, shop_about, services_offered, operating_hours")
        .eq("id", shopId)
        .single();

    if (shopError || !shop) {
        return new NextResponse(JSON.stringify({ error: "Shop not found" }), { 
            status: 404, 
            headers: corsHeaders 
        });
    }

    // Format shop information for the AI prompt
    const shopInfo = {
        shop_name: shop.shop_name || "the shop",
        shop_address: shop.shop_address || "Contact us for location details",
        shop_phone: shop.shop_phone || "Contact us for phone number",
        shop_about: shop.shop_about || "We provide professional automotive repair services",
        services_offered: shop.services_offered ? 
            (Array.isArray(shop.services_offered) ? shop.services_offered.join(", ") : 
             typeof shop.services_offered === 'object' ? Object.values(shop.services_offered).join(", ") :
             shop.services_offered.toString()) : "General automotive repair services",
        operating_hours: shop.operating_hours ? 
            (typeof shop.operating_hours === 'object' ? 
             Object.entries(shop.operating_hours).map(([day, hours]) => `${day}: ${hours}`).join(", ") :
             shop.operating_hours.toString()) : "Contact us for operating hours"
    };

    const model = new ChatOpenAI({ temperature: 0.7, modelName: "gpt-3.5-turbo" });
    const prompt = PromptTemplate.fromTemplate(WIDGET_TEMPLATE);
    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const chatHistory = messages.slice(0, -1).map(formatMessage).join("\n");
    const latestMessage = messages[messages.length - 1].content;
    
    const stream = await chain.stream({
        chat_history: chatHistory,
        input: latestMessage,
        ...shopInfo
    });

    const newConversationId = conversation_id || crypto.randomUUID();

    let aiResponse = "";
    const responseStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of stream) {
                aiResponse += chunk;
                controller.enqueue(chunk);
            }

            // Check if AI wants to book an appointment
            if (aiResponse.includes('BOOK_APPOINTMENT:')) {
                try {
                    const appointmentResult = await processAppointmentBooking(aiResponse, shopId, supabase);
                    if (appointmentResult.success) {
                        const confirmationMessage = `\n\n✅ Great! I've successfully booked your appointment for ${appointmentResult.appointment.appointment_date} at ${appointmentResult.appointment.start_time}. Your confirmation code is: ${appointmentResult.appointment.confirmation_code}`;
                        aiResponse += confirmationMessage;
                        controller.enqueue(confirmationMessage);
                    } else {
                        const errorMessage = `\n\n❌ I apologize, but I wasn't able to book your appointment automatically. Please call us at ${shop.shop_phone || 'the shop'} and we'll help you schedule it. Error: ${appointmentResult.error}`;
                        aiResponse += errorMessage;
                        controller.enqueue(errorMessage);
                    }
                } catch (error) {
                    console.error('Appointment booking error:', error);
                    const errorMessage = `\n\n❌ I apologize, but I wasn't able to book your appointment automatically. Please call us at ${shop.shop_phone || 'the shop'} and we'll help you schedule it.`;
                    aiResponse += errorMessage;
                    controller.enqueue(errorMessage);
                }
            }

            const finalMessages = [...messages, { role: 'assistant', content: aiResponse }];
            
            await supabase.from("conversations").upsert({
                id: newConversationId,
                shop_id: shopId,
                messages: JSON.stringify(finalMessages),
                source: 'widget',
                updated_at: new Date().toISOString()
            }, { onConflict: 'id' });

            controller.close();
        },
    });

    return new StreamingTextResponse(responseStream, { headers: corsHeaders });
}

async function processAppointmentBooking(aiResponse: string, shopId: string, supabase: any) {
    try {
        // Extract appointment data from AI response
        const bookingMatch = aiResponse.match(/BOOK_APPOINTMENT:\s*(.+)/);
        if (!bookingMatch) {
            return { success: false, error: 'No appointment data found' };
        }

        const appointmentData = bookingMatch[1].split('|').map(item => item.trim());
        
        if (appointmentData.length < 7) {
            return { success: false, error: 'Incomplete appointment data' };
        }

        const [
            customerName,
            email,
            phone,
            vehicleInfo,
            licensePlate,
            serviceType,
            preferredDate,
            preferredTime
        ] = appointmentData;

        const [firstName, ...lastNameParts] = customerName.split(' ');
        const lastName = lastNameParts.join(' ');
        
        const vehicleParts = vehicleInfo.split(' ');
        const year = parseInt(vehicleParts[0]);
        const make = vehicleParts[1];
        const model = vehicleParts.slice(2).join(' ');

        // Parse date and time
        const appointmentDate = new Date(preferredDate).toISOString().split('T')[0];
        const [time, period] = preferredTime.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTime = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Create or find customer
        let customer = await supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .eq('email', email)
            .single();

        if (customer.error) {
            // Create new customer
            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert({
                    shop_id: shopId,
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    phone_number: phone
                })
                .select()
                .single();

            if (customerError) {
                return { success: false, error: 'Failed to create customer' };
            }
            customer = { data: newCustomer };
        }

        // Create or find vehicle
        let vehicle = await supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', customer.data.id)
            .eq('license_plate', licensePlate)
            .single();

        if (vehicle.error) {
            // Create new vehicle
            const { data: newVehicle, error: vehicleError } = await supabase
                .from('customer_vehicles')
                .insert({
                    customer_id: customer.data.id,
                    year: year,
                    make: make,
                    model: model,
                    license_plate: licensePlate
                })
                .select()
                .single();

            if (vehicleError) {
                return { success: false, error: 'Failed to create vehicle' };
            }
            vehicle = { data: newVehicle };
        }

        // Create appointment
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        const { data: appointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
                shop_id: shopId,
                customer_id: customer.data.id,
                vehicle_id: vehicle.data.id,
                appointment_date: appointmentDate,
                start_time: startTime,
                end_time: endTime,
                service_type: serviceType,
                confirmation_code: confirmationCode,
                created_by_customer: true,
                status: 'scheduled'
            })
            .select()
            .single();

        if (appointmentError) {
            return { success: false, error: 'Failed to create appointment' };
        }

        // Create repair order
        const orderNumber = `RO-${Date.now()}`;
        await supabase
            .from('repair_orders')
            .insert({
                shop_id: shopId,
                customer_id: customer.data.id,
                vehicle_id: vehicle.data.id,
                appointment_id: appointment.id,
                order_number: orderNumber,
                status: 'pending',
                total_cost: 0
            });

        return { success: true, appointment, customer: customer.data, vehicle: vehicle.data };

    } catch (error) {
        console.error('Error processing appointment booking:', error);
        return { success: false, error: (error as Error).message || 'Unknown error' };
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: corsHeaders,
    });
}
