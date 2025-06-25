import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function BreadcrumbNav() {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400">
      <Link href="/financials" className="hover:text-white transition-colors">
        Financials
      </Link>
      <ChevronRight className="w-4 h-4" />
      <span className="text-white">Cash Flow</span>
    </nav>
  );
} 