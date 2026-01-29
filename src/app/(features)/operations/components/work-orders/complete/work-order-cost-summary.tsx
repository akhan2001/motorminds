import React from 'react'
import { WorkOrderItem } from '../../../types/work-order-items'
import { calculateInvoiceTotals } from '../../../../financials/lib/invoice-calculations'
import { formatCurrency } from '@/lib/utils/currency'
import { formatDateOnly } from '@/lib/utils/date'

interface WorkOrderCostSummaryProps {
	workOrderItems: WorkOrderItem[]
	className?: string
}

export const WorkOrderCostSummary: React.FC<WorkOrderCostSummaryProps> = ({ 
	workOrderItems, 
	className = "" 
}) => {
	const calculations = calculateInvoiceTotals(workOrderItems)

	const TAX_RATE = 0.13
	
	const getItemStatusColor = (item: WorkOrderItem) => {
		if (item.active === false) {
			return 'text-red-600 dark:text-red-400'
		}
		return 'text-foreground'
	}
	
	const getItemStatusText = (item: WorkOrderItem) => {
		if (item.active === false) {
			return 'REJECTED (declined)'
		}
		return 'APPROVED'
	}
	
	const getItemTotal = (item: WorkOrderItem) => {
		if (item.item_type === 'labor') {
			return (item.labor_hours || 0) * (item.unit_price || 0)
		}
		return (item.quantity || 0) * (item.unit_price || 0)
	}
	
	return (
		<div className={`bg-card dark:bg-[#131313] rounded-lg p-4 border border-border dark:border-[#333333] ${className}`}>
			<h3 className="text-lg font-semibold text-foreground dark:text-white mb-4">Cost Summary</h3>
			
			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
				<div className="text-muted-foreground">
					<span className="text-foreground font-medium">{workOrderItems.length}</span> total items
				</div>
				{/* <div className="text-muted-foreground">
					<span className="text-foreground font-medium">{calculations.approvedItems.length}</span> approved
				</div> */}
				{calculations.rejectedItems.length > 0 && (
					<div className="text-red-600 dark:text-red-400 col-span-2">
						<span className="font-medium">{calculations.rejectedItems.length}</span> rejected items
					</div>
				)}
			</div>
			
			{/* Item Breakdown */}
			<div className="space-y-3">
				{workOrderItems.map((item) => (
					<div 
						key={item.id} 
						className={`p-3 rounded-lg border ${
							item.active === false 
								? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5' 
								: item.item_type === 'expense'
								? 'border-orange-300 dark:border-orange-500/30 bg-orange-50 dark:bg-orange-500/5'
								: 'border-border dark:border-[#333333] bg-background dark:bg-[#1a1a1a]'
						}`}
					>
						<div className="flex justify-between items-start mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1 flex-wrap">
									<span className={`text-xs font-medium px-2 py-1 rounded border ${
										item.active === false 
											? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20' 
											: item.item_type === 'expense'
											? 'bg-orange-50 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-500/20'
											: 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/20'
									}`}>
										{item.item_type.toUpperCase()}
									</span>
									{item.active === false && (
										<span className="text-xs font-medium px-2 py-1 rounded border bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20">
											{getItemStatusText(item)}
										</span>
									)}
									{item.item_type === 'expense' && (
										<span className="text-xs font-medium px-2 py-1 rounded border bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-500/20">
											TRACKING ONLY
										</span>
									)}
								</div>
								<h4 className={`font-medium ${getItemStatusColor(item)}`}>
									{item.description}
								</h4>
								{/* For expense items, show expense_invoice_number; for others, show part_number */}
								{item.item_type === 'expense' ? (
									item.expense_invoice_number && (
										<p className="text-xs text-muted-foreground">Invoice #: {item.expense_invoice_number}</p>
									)
								) : (
									item.part_number && (
										<p className="text-xs text-muted-foreground">Part #: {item.part_number}</p>
									)
								)}
							</div>
							<div className={`text-right ${getItemStatusColor(item)}`}>
								<div className="font-semibold">
									{formatCurrency(getItemTotal(item))}
								</div>
								{item.active === false && (
									<div className="text-xs text-red-600 dark:text-red-400">Not included in total</div>
								)}
							</div>
						</div>
						
						<div className="space-y-1 text-sm text-muted-foreground">
							<div className="flex justify-between">
								<div>
									{item.item_type === 'labor' ? (
										<span>{item.labor_hours || 0} hours @ {formatCurrency(item.unit_price || 0)}/hr</span>
									) : (
										<span>{item.quantity || 0} × {formatCurrency(item.unit_price || 0)}</span>
									)}
								</div>
							</div>
							
							{/* Show all available fields if not null/empty */}
							<div className="grid grid-cols-2 gap-2 text-xs">
								{item.unit_cost !== null && item.unit_cost !== undefined && (
									<div>
										<span className="text-muted-foreground">Unit Cost: </span>
										<span className="text-foreground">{formatCurrency(item.unit_cost)}</span>
									</div>
								)}
								{/* For expense items, show expense-specific fields */}
								{item.item_type === 'expense' ? (
									<>
										{item.expense_vendor && (
											<div>
												<span className="text-muted-foreground">Vendor: </span>
												<span className="text-foreground">{item.expense_vendor}</span>
											</div>
										)}
										{item.expense_invoice_number && (
											<div>
												<span className="text-muted-foreground">Invoice #: </span>
												<span className="text-foreground">{item.expense_invoice_number}</span>
											</div>
										)}
										{item.expense_subtotal && (
											<div>
												<span className="text-muted-foreground">Subtotal: </span>
												<span className="text-foreground">{formatCurrency(item.expense_subtotal)}</span>
											</div>
										)}
										{item.expense_tax_amount && item.expense_tax_amount > 0 && (
											<div>
												<span className="text-muted-foreground">Tax: </span>
												<span className="text-foreground">
													{formatCurrency(item.expense_tax_amount)} {item.expense_tax_included ? '(incl.)' : ''}
												</span>
											</div>
										)}
										{item.expense_payment_method && (
											<div>
												<span className="text-muted-foreground">Payment: </span>
												<span className="text-foreground">
													{item.expense_payment_method.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
												</span>
											</div>
										)}
										{item.expense_cost_date && (
											<div>
												<span className="text-muted-foreground">Date: </span>
												<span className="text-foreground">
													{formatDateOnly(item.expense_cost_date)}
												</span>
											</div>
										)}
									</>
								) : (
									<>
										{item.item_type === 'part' && item.supplier && (
											<div>
												<span className="text-muted-foreground">Supplier: </span>
												<span className="text-foreground">{item.supplier}</span>
											</div>
										)}
										{item.item_type === 'part' && item.part_number && (
											<div>
												<span className="text-muted-foreground">Part #: </span>
												<span className="text-foreground">{item.part_number}</span>
											</div>
										)}
									</>
								)}
								{item.category && (
									<div>
										<span className="text-muted-foreground">Category: </span>
										<span className="text-foreground">{item.category}</span>
									</div>
								)}
								{(item.item_type === 'part' || item.item_type === 'expense') && item.warranty_period && (
									<div>
										<span className="text-muted-foreground">Warranty: </span>
										<span className="text-foreground">{item.warranty_period}</span>
									</div>
								)}
								{item.item_type === 'labor' && (item as any).technician && (
									<div>
										<span className="text-muted-foreground">Technician: </span>
										<span className="text-foreground">
											{(item as any).technician.first_name} {(item as any).technician.last_name || ''}
										</span>
									</div>
								)}
							</div>
							
							{/* Show expense parts description if available */}
							{item.item_type === 'expense' && item.expense_parts_description && (
								<div className="text-xs text-muted-foreground pt-1 border-t border-border">
									<span className="font-medium">Parts Description: </span>
									<span>{item.expense_parts_description}</span>
								</div>
							)}
							
							{item.notes && (
								<div className="text-xs text-muted-foreground pt-1 border-t border-border">
									<span className="font-medium">Notes: </span>
									<span>{item.notes}</span>
								</div>
							)}
						</div>
					</div>
				))}
			</div>
			
			{/* Totals */}
			<div className="mt-4 pt-4 border-t border-border">
				<div className="space-y-2 text-sm">
					{/* Show all values if not null/empty (not just if > 0) */}
					{(calculations.labourTotal !== null && calculations.labourTotal !== undefined && calculations.labourTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Labor</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.labourTotal)}
							</span>
						</div>
					)}
					{(calculations.partsTotal !== null && calculations.partsTotal !== undefined && calculations.partsTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Parts</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.partsTotal)}
							</span>
						</div>
					)}
					{/* Calculate and show expense total separately (tracking only, not included in billable totals) */}
					{calculations.expensesItems && calculations.expensesItems.length > 0 && (() => {
						const expenseTotal = calculations.expensesItems.reduce((sum: number, item: WorkOrderItem) => {
							return sum + (item.total_price || 0)
						}, 0)
						return expenseTotal > 0 ? (
							<div className="flex justify-between">
								<span className="text-muted-foreground">Expenses (Tracking Only):</span>
								<span className="text-orange-600 dark:text-orange-400 font-medium">
									{formatCurrency(expenseTotal)}
								</span>
							</div>
						) : null
					})()}
					{(calculations.servicesTotal !== null && calculations.servicesTotal !== undefined && calculations.servicesTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Services</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.servicesTotal)}
							</span>
						</div>
					)}
					{(calculations.feesTotal !== null && calculations.feesTotal !== undefined && calculations.feesTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Fees</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.feesTotal)}
							</span>
						</div>
					)}
					{(calculations.packagesTotal !== null && calculations.packagesTotal !== undefined && calculations.packagesTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Packages</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.packagesTotal)}
							</span>
						</div>
					)}
					{(calculations.discountsTotal !== null && calculations.discountsTotal !== undefined && calculations.discountsTotal !== 0) && (
						<div className="flex justify-between">
							<span className="text-red-600 dark:text-red-400">Discounts</span>
							<span className="text-red-600 dark:text-red-400 font-medium">
								-{formatCurrency(calculations.discountsTotal)}
							</span>
						</div>
					)}
					<div className="flex justify-between pt-2 border-t border-border">
						<span className="text-foreground">Subtotal</span>
						<span className="text-foreground font-medium">
							{formatCurrency(calculations.subtotal)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">Tax ({Math.round(TAX_RATE * 100)}%)</span>
						<span className="text-foreground font-medium">
							{formatCurrency(calculations.subtotal * TAX_RATE)}
						</span>
					</div>
					<div className="flex justify-between text-lg font-semibold pt-2 border-t border-border">
						<span className="text-foreground">Total (Approved Items Only)</span>
						<span className="text-green-600 dark:text-green-400">
							{formatCurrency(calculations.subtotal * (1 + TAX_RATE))}
						</span>
					</div>
					{calculations.rejectedItems.length > 0 && (
						<div className="text-xs text-red-600 dark:text-red-400 pt-1">
							{calculations.rejectedItems.length} rejected item(s) excluded from total
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
