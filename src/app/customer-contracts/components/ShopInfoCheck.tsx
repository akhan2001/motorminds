"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ShopInfoCheckProps {
    shop: {
        shop_name?: string | null;
        shop_address?: string | null;
        [key: string]: any;
    } | null;
}

export default function ShopInfoCheck({ shop }: ShopInfoCheckProps) {
    if (shop && shop.shop_name && shop.shop_address) {
        return null;
    }

    return (
        <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Incomplete Shop Information</AlertTitle>
            <AlertDescription>
                Your shop's name and address are required to generate accurate service contracts. Please update your shop settings.
                <Button asChild variant="link" className="p-0 h-auto ml-2">
                    <Link href="/settings">Go to Settings</Link>
                </Button>
            </AlertDescription>
        </Alert>
    );
} 