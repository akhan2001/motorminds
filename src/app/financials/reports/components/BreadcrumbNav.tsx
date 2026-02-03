"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function BreadcrumbNav() {
    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-6">
            <Link href="/financials" className="hover:text-foreground">
                Financials
            </Link>
            <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground" />
            <span className="font-semibold text-foreground">Expense Reports</span>
        </nav>
    );
} 