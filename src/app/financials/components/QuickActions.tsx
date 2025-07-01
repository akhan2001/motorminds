import Link from "next/link";
import { ArrowRight, BarChart3, FileText, TrendingUp, Calculator } from "lucide-react";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white mb-2">Quick Actions</h2>
        <p className="text-sm text-gray-400">Access key financial tools and reports</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          title="Cash Flow Analytics"
          description="Detailed revenue and expense tracking with trend analysis"
          href="/financials/cashflow"
          icon={BarChart3}
          isActive={true}
        />
        
        <ActionCard
          title="P&L Statements"
          description="Generate comprehensive profit and loss statements"
          icon={FileText}
          isActive={false}
        />
        
        <ActionCard
          title="Revenue Forecasting"
          description="AI-powered revenue predictions and growth analysis"
          icon={TrendingUp}
          isActive={false}
        />
        
        <ActionCard
          title="Tax Preparation"
          description="Automated tax calculations and filing assistance"
          icon={Calculator}
          isActive={false}
        />
      </div>
    </div>
  );
} 