// src/app/(features)/ai/AIDiagnostics/lib/context-builder.ts

import { createClient } from '@/utils/supabase/server';

export interface VehicleContext {
    vehicleInfo: {
        id: number;
        vin: string | null;
        year: number | null;
        make: string | null;
        model: string | null;
        trim: string | null;
        engine: string | null;
        transmission: string | null;
        mileage: number | null;
        color: string | null;
        licensePlate: string | null;
    } | null;
    customerInfo: {
        id: number;
        firstName: string | null;
        lastName: string | null;
        email: string | null;
        phone: string | null;
    } | null;
    workOrders: Array<{
        id: number;
        work_order_number: string;
        status: string;
        vehicle_concern: string | null;
        description: string | null;
        diagnosis: string | null;
        created_at: string;
        completed_at: string | null;
        total_cost: number | null;
        labor_cost: number | null;
        parts_cost: number | null;
        services: Array<{
            name: string;
            description: string | null;
            status: string;
        }>;
    }>;
    invoices: Array<{
        id: number;
        invoice_number: string;
        date: string;
        total_amount: number;
        status: string;
        line_items: Array<{
            description: string;
            quantity: number;
            unit_price: number;
            total: number;
        }>;
    }>;
    appointments: Array<{
        id: number;
        appointment_date: string;
        service_type: string | null;
        notes: string | null;
        status: string;
    }>;
}

/**
 * Build comprehensive vehicle context from CRM data
 */
export async function buildVehicleContext(
    vehicleId: number,
    shopId: number
): Promise<VehicleContext> {
    const supabase = await createClient();

    // Fetch vehicle information
    const { data: vehicleData, error: vehicleError } = await supabase
        .from('customer_vehicles')
        .select(`
      id,
      vin,
      year,
      make,
      model,
      trim,
      engine,
      transmission,
      mileage,
      color,
      license_plate,
      customer_id
    `)
        .eq('id', vehicleId)
        .eq('shop_id', shopId)
        .single();

    if (vehicleError || !vehicleData) {
        throw new Error('Vehicle not found');
    }

    // Fetch customer information
    const { data: customerData } = await supabase
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .eq('id', vehicleData.customer_id)
        .single();

    // Fetch work orders with services
    const { data: workOrdersData } = await supabase
        .from('work_orders')
        .select(`
      id,
      work_order_number,
      status,
      vehicle_concern,
      description,
      diagnosis,
      created_at,
      completed_at,
      total_cost,
      labor_cost,
      parts_cost,
      work_order_services (
        service_name,
        description,
        status
      )
    `)
        .eq('vehicle_id', vehicleId)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .limit(50);

    // Fetch invoices with line items
    const { data: invoicesData } = await supabase
        .from('invoices')
        .select(`
      id,
      invoice_number,
      invoice_date,
      total_amount,
      status,
      invoice_line_items (
        description,
        quantity,
        unit_price,
        total_price
      )
    `)
        .eq('vehicle_id', vehicleId)
        .eq('shop_id', shopId)
        .order('invoice_date', { ascending: false })
        .limit(30);

    // Fetch appointments
    const { data: appointmentsData } = await supabase
        .from('appointments')
        .select(`
      id,
      appointment_date,
      service_type,
      notes,
      status
    `)
        .eq('vehicle_id', vehicleId)
        .eq('shop_id', shopId)
        .order('appointment_date', { ascending: false })
        .limit(30);

    // Format the context
    return {
        vehicleInfo: {
            id: vehicleData.id,
            vin: vehicleData.vin,
            year: vehicleData.year,
            make: vehicleData.make,
            model: vehicleData.model,
            trim: vehicleData.trim,
            engine: vehicleData.engine,
            transmission: vehicleData.transmission,
            mileage: vehicleData.mileage,
            color: vehicleData.color,
            licensePlate: vehicleData.license_plate
        },
        customerInfo: customerData ? {
            id: customerData.id,
            firstName: customerData.first_name,
            lastName: customerData.last_name,
            email: customerData.email,
            phone: customerData.phone
        } : null,
        workOrders: (workOrdersData || []).map(wo => ({
            id: wo.id,
            work_order_number: wo.work_order_number,
            status: wo.status,
            vehicle_concern: wo.vehicle_concern,
            description: wo.description,
            diagnosis: wo.diagnosis,
            created_at: wo.created_at,
            completed_at: wo.completed_at,
            total_cost: wo.total_cost,
            labor_cost: wo.labor_cost,
            parts_cost: wo.parts_cost,
            services: (wo.work_order_services || []).map(service => ({
                name: service.service_name,
                description: service.description,
                status: service.status
            }))
        })),
        invoices: (invoicesData || []).map(inv => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            date: inv.invoice_date,
            total_amount: inv.total_amount,
            status: inv.status,
            line_items: (inv.invoice_line_items || []).map(item => ({
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: item.total_price
            }))
        })),
        appointments: (appointmentsData || []).map(apt => ({
            id: apt.id,
            appointment_date: apt.appointment_date,
            service_type: apt.service_type,
            notes: apt.notes,
            status: apt.status
        }))
    };
}

