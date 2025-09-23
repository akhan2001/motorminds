'use client'

import { useState, useMemo } from "react";
import { Nav } from "@/app/components/nav";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle } from "lucide-react";
import InvoiceHeader from "../components/invoices/InvoiceHeader";

export default function InvoicesPage() {

    return (
        <div className="h-screen flex flex-col bg-[#0d0d0d]">
            <Nav />
            <div className="flex-1 flex flex-col overflow-hidden">
                <InvoiceHeader />
            </div>
        </div>
    )
}
