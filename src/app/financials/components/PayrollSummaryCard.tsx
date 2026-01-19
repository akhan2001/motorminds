"use client"

interface PayrollSummaryCardProps {
	data: {
		totalMonthlyPayroll: number
		numberOfEmployees: number
	}
}

export function PayrollSummaryCard({ data }: PayrollSummaryCardProps) {
	if (!data) return null

	const formatCurrency = (value: number) => {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: "USD",
		}).format(value || 0)
	}

	const averagePayrollPerEmployee =
		data.numberOfEmployees > 0
			? data.totalMonthlyPayroll / data.numberOfEmployees
			: 0

	return (
		<div className="h-full rounded-lg border border-border bg-white dark:bg-card p-6">
			<h2 className="mb-4 text-lg font-semibold text-foreground">
				Payroll Summary
			</h2>
			<div className="space-y-3">
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Total Monthly Payroll</span>
					<span className="font-medium text-red-600 dark:text-red-400">
						{formatCurrency(data.totalMonthlyPayroll)}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Number of Employees</span>
					<span className="font-medium text-foreground">
						{data.numberOfEmployees}
					</span>
				</div>
				<div className="flex items-center justify-between">
					<span className="text-muted-foreground">Average Per Employee</span>
					<span className="font-medium text-foreground">
						{formatCurrency(averagePayrollPerEmployee)}
					</span>
				</div>
			</div>
		</div>
	)
} 