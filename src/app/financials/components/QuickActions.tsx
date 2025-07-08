import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Users,
  Droplet,
  Gauge,
} from "lucide-react";

interface ActionCardProps {
  title: string;
  description: string;
  href?: string;
  icon: any;
  isActive?: boolean;
}

function ActionCard({ title, description, href, icon: Icon, isActive = true }: ActionCardProps) {
  const content = (
    <div className={`group rounded-xl border border-[#1a1a1a] bg-[#0A0A0A] p-6 transition-all duration-200 ${
      isActive 
        ? "hover:border-[#333] hover:bg-[#0f0f0f] cursor-pointer" 
        : "opacity-50 cursor-not-allowed"
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-lg ${
            isActive 
              ? "bg-[#1a1a1a] group-hover:bg-[#E53935] group-hover:text-white" 
              : "bg-[#1a1a1a]"
          } transition-colors`}>
            <Icon className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </div>
          <div>
            <h3 className={`text-lg font-semibold text-white ${
              isActive ? "group-hover:text-[#E53935]" : ""
            } transition-colors`}>
              {title}
            </h3>
            <p className="text-sm text-gray-400 mt-1 max-w-xs">
              {description}
            </p>
            {!isActive && (
              <span className="inline-block mt-2 text-xs text-gray-500 bg-[#1a1a1a] px-2 py-1 rounded">
                Coming Soon
              </span>
            )}
          </div>
        </div>
        <ArrowRight className={`w-5 h-5 text-gray-400 ${
          isActive ? "group-hover:text-[#E53935] group-hover:translate-x-1" : ""
        } transition-all`} />
      </div>
    </div>
  );

  if (isActive && href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function QuickActions() {
  return (
    <div className="my-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Financial Tools</h2>
        <p className="text-sm text-gray-400">Explore financial modules and reports</p>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionCard
          title="Efficiency Analysis"
          description="Track fixed costs, parts, and labor profitability."
          href="/financials/efficiency"
          icon={Gauge}
          isActive={true}
        />
        <ActionCard
          title="Liquidity (A/R)"
          description="Monitor unpaid invoices and aging accounts"
          href="/financials/liquidity"
          icon={Droplet}
          isActive={true}
        />
        <ActionCard
          title="Payroll Analytics"
          description="Analyze payroll costs and revenue per employee"
          href="/financials/payroll"
          icon={Users}
          isActive={true}
        />
        <ActionCard
          title="Job Efficiency"
          description="Analyze profitability of quoted vs. actual hours"
          href="/financials/efficiency"
          icon={Gauge}
          isActive={false}
        />
      </div>
    </div>
  );
} 