import type { UserRole } from '@/types/core/user';

export interface NavItem {
    name: string;
    href: string;
    hasDropdown?: boolean;
    subItems?: Array<{ name: string; href: string }>;
    requiredRoles: UserRole[];
}

// Define mechanic hub subitems with role requirements
const mechanicHubSubItems = [
    { name: "Work Orders", href: "/mechanic-hub" },
    { name: "Parts & Ordering", href: "/parts-ordering" },
    { name: "Appointments", href: "/appointments" },
    { name: "Services & Parts", href: "/mechanic-hub/service-parts" },
    { name: "Invoices", href: "/financials/invoices" },
];

const customerSubItems = [
    { name: "All Customers", href: "/customers" },
    { name: "All Customer Vehicles", href: "/customers/customer-vehicles" },
    { name: "Customer Intake Form", href: "/customer-intake" },
    { name: "Customer Invoice Intake", href: "/customer-invoice-intake" },
    { name: "Customer Contracts", href: "/customer-contracts" },
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
        name: "Invoices",
        href: "/invoices",
        requiredRoles: ['admin', 'super', 'user']
    },
    {
        name: "Mia AI",
        href: "/mia-ai",
        requiredRoles: ['admin', 'super', 'demo', 'user']
    },
    {
        name: "Financials",
        href: "/financials",
        requiredRoles: ['admin', 'super', 'user']
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
    {
        name: "Mechanics Hub",
        href: "/mechanic-hub",
        hasDropdown: true,
        subItems: mechanicHubSubItems,
        requiredRoles: ['admin', 'super', 'user']
    },
    // {
    //     name: "Migrations",
    //     href: "/migrations",
    //     requiredRoles: ['admin', 'super', 'user']
    // },
    {
        name: "Admin",
        href: "/admin",
        requiredRoles: ['admin', 'super']
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
