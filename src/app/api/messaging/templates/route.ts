import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { createTemplate, getTemplates, getTemplatesByTriggerType } from "@/app/(features)/messaging/lib/message-template-service";
import type { MessageTemplateCreateData, TriggerType, ServiceType } from "@/app/(features)/messaging/types/message-template";

import { MESSAGING_LIMITS } from "@/app/(features)/messaging/lib/limits";

// GET - List all templates for shop (with optional filtering)
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const triggerType = searchParams.get('trigger_type') as TriggerType | null;

        let templates;
        if (triggerType) {
            templates = await getTemplatesByTriggerType(shopId, triggerType);
        } else {
            templates = await getTemplates(shopId);
        }

        return NextResponse.json(templates);

    } catch (error) {
        console.error('Error fetching templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
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

        // Check template count limit
        const existingTemplates = await getTemplates(shopId);
        if (existingTemplates.length >= MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES) {
            return NextResponse.json({
                error: `Maximum limit reached`,
                message: `Only ${MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES} automated templates can be created for now. More templates can be added in the future.`,
                limit: MESSAGING_LIMITS.MAX_AUTOMATED_TEMPLATES,
                current: existingTemplates.length,
            }, { status: 403 });
        }

        const body: MessageTemplateCreateData = await request.json();
        const { name, trigger_type, service_type, message_template, variables, delay_hours, is_active } = body;

        // Validate required fields
        if (!name || !trigger_type || !message_template) {
            return NextResponse.json({
                error: 'Missing required fields',
                missing: {
                    name: !name,
                    trigger_type: !trigger_type,
                    message_template: !message_template
                }
            }, { status: 400 });
        }

        // Validate trigger_type
        const validTriggerTypes: TriggerType[] = ['work_order_complete', 'manual', 'service_reminder'];
        if (!validTriggerTypes.includes(trigger_type)) {
            return NextResponse.json({
                error: `Invalid trigger_type. Must be one of: ${validTriggerTypes.join(', ')}`
            }, { status: 400 });
        }

        // Create template
        const templateData: MessageTemplateCreateData = {
            shop_id: shopId,
            name: name.trim(),
            trigger_type,
            service_type: service_type ?? null,
            message_template: message_template.trim(),
            variables: variables ?? [],
            delay_hours: delay_hours ?? 0,
            is_active: is_active !== undefined ? is_active : true
        };

        const createdTemplate = await createTemplate(templateData);

        return NextResponse.json({
            success: true,
            template: createdTemplate
        }, { status: 201 });

    } catch (error) {
        console.error('Error creating message template:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            {
                error: 'Failed to create template',
                details: errorMessage
            },
            { status: 500 }
        );
    }
}
