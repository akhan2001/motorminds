import type { UserRole, AdminType } from '@/types/core/user';

export interface NavItem {
    name: string;
    href: string;
    hasDropdown?: boolean;
    subItems?: Array<{ name: string; href: string; adminTypes?: AdminType[]; shopIds?: string[] }>;
    requiredRoles: UserRole[];
    adminTypes?: AdminType[]; // Optional: restrict to specific admin types
    shopIds?: string[]; // Optional: restrict to specific shop IDs
}

// Define mechanic hub subitems with role requirements
const mechanicHubSubItems = [
    { name: "Work Orders", href: "/mechanic-hub" },
    { name: "Parts & Ordering", href: "/parts-ordering" },
    { name: "Appointments", href: "/appointments" },
    { name: "Services & Parts", href: "/mechanic-hub/service-parts" },
];

const customerSubItems = [
    { name: "All Customers", href: "/customers" },
    { name: "All Customer Vehicles", href: "/customers/customer-vehicles" },
    { name: "Customer Intake Form", href: "/customer-intake" },
    { name: "Customer Invoice Intake", href: "/customer-invoice-intake" },
    { name: "Customer Contracts", href: "/customer-contracts" },
];

const financialsSubItems = [
    { name: "Analytics", href: "/financials" },
    { name: "Invoices", href: "/financials/invoices" },
];

export const navigationConfig: NavItem[] = [
    // {
    //     name: "Dashboard",
    //     href: "/",
    //     requiredRoles: ['admin', 'super', 'user']
    // },
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
        name: "Mia AI",
        href: "/mia-ai",
        requiredRoles: ['admin', 'super', 'demo', 'user']
    },
    // {
    //     name: "Parts",
    //     href: "/parts",
    //     requiredRoles: ['user', 'admin', 'super', 'demo']
    // },
    {
        name: "Customers",
        href: "/customers",
        hasDropdown: true,
        subItems: customerSubItems,
        requiredRoles: ['admin', 'super', 'user']
    },
    // {
    //     name: "Suppliers",
    //     href: "/suppliers",
    //     requiredRoles: ['user', 'admin', 'super', 'demo']
    // },
    // {
    //     name: "Migrations",
    //     href: "/migrations",
    //     requiredRoles: ['admin', 'super', 'user']
    // },
    {
        name: "Financials",
        href: "/financials",
        hasDropdown: true,
        subItems: financialsSubItems,
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Old Invoices",
        href: "/invoices",
        requiredRoles: ['admin', 'super', 'user'],
        shopIds: ['850e8400-e29b-41d4-a716-446655440003', '850e8400-e29b-41d4-a716-446655440006'] // Only show for this specific shop
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
            { 
                name: "Organizations", 
                href: "/admin/super-admin/organizations",
                adminTypes: ['super-admin']
            },
            { 
                name: "Shops", 
                href: "/admin/organization/shops",
                adminTypes: ['organization-admin']
            },
            { 
                name: "Users", 
                href: "/admin/users",
                adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
            },
            { 
                name: "Shop Users", 
                href: "/admin/shop/users",
                adminTypes: ['shop-admin']
            },
            { 
                name: "Create User", 
                href: "/admin/create-user",
                adminTypes: ['super-admin', 'organization-admin']
            },
            { 
                name: "Customers", 
                href: "/admin/customers",
                adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
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
                name: "Settings", 
                href: "/admin/settings",
                adminTypes: ['super-admin', 'organization-admin', 'shop-admin']
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
