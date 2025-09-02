import { NextRequest, NextResponse } from "next/server";
import { Message as VercelChatMessage, StreamingTextResponse } from "ai";
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders } from "@/utils/cors";
import { sendAppointmentConfirmationEmail } from "@/lib/email/send-appointment-confirmation";
import { sendAppointmentSMSConfirmation } from "@/lib/sms/send-appointment-confirmation";

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
4. Vehicle information (year, make, model)
5. Service type needed (be smart about their symptoms - see SERVICE INTELLIGENCE below)
6. Preferred date (time slots will be shown as clickable buttons)

SERVICE INTELLIGENCE:
Based on customer symptoms, suggest appropriate services:
- Engine noises, knocking, squealing, grinding = "Engine Diagnosis" or "Engine Repair"
- Oil leaks, fluid leaks, puddles under car = "Leak Inspection" or "Engine Repair"
- Braking issues, squeaking brakes, soft pedal = "Brake Inspection" or "Brake Repair"
- Transmission problems, shifting issues = "Transmission Service"
- Electrical issues, lights, battery = "Electrical Diagnosis"
- Heating/cooling issues = "AC/Heating Service"
- Routine maintenance without symptoms = "Oil Change", "Tune-up", etc.
- Multiple symptoms or serious problems = "General Inspection" or "Full Diagnosis"

Once you have all this information, respond with:
"BOOK_APPOINTMENT: [customer_name] | [email] | [phone] | [vehicle_year] [vehicle_make] [vehicle_model] | [service_type] | [preferred_date] | [preferred_time]"

Example: "BOOK_APPOINTMENT: John Smith | john@email.com | (555) 123-4567 | 2020 Toyota Camry | Engine Diagnosis | {current_date} | 10:00 AM"

For general questions, provide helpful information and direct them to call {shop_phone} if needed.

Current Conversation:
{chat_history}

User: {input}
Assistant:`;

const BOOKING_TEMPLATE = `
You are a friendly appointment booking specialist for {shop_name}. Your ONLY job is to collect appointment information step-by-step.

Shop Information:
- Business Name: {shop_name}
- Location: {shop_address}
- Phone: {shop_phone}
- Services: {services_offered}
- Operating Hours: {operating_hours}

APPOINTMENT BOOKING PROCESS:
You need to collect ALL of the following information before booking:
1. Service type needed (from our available services: {services_offered})
2. Customer's full name (first and last)
3. Email address
4. Phone number
5. Vehicle information (year, make, model)
6. Preferred date (ask for specific date like "January 15, 2025" or "tomorrow". If they don't specify, use today's date: {current_date})
7. Available time slots will be shown as buttons for the customer to choose from

SERVICE TYPE INTELLIGENCE:
When determining service type, be smart about customer symptoms:
- Engine noises, knocking, squealing, grinding = "Engine Diagnosis" or "Engine Repair"
- Oil leaks, fluid leaks, puddles under car = "Leak Inspection" or "Engine Repair"
- Braking issues, squeaking brakes, soft pedal = "Brake Inspection" or "Brake Repair"
- Transmission problems, shifting issues = "Transmission Service"
- Electrical issues, lights, battery = "Electrical Diagnosis"
- Heating/cooling issues = "AC/Heating Service"
- Routine maintenance without symptoms = "Oil Change", "Tune-up", etc.
- Multiple symptoms or serious problems = "General Inspection" or "Full Diagnosis"

IMPORTANT RULES:
- Ask for ONE piece of information at a time
- Be conversational and friendly
- Validate information as you collect it
- If they give incomplete vehicle info, ask for the missing parts
- For dates: Convert relative dates correctly:
  - "today" = {current_date}
  - "tomorrow" = use the day after {current_date}
  - "next Monday", "this Friday" = calculate from {current_date}
  - If they give a specific date, use YYYY-MM-DD format
