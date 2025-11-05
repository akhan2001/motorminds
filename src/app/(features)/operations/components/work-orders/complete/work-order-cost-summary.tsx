import React from 'react'
import { WorkOrderItem } from '../../../types/work-order-items'
import { calculateInvoiceTotals } from '../../../../financials/lib/invoice-calculations'
import { formatCurrency } from '@/lib/utils/currency'

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
		<div className={`bg-slate-50 dark:bg-card rounded-lg p-4 border border-border ${className}`}>
			<h3 className="text-lg font-semibold text-foreground mb-4">Cost Summary</h3>
			
			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
				<div className="text-muted-foreground">
					<span className="text-foreground font-medium">{workOrderItems.length}</span> total items
				</div>
				<div className="text-muted-foreground">
					<span className="text-foreground font-medium">{calculations.approvedItems.length}</span> approved
				</div>
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
						className={`p-3 rounded-lg border bg-white dark:bg-card ${
							item.active === false 
								? 'border-red-300 dark:border-red-500/30 bg-red-50 dark:bg-red-500/5' 
								: 'border-border'
						}`}
					>
						<div className="flex justify-between items-start mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className={`text-xs font-medium px-2 py-1 rounded border ${
										item.active === false 
											? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20' 
											: 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/20'
									}`}>
										{item.item_type.toUpperCase()}
									</span>
									<span className={`text-xs font-medium px-2 py-1 rounded border ${
										item.active === false 
											? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-500/20' 
											: 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-400 border-green-300 dark:border-green-500/20'
									}`}>
										{getItemStatusText(item)}
									</span>
								</div>
								<h4 className={`font-medium ${getItemStatusColor(item)}`}>
									{item.description}
								</h4>
								{item.part_number && (
									<p className="text-xs text-muted-foreground">Part #: {item.part_number}</p>
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
						
						<div className="flex justify-between text-sm text-muted-foreground">
							<div>
								{item.item_type === 'labor' ? (
									<span>{item.labor_hours || 0} hours @ {formatCurrency(item.unit_price || 0)}/hr</span>
								) : (
									<span>{item.quantity || 0} × {formatCurrency(item.unit_price || 0)}</span>
								)}
							</div>
							{item.notes && (
								<div className="text-xs text-muted-foreground max-w-xs truncate">
									{item.notes}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
			
			{/* Totals */}
			<div className="mt-4 pt-4 border-t border-border">
				<div className="space-y-2 text-sm">
					{calculations.labourTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Labor</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.labourTotal)}
							</span>
						</div>
					)}
					{calculations.partsTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Parts</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.partsTotal)}
							</span>
						</div>
					)}
					{calculations.servicesTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Services</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.servicesTotal)}
							</span>
						</div>
					)}
					{calculations.feesTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Fees</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.feesTotal)}
							</span>
						</div>
					)}
					{calculations.packagesTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-muted-foreground">Packages</span>
							<span className="text-foreground font-medium">
								{formatCurrency(calculations.packagesTotal)}
							</span>
						</div>
					)}
					{calculations.discountsTotal > 0 && (
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
