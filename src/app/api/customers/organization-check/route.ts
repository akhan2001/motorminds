import { NextRequest, NextResponse } from 'next/server'
import { 
    getUserAccessContextFromRequest, 
    hasOrganizationAccess,
    getAvailableShopsForUser,
    type UserAccessContext 
} from '@/lib/auth/access-context'

export interface OrganizationCheckResponse {
    /** Whether user can access organization-wide data */
    hasOrganizationAccess: boolean
    /** The user's organization ID (if any) */
    organizationId: string | null
    /** The user's access scope */
    accessScope: UserAccessContext['accessScope']
    /** The user's current shop ID */
    shopId: string | null
    /** All shops the user can access */
    availableShops: Array<{ id: string; shop_name: string }>
    /** The user's role */
    role: string
    /** Whether user can edit customers */
    canEdit: boolean
    /** Whether user can delete customers */
    canDelete: boolean
}

export async function GET(request: NextRequest) {
    try {
        const context = await getUserAccessContextFromRequest()
        
        if (!context) {
            return NextResponse.json<OrganizationCheckResponse>({ 
                hasOrganizationAccess: false,
                organizationId: null,
                accessScope: 'shop',
                shopId: null,
                availableShops: [],
                role: 'user',
                canEdit: false,
                canDelete: false
            })
        }

        // Get available shops for filtering
        const shops = await getAvailableShopsForUser(context)
        const availableShops = shops.map(s => ({ 
            id: s.id, 
            shop_name: s.shop_name 
        }))

        return NextResponse.json<OrganizationCheckResponse>({ 
            hasOrganizationAccess: hasOrganizationAccess(context),
            organizationId: context.organizationId,
            accessScope: context.accessScope,
            shopId: context.shopId,
            availableShops,
            role: context.role,
            canEdit: context.canEdit,
            canDelete: context.canDelete
        })

    } catch (error) {
        console.error('Error in organization-check:', error)
        // Safe fallback - if anything fails, default to no organization access
        return NextResponse.json<OrganizationCheckResponse>({ 
            hasOrganizationAccess: false,
            organizationId: null,
            accessScope: 'shop',
            shopId: null,
            availableShops: [],
            role: 'user',
            canEdit: false,
            canDelete: false
        })
    }
}