/**
 * Format vehicle context as a readable string for AI
 */
export function formatVehicleContextForAI(context: VehicleContext): string {
    const parts: string[] = [];

    // Vehicle Information
    if (context.vehicleInfo) {
        const v = context.vehicleInfo;
        parts.push(`VEHICLE INFORMATION:
- ${v.year} ${v.make} ${v.model} ${v.trim || ''}
- VIN: ${v.vin || 'Not available'}
- Engine: ${v.engine || 'Not specified'}
- Transmission: ${v.transmission || 'Not specified'}
- Current Mileage: ${v.mileage ? v.mileage.toLocaleString() : 'Unknown'} miles`);
    }

    // Customer Information
    if (context.customerInfo) {
        const c = context.customerInfo;
        parts.push(`\nCUSTOMER INFORMATION:
- Name: ${c.firstName} ${c.lastName}
- Contact: ${c.phone || 'N/A'} / ${c.email || 'N/A'}`);
    }

    // Recent Work Orders
    if (context.workOrders.length > 0) {
        parts.push(`\nRECENT SERVICE HISTORY (${context.workOrders.length} records):`);
        context.workOrders.slice(0, 10).forEach((wo, idx) => {
            const date = new Date(wo.created_at).toLocaleDateString();
            parts.push(`\n${idx + 1}. ${wo.work_order_number} - ${date} - ${wo.status}
   Concern: ${wo.vehicle_concern || 'Not specified'}
   ${wo.diagnosis ? `Diagnosis: ${wo.diagnosis}` : ''}
   ${wo.services.length > 0 ? `Services: ${wo.services.map(s => s.name).join(', ')}` : ''}
   Cost: $${wo.total_cost?.toFixed(2) || '0.00'}`);
        });
    }

    // Recent Invoices
    if (context.invoices.length > 0) {
        parts.push(`\n\nRECENT INVOICES (${context.invoices.length} records):`);
        context.invoices.slice(0, 5).forEach((inv, idx) => {
            const date = new Date(inv.date).toLocaleDateString();
            parts.push(`\n${idx + 1}. ${inv.invoice_number} - ${date}
   Total: $${inv.total_amount.toFixed(2)}
   Items: ${inv.line_items.map(item => item.description).join(', ')}`);
        });
    }

    // Upcoming/Recent Appointments
    if (context.appointments.length > 0) {
        parts.push(`\n\nAPPOINTMENTS (${context.appointments.length} records):`);
        context.appointments.slice(0, 5).forEach((apt, idx) => {
            const date = new Date(apt.appointment_date).toLocaleDateString();
            parts.push(`\n${idx + 1}. ${date} - ${apt.status}
   Service Type: ${apt.service_type || 'General service'}
   ${apt.notes ? `Notes: ${apt.notes}` : ''}`);
        });
    }

    return parts.join('\n');
}