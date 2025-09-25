import { MessageCircle, Wrench, Package, Phone } from "lucide-react";

// Mia AI feature cards data
export const miaFeatures = [
    {
        title: "Mia Chatbot",
        description: "Chat with Mia for general assistance, vehicle information, and quick support.",
        icon: MessageCircle,
        color: "bg-blue-500",
        hoverColor: "hover:bg-blue-600",
        href: "/chat",
        badge: "Chat",
        features: ["24/7 Support", "Vehicle Info", "Quick Answers"]
    },
    {
        title: "Mia Diagnostics",
        description: "Advanced AI-powered vehicle diagnostics and problem identification.",
        icon: Wrench,
        color: "bg-green-500", 
        hoverColor: "hover:bg-green-600",
        href: "/mia",
        badge: "Diagnostics",
        features: ["OBD Analysis", "Issue Detection", "Repair Suggestions"]
    },
    {
        title: "Mia Parts",
        description: "Intelligent parts sourcing and inventory management with AI recommendations.",
        icon: Package,
        color: "bg-purple-500",
        hoverColor: "hover:bg-purple-600",
        href: "/parts-ordering",
        badge: "Parts",
        features: ["Smart Sourcing", "Price Comparison", "Compatibility Check"]
    },
    {
        title: "Mia Calling",
        description: "AI-powered calling system for automated customer communications and scheduling.",
        icon: Phone,
        color: "bg-orange-500",
        hoverColor: "hover:bg-orange-600", 
        href: "/voice-calling",
        badge: "Voice",
        features: ["Auto Scheduling", "Customer Follow-up", "Voice Recognition"]
    }
]