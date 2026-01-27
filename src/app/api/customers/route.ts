import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getShopIdForUser } from '@/utils/get-shop-id';
import { getUserAccessContextFromRequest, canAccessScope, type AccessScope } from '@/lib/auth/access-context';
import { 
    queryCustomersForUser, 
    createCustomer as createCustomerService,
    type CustomerQueryOptions 
} from '@/lib/services/customer-query-service';

// Types
interface CreateCustomerRequest {
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_vehicle?: any;
    license_plate?: string;
    notes?: string;
    tags?: string[];
}

/**
 * GET /api/customers - Query customers with scope-aware filtering
 * 
 * Query Parameters:
 * - search: Search term for name, email, phone, license plate, address
 * - phone: Exact phone number filter
 * - scope: Access scope ('shop' | 'organization' | 'platform') - defaults to user's scope
 * - shop_id: Filter to specific shop (must be within user's accessible shops)
 * - page: Page number (1-indexed)
 * - limit: Items per page (max 100)
 */
export async function GET(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest();
        
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        
        // Parse query parameters
        const search = searchParams.get('search') || undefined;
        const phone = searchParams.get('phone') || undefined;
        const shopFilter = searchParams.get('shop_id') || undefined;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        
        // Optional scope override (must be equal or lower than user's scope)
        const requestedScope = searchParams.get('scope') as AccessScope | null;
        if (requestedScope && !canAccessScope(context.accessScope, requestedScope)) {
            return NextResponse.json({ 
                error: 'Forbidden: insufficient access scope' 
            }, { status: 403 });
        }

        // Build query options
        const options: CustomerQueryOptions = {
            search,
            phone,
            shopFilter,
            page,
            limit,
            sortBy: 'updated_at',
            sortDirection: 'desc'
        };

        // Query customers using the unified service
        const result = await queryCustomersForUser(context, options);

        return NextResponse.json(result);

    } catch (error) {
        console.error('GET /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * POST /api/customers - Create new customer
 * 
 * Automatically populates organization_id for MSO shops
 */
export async function POST(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest();
        
        if (!context || !context.shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body: CreateCustomerRequest = await request.json();
        const { 
            customer_name, 
            customer_email, 
            customer_phone, 
            customer_address,
            customer_vehicle,
            license_plate,
            notes,
            tags 
        } = body;

        // Validate required fields
        if (!customer_name) {
            return NextResponse.json({ 
                error: 'Missing required field: customer_name' 
            }, { status: 400 });
        }

        // Create customer using the unified service
        const result = await createCustomerService(context, {
            customer_name,
            customer_email: customer_email || null,
            customer_phone: customer_phone || null,
            customer_address: customer_address || null,
            customer_vehicle: customer_vehicle || null,
            license_plate: license_plate || null,
            notes: notes || null,
            tags: tags || []
        });

        if (!result.success) {
            const status = result.error?.includes('already exists') ? 409 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ 
            success: true, 
            customer: result.customer 
        });

    } catch (error) {
        console.error('POST /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PUT /api/customers?id=<customer_id> - Update customer with access control
 * 
 * For organization scope: can only edit customers from own shop
 */
export async function PUT(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest();
        
        if (!context) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('id');

        if (!customerId) {
            return NextResponse.json({ error: 'Customer ID required' }, { status: 400 });
        }

        // Import the update function from the service
        const { updateCustomer } = await import('@/lib/services/customer-query-service');
        
        const result = await updateCustomer(context, customerId, body);

        if (!result.success) {
            const status = result.error?.includes('not found') ? 404 : 
                          result.error?.includes('access denied') ? 403 : 500;
            return NextResponse.json({ error: result.error }, { status });
        }

        return NextResponse.json({ 
            success: true, 
            customer: result.customer 
        });

    } catch (error) {
        console.error('PUT /api/customers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}