import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { getActiveTemplates, getActiveTemplatesByTrigger } from "@/app/(features)/messaging/lib/message-template-service";
import type { TriggerType, ServiceType } from "@/app/(features)/messaging/types/message-template";

// GET - List active templates for shop (with optional filtering by trigger type)
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const triggerType = searchParams.get('trigger_type') as TriggerType | null;
        const serviceType = searchParams.get('service_type') as ServiceType | null;

        let templates;
        if (triggerType) {
            templates = await getActiveTemplatesByTrigger(shopId, triggerType, serviceType || undefined);
        } else {
            templates = await getActiveTemplates(shopId);
        }

        return NextResponse.json({
            templates,
            count: templates.length
        });

    } catch (error) {
        console.error('Error fetching active templates:', error);
        return NextResponse.json(
            { error: 'Failed to fetch active templates' },
            { status: 500 }
        );
    }
}
