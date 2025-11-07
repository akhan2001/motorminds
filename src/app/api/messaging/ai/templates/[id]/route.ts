import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import {
    getTemplate,
    updateTemplate,
    deleteTemplate
} from "@/app/(features)/messaging/lib/message-template-service";
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

        // Verify template belongs to user's shop
        if (template.shop_id !== shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        return NextResponse.json(template);

    } catch (error) {
        console.error('Error fetching message template:', error);
        return NextResponse.json(
            {
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
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
        const {
            name,
            template,
            description,
            trigger_type,
            is_active
        } = body;

        // Build update data (only include provided fields)
        const updateData: MessageTemplateUpdateData = {};
        if (name !== undefined) updateData.name = name.trim();
        if (template !== undefined) updateData.template = template.trim();
        if (description !== undefined) updateData.description = description?.trim() || undefined;
        if (trigger_type !== undefined) updateData.trigger_type = trigger_type.trim();
        if (is_active !== undefined) updateData.is_active = is_active;

        const updatedTemplate = await updateTemplate(id, updateData);

        return NextResponse.json({
            success: true,
            template: updatedTemplate
        });

    } catch (error) {
        console.error('Error updating message template:', error);
        return NextResponse.json(
            {
                error: 'Failed to update template',
                details: error instanceof Error ? error.message : 'Unknown error'
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

        // Check for hard delete query parameter
        const { searchParams } = new URL(request.url);
        const hardDelete = searchParams.get('hard') === 'true';

        await deleteTemplate(id, hardDelete);

        return NextResponse.json({
            success: true,
            message: hardDelete ? 'Template permanently deleted' : 'Template deleted'
        });

    } catch (error) {
        console.error('Error deleting message template:', error);
        return NextResponse.json(
            {
                error: 'Failed to delete template',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

