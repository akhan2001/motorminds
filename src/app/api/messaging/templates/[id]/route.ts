import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getTemplate, updateTemplate, deleteTemplate } from "@/app/(features)/messaging/lib/message-template-service";
import type { MessageTemplateUpdateData } from "@/app/(features)/messaging/types/message-template";

// GET - Get single template
export async function GET(
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

        const template = await getTemplate(id);

        if (!template) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }

        // Verify template belongs to shop
        if (template.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(template);

    } catch (error: any) {
        console.error('Error fetching template:', error);
        return NextResponse.json(
            { error: 'Failed to fetch template', details: error.message || 'Unknown error' },
            { status: 500 }
        );
    }
}

// PUT - Update template
export async function PUT(
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

        // Verify template exists and belongs to shop
        const existingTemplate = await getTemplate(id);
        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        if (existingTemplate.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const body: MessageTemplateUpdateData = await request.json();
        const { name, trigger_type, service_type, message_template, variables, delay_hours, is_active } = body;

        // Build update data (only include provided fields)
        const updateData: MessageTemplateUpdateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (trigger_type !== undefined) updateData.trigger_type = trigger_type;
        if (service_type !== undefined) updateData.service_type = service_type;
        if (message_template !== undefined) updateData.message_template = message_template.trim();
        if (variables !== undefined) updateData.variables = variables;
        if (delay_hours !== undefined) updateData.delay_hours = delay_hours;
        if (is_active !== undefined) updateData.is_active = is_active;

        const updatedTemplate = await updateTemplate(id, updateData);

        return NextResponse.json({
            success: true,
            template: updatedTemplate
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error updating message template:', error);
        return NextResponse.json(
            {
                error: 'Failed to update template',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// DELETE - Delete template
export async function DELETE(
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

        // Verify template exists and belongs to shop
        const existingTemplate = await getTemplate(id);
        if (!existingTemplate) {
            return NextResponse.json({ error: 'Template not found' }, { status: 404 });
        }
        if (existingTemplate.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await deleteTemplate(id);

        return NextResponse.json({
            success: true,
            message: 'Template deleted successfully'
        }, { status: 200 });

    } catch (error: any) {
        console.error('Error deleting template:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete template',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
