import Link from "next/link";
import {
	ArrowRight,
	FileText,
	Users,
	Droplet,
	Gauge,
	Timer,
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
		<div className={`group rounded-xl border border-border bg-white dark:bg-card p-6 transition-all duration-200 ${isActive
				? "hover:border-red-600 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
				: "opacity-50 cursor-not-allowed"
			}`}>
			<div className="flex items-center justify-between">
				<div className="flex items-start gap-4">
					<div className={`p-2 rounded-lg ${isActive
							? "bg-slate-50 dark:bg-muted group-hover:bg-red-600 group-hover:text-white"
							: "bg-slate-50 dark:bg-muted"
						} transition-colors`}>
						<Icon className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
					</div>
					<div>
						<h3 className={`text-lg font-semibold text-foreground ${isActive ? "group-hover:text-red-600 dark:group-hover:text-red-400" : ""
							} transition-colors`}>
							{title}
						</h3>
						<p className="text-sm text-muted-foreground mt-1 max-w-xs">
							{description}
						</p>
						{!isActive && (
							<span className="inline-block mt-2 text-xs text-muted-foreground bg-slate-50 dark:bg-muted px-2 py-1 rounded border border-border">
								Coming Soon
							</span>
						)}
					</div>
				</div>
				<ArrowRight className={`w-5 h-5 text-muted-foreground ${isActive ? "group-hover:text-red-600 dark:group-hover:text-red-400 group-hover:translate-x-1" : ""
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
				<h2 className="text-xl font-semibold text-foreground mb-2">Financial Tools</h2>
				<p className="text-sm text-muted-foreground">Explore financial modules and reports</p>
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
					title="Financial Reports"
					description="Generate income statements and other financial reports"
					href="/financials/reports"
					icon={FileText}
					isActive={true}
				/>
				<ActionCard
					title="Job Efficiency"
					description="Measure estimated vs actual labor performance"
					icon={Timer}
					isActive={false}
				/>
			</div>
		</div>
	);
} 