- For time: After asking "What time would you prefer?", wait for the user to select from available time slots
- Choose appropriate service type based on customer's described symptoms, not just default to oil change
- Only proceed to booking when you have ALL required information
- When you have everything, use this format EXACTLY:

"BOOK_APPOINTMENT: [full_name] | [email] | [phone] | [year] [make] [model] | [service_type] | [date] | [time]"

Example: "BOOK_APPOINTMENT: John Smith | john@email.com | (555) 123-4567 | 2020 Toyota Camry | Engine Diagnosis | {current_date} | 10:00 AM"

Current date for reference: {current_date}

Current Conversation:
{chat_history}

User: {input}
Assistant:`;


export async function POST(req: NextRequest) {
    const { messages, conversation_id, shopId, isBookingMode } = await req.json();
    
    if (!shopId) {
        return new NextResponse(JSON.stringify({ error: "Shop ID is required" }), { 
            status: 400, 
            headers: corsHeaders 
        });
    }

    // Fetch shop information
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
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
    const templateToUse = isBookingMode ? BOOKING_TEMPLATE : WIDGET_TEMPLATE;
    const prompt = PromptTemplate.fromTemplate(templateToUse);
    const parser = new StringOutputParser();
    const chain = prompt.pipe(model).pipe(parser);

    const chatHistory = messages.slice(0, -1).map(formatMessage).join("\n");
    const latestMessage = messages[messages.length - 1].content;
    
    // Add current date for booking template
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    const stream = await chain.stream({
        chat_history: chatHistory,
        input: latestMessage,
        current_date: currentDate,
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
                    const appointmentResult = await processAppointmentBooking(aiResponse, shopId, supabase, shop);
                    if (appointmentResult.success) {
                        const confirmationMessage = `\n\n✅ Perfect! Your appointment has been confirmed for ${appointmentResult.appointment.appointment_date} at ${appointmentResult.appointment.start_time}.\n\n📧 A confirmation email has been sent to ${appointmentResult.customer.customer_email}.\n\n🎫 Your confirmation code is: ${appointmentResult.appointment.confirmation_code}\n\n📞 If you need to make any changes, please call us at ${shop.shop_phone || 'our shop'}.\n\nThank you for choosing ${shop.shop_name}!`;
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

async function processAppointmentBooking(aiResponse: string, shopId: string, supabase: any, shop: any) {
    try {
        // Extract appointment data from AI response
        const bookingMatch = aiResponse.match(/BOOK_APPOINTMENT:\s*(.+)/);
        if (!bookingMatch) {
            return { success: false, error: 'No appointment data found' };
        }

        const appointmentData = bookingMatch[1].split('|').map(item => item.trim());
        
        console.log('Extracted appointment data:', appointmentData);
        
        if (appointmentData.length < 6) {
            return { success: false, error: 'Incomplete appointment data' };
        }

        const [
            customerName,
            email,
            phone,
            vehicleInfo,
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
        
        console.log('Parsed data:', {
            customerName,
            email,
            phone,
            vehicleInfo,
            serviceType,
            preferredDate,
            preferredTime,
            year,
            make,
            model
        });

        // Parse date and time with better date handling
        let appointmentDate;
        try {
            // Handle relative dates
            if (preferredDate.toLowerCase().includes('today')) {
                appointmentDate = new Date().toISOString().split('T')[0];
            } else if (preferredDate.toLowerCase().includes('tomorrow')) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                appointmentDate = tomorrow.toISOString().split('T')[0];
            } else {
                appointmentDate = new Date(preferredDate).toISOString().split('T')[0];
            }
        } catch (error) {
            // Default to today if date parsing fails
            appointmentDate = new Date().toISOString().split('T')[0];
        }
        
        // Clean up the time string (remove quotes and extra characters)
        const cleanTime = preferredTime.replace(/['"]/g, '').trim();
        const [time, period] = cleanTime.split(' ');
        let [hours, minutes] = time.split(':').map(part => {
            const num = parseInt(part.replace(/[^0-9]/g, ''));
            return isNaN(num) ? 0 : num;
        });
        
        // Handle period conversion
        if (period && period.toUpperCase() === 'PM' && hours !== 12) hours += 12;
        if (period && period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        
        // Ensure valid time values
        hours = Math.max(0, Math.min(23, hours));
        minutes = Math.max(0, Math.min(59, minutes));
        
        const startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const endTime = `${(hours + 1).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

        // Check if customer already exists (by email or phone)
        let customer = await supabase
            .from('customers')
            .select('*')
            .eq('shop_id', shopId)
            .or(`customer_email.eq."${email}",customer_phone.eq."${phone}"`)
            .maybeSingle();

        if (customer.error) {
            // Create new customer with proper data validation
            const customerData: any = {
                shop_id: shopId,
                customer_name: customerName,
                customer_phone: phone || null
            };
            
            // Only add email if it's valid
            if (email && email.trim() && email !== 'NULL') {
                customerData.customer_email = email.trim();
            }

            const { data: newCustomer, error: customerError } = await supabase
                .from('customers')
                .insert(customerData)
                .select()
                .single();

            if (customerError) {
                console.error('Customer creation error details:', customerError);
                console.error('Customer data attempted:', customerData);
                return { success: false, error: `Failed to create customer: ${customerError.message}` };
            }
            customer = { data: newCustomer };
            console.log('✅ New customer created via widget:', newCustomer.id);
        } else {
            // Update existing customer with latest info if needed
            const updateData: any = {};
            let needsUpdate = false;
            
            if (customer.data.customer_name !== customerName) {
                updateData.customer_name = customerName;
                needsUpdate = true;
            }
            
            if (customer.data.customer_phone !== phone) {
                updateData.customer_phone = phone;
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                updateData.updated_at = new Date().toISOString();
                const { error: updateError } = await supabase
                    .from('customers')
                    .update(updateData)
                    .eq('id', customer.data.id);
                
                if (updateError) {
                    console.error('Failed to update existing customer:', updateError);
                } else {
                    console.log('✅ Existing customer updated:', customer.data.id);
                }
            } else {
                console.log('✅ Using existing customer:', customer.data.id);
            }
        }

        // Create or find vehicle (matching by year, make, model for this customer)
        let vehicle = await supabase
            .from('customer_vehicles')
            .select('*')
            .eq('customer_id', customer.data.id)
            .eq('year', year)
            .eq('make', make)
            .eq('model', model)
            .maybeSingle();

        if (vehicle.error) {
            // Create new vehicle with proper data validation
            const vehicleData: any = {
                customer_id: customer.data.id,
                year: year,
                make: make,
                model: model
            };

            const { data: newVehicle, error: vehicleError } = await supabase
                .from('customer_vehicles')
                .insert(vehicleData)
                .select()
                .single();

            if (vehicleError) {
                console.error('Vehicle creation error details:', vehicleError);
                console.error('Vehicle data attempted:', vehicleData);
                return { success: false, error: `Failed to create vehicle: ${vehicleError.message}` };
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
            console.error('Appointment creation error details:', appointmentError);
            return { success: false, error: `Failed to create appointment: ${appointmentError.message}` };
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

        // Automatically send confirmation email
        try {
            await sendAppointmentConfirmationEmail({
                appointment,
                customer: customer.data,
                vehicle: vehicle.data,
                shop
            });
            console.log('Confirmation email sent successfully');
        } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
            // Don't fail the appointment creation if email fails
        }

        // Send SMS confirmation if Twilio is set up
        try {
            await sendAppointmentSMSConfirmation({
                appointment,
                customer: customer.data,
                vehicle: vehicle.data,
                shop,
                supabase
            });
            console.log('SMS confirmation sent successfully');
        } catch (smsError) {
            console.error('Failed to send SMS confirmation:', smsError);
            // Don't fail the appointment creation if SMS fails
        }

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
