import type { UserRole, AdminType } from '@/types/core/user';

export interface NavItem {
    name: string;
    href: string;
    hasDropdown?: boolean;
    subItems?: Array<{ name: string; href: string; adminTypes?: AdminType[]; shopIds?: string[]; excludedShopIds?: string[] }>;
    requiredRoles: UserRole[];
    adminTypes?: AdminType[]; // Optional: restrict to specific admin types
    shopIds?: string[]; // Optional: restrict to specific shop IDs
    excludedShopIds?: string[]; // Optional: exclude specific shop IDs
}

const customerSubItems = [
    { name: "All Customers", href: "/customers" },
    { name: "All Customer Vehicles", href: "/customers/customer-vehicles" },
    { name: "Customer Intake Form", href: "/customer-intake?shop=" }, // Note: append shop ID when linking
    { name: "Customer Invoice Intake", href: "/customer-invoice-intake" },
];

export const navigationConfig: NavItem[] = [
    {
        name: "Appointments",
        href: "/operations/appointments",
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Work Orders",
        href: "/operations/work-orders",
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Invoices",
        href: "/financials/invoices",
        requiredRoles: ['admin', 'super', 'user'],
        excludedShopIds: ['850e8400-e29b-41d4-a716-446655440003'] // Hide for this specific shop
    },
    {
        name: "Old Invoices",
        href: "/invoices",
        requiredRoles: ['admin', 'super', 'user'],
        shopIds: ['850e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440006'] // Only show for this specific shop
    },
    {
        name: "Mia AI",
        href: "/mia-ai",
        requiredRoles: ['admin', 'super', 'demo', 'user']
    },
    {
        name: "Customers",
        href: "/customers",
        hasDropdown: true,
        subItems: customerSubItems,
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Financials",
        href: "/financials",
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Admin",
        href: "/admin",
        requiredRoles: ['admin', 'super', 'shop_admin'], // Only admins, filtered by adminType
        hasDropdown: true,
        subItems: [
            { 
                name: "Dashboard", 
                href: "/admin",
                adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
            },
            // Super Admin Only
            { 
                name: "Organizations", 
                href: "/admin/super-admin/organizations",
                adminTypes: ['super-admin']
            },
            { 
                name: "All Shops", 
                href: "/admin/super-admin/shops",
                adminTypes: ['super-admin']
            },
            { 
                name: "Parts Requests", 
                href: "/admin/parts-requests",
                adminTypes: ['super-admin']
            },
            { 
                name: "Customer Statements", 
                href: "/admin/customer-statements",
                adminTypes: ['super-admin']
            },
            { 
                name: "Migrations", 
                href: "/admin/migrations",
                adminTypes: ['super-admin']
            },
            { 
                name: "Usage Metrics", 
                href: "/admin/usage-metrics",
                adminTypes: ['super-admin']
            },
            // Organization Admin Only
            { 
                name: "My Shops", 
                href: "/admin/organization/shops",
                adminTypes: ['organization-admin']
            },
            { 
                name: "Organization Customers", 
                href: "/admin/organization/customers",
                adminTypes: ['organization-admin']
            },
            // { 
            //     name: "Organization Users", 
            //     href: "/admin/organization/users",
            //     adminTypes: ['organization-admin']
            // },
            // Shop Admin Only
            { 
                name: "Shop Users", 
                href: "/admin/shop/users",
                adminTypes: ['shop-admin']
            },
            // All Admin Types
            { 
                name: "Users", 
                href: "/admin/users",
                adminTypes: ['super-admin', 'shop-admin']
            },
            { 
                name: "Create User", 
                href: "/admin/create-user",
                adminTypes: ['super-admin', 'shop-admin']
            },
            { 
                name: "Customers", 
                href: "/admin/customers",
                adminTypes: ['super-admin', 'shop-admin']
            },
            { 
                name: "Settings", 
                href: "/admin/settings",
                adminTypes: ['super-admin', 'shop-admin']
            }
        ]
    }
];

// Demo user specific navigation (what they should see)
export const demoNavItems = [
    { name: "Mia Chat", href: "/chat" },           // Mia Chatbot
    { name: "Mia Diagnostics", href: "/mia" },           // Mia Diagnostics
    { name: "Mia Parts", href: "/parts-ordering" },           // Mia Parts
    { name: "Mia Calling", href: "/voice-calling" },  // AI Calling
    { name: "Suppliers", href: "/suppliers" },   // Suppliers
];
