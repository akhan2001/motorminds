import { NextRequest, NextResponse } from "next/server";
import { getShopIdForUser } from "@/utils/get-shop-id";
import { initializeDefaultTemplate } from "@/app/(features)/messaging/lib/default-template-service";

/**
 * POST /api/messaging/init-defaults
 * Initialize default templates for the current shop
 * Idempotent - safe to call multiple times
 */
export async function POST(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json(
                { error: 'Unauthorized - Shop not found' },
                { status: 401 }
            );
        }

        // Initialize default template (only creates if doesn't exist)
        const template = await initializeDefaultTemplate(shopId);

        if (template) {
            return NextResponse.json({
                success: true,
                message: 'Default template created successfully',
                template
            }, { status: 201 });
        } else {
            return NextResponse.json({
                success: true,
                message: 'Default template already exists',
                template: null
            });
        }

    } catch (error: any) {
        console.error('Error initializing default templates:', error);
        return NextResponse.json(
            {
                error: 'Failed to initialize default templates',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

/**
 * GET /api/messaging/init-defaults
 * Check if shop has default template initialized
 */
export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        
        if (!shopId) {
            return NextResponse.json(
                { error: 'Unauthorized - Shop not found' },
                { status: 401 }
            );
        }

        const { hasDefaultTemplate, getDefaultTemplate } = await import(
            "@/app/(features)/messaging/lib/default-template-service"
        );

        const exists = await hasDefaultTemplate(shopId);
        const template = exists ? await getDefaultTemplate(shopId) : null;

        return NextResponse.json({
            initialized: exists,
            template
        });

    } catch (error: any) {
        console.error('Error checking default templates:', error);
        return NextResponse.json(
            {
                error: 'Failed to check default templates',
                details: error.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}

