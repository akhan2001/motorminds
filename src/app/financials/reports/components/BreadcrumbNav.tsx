"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function BreadcrumbNav() {
    return (
        <nav className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/financials" className="hover:text-white">
                Financials
            </Link>
            <ChevronRight className="w-4 h-4 mx-1" />
            <span className="font-semibold text-white">Reports</span>
        </nav>
    );
} 