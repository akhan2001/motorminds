import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import {
    getTemplates,
    createTemplate
} from "@/app/(features)/messaging/lib/message-template-service";
import type { MessageTemplateCreateData } from "@/app/(features)/messaging/types/message-template";

// GET - List all templates for shop
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const triggerType = searchParams.get('trigger_type');
        const isActive = searchParams.get('is_active');

        // Get templates for shop
        let templates = await getTemplates(shopId);

        // Apply optional filters
        if (triggerType) {
            templates = templates.filter(t => t.trigger_type === triggerType);
        }
        if (isActive !== null) {
            const active = isActive === 'true';
            templates = templates.filter(t => t.is_active === active);
        }

        return NextResponse.json(templates);

    } catch (error) {
        console.error('Error fetching message templates:', error);
        return NextResponse.json(
            { 
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

// POST - Create new template
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: MessageTemplateCreateData = await request.json();
        const {
            name,
            template,
            description,
            trigger_type,
            is_active
        } = body;

        // Validate required fields
        if (!name || !template || !trigger_type) {
            return NextResponse.json({
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    template: !template,
                    trigger_type: !trigger_type
                }
            }, { status: 400 });
        }

        // Create template
        const templateData: MessageTemplateCreateData = {
            shop_id: shopId,
            name: name.trim(),
            template: template.trim(),
            description: description?.trim() || undefined,
            trigger_type: trigger_type.trim(),
            is_active: is_active !== undefined ? is_active : true
        };

        const createdTemplate = await createTemplate(templateData);

        return NextResponse.json({
            success: true,
            template: createdTemplate
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating message template:', error);
        return NextResponse.json(
            {
                error: 'Failed to create template',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

