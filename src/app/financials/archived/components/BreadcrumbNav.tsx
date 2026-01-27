"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

export default function BreadcrumbNav() {
	return (
		<nav className="flex items-center gap-2 text-sm text-muted-foreground">
			<Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1">
				<Home className="h-4 w-4" />
				Dashboard
			</Link>
			<ChevronRight className="h-4 w-4" />
			<Link href="/financials" className="hover:text-foreground transition-colors">
				Financials
			</Link>
			<ChevronRight className="h-4 w-4" />
			<span className="text-foreground font-medium">Deleted Records</span>
		</nav>
	);
}
