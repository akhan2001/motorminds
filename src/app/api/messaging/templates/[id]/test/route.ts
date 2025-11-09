import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getTemplate } from "@/app/(features)/messaging/lib/message-template-service";
import { replaceVariables } from "@/app/(features)/messaging/lib/variable-replacer";

// POST - Test template with sample data
// Returns preview of message with variables replaced
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = params;

        if (!id) {
            return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
        }

        // Get template
        const template = await getTemplate(id);

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Verify template belongs to user's shop
        if (template.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Get test data from request body (optional - will use defaults if not provided)
        const body = await request.json().catch(() => ({}));
        const testData = body.testData || {};

        // Default sample data if not provided
        const defaultTestData = {
            customer: {
                customer_name: 'John Doe',
                customer_phone: '+1234567890',
                customer_email: 'john.doe@example.com',
                customer_address: '123 Main St, City, State 12345'
            },
            vehicle: {
                year: 2020,
                make: 'Toyota',
                model: 'Camry',
                license_plate: 'ABC-123',
                vin: '1HGBH41JXMN109186',
                mileage: 45000,
                color: 'Silver'
            },
            work_order: {
                work_order_number: 'WO-2024-001',
                title: 'Oil Change Service',
                status: 'Completed',
                completed_at: new Date().toISOString(),
                total_amount: 89.99
            },
            appointment: {
                appointment_date: new Date().toISOString(),
                appointment_time: '10:00 AM',
                start_time: '10:00',
                service_type: 'Oil Change',
                confirmation_code: 'ABC123'
            },
            shop: {
                shop_name: 'Auto Repair Shop',
                shop_phone: '+1987654321',
                shop_address: '456 Service Rd, City, State 12345',
                shop_email: 'info@autoshop.com'
            },
            service: {
                service_type: 'Oil Change',
                service_date: new Date().toISOString(),
                service_amount: 89.99
            }
        };

        // Merge provided test data with defaults
        const mergedTestData = {
            ...defaultTestData,
            ...testData,
            customer: { ...defaultTestData.customer, ...(testData.customer || {}) },
            vehicle: { ...defaultTestData.vehicle, ...(testData.vehicle || {}) },
            work_order: { ...defaultTestData.work_order, ...(testData.work_order || {}) },
            appointment: { ...defaultTestData.appointment, ...(testData.appointment || {}) },
            shop: { ...defaultTestData.shop, ...(testData.shop || {}) },
            service: { ...defaultTestData.service, ...(testData.service || {}) }
        };

        // Replace variables in template
        const preview = replaceVariables(template.template, mergedTestData, {
            missingVariableBehavior: 'placeholder' // Show [variable_name] if missing
        });

        return NextResponse.json({
            success: true,
            preview,
            template: template.template,
            testData: mergedTestData,
            variables: {
                used: Object.keys(mergedTestData).filter(key => 
                    template.template.includes(`[${key}`)
                ),
                missing: [] // Could extract missing variables if needed
            }
        });

    } catch (error) {
        console.error('Error testing message template:', error);
        return NextResponse.json(
            {
                error: 'Failed to test template',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

