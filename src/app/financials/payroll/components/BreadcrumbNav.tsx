import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function BreadcrumbNav() {
	return (
		<nav className="flex items-center space-x-2 text-sm text-muted-foreground">
			<Link href="/financials" className="hover:text-foreground transition-colors">
				Financials
			</Link>
			<ChevronRight className="w-4 h-4 text-muted-foreground" />
			<span className="text-foreground">Payroll</span>
		</nav>
	);
} 