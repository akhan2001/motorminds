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
			return 'text-red-400'
		}
		return 'text-white'
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
		<div className={`bg-[#1a1a1a] rounded-lg p-4 ${className}`}>
			<h3 className="text-lg font-semibold text-white mb-4">Cost Summary</h3>
			
			{/* Summary Stats */}
			<div className="grid grid-cols-2 gap-4 mb-4 text-sm">
				<div className="text-gray-400">
					<span className="text-white font-medium">{workOrderItems.length}</span> total items
				</div>
				<div className="text-gray-400">
					<span className="text-white font-medium">{calculations.approvedItems.length}</span> approved
				</div>
				{calculations.rejectedItems.length > 0 && (
					<div className="text-red-400 col-span-2">
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
								? 'border-red-500/30 bg-red-500/5' 
								: 'border-gray-600 bg-gray-700/50'
						}`}
					>
						<div className="flex justify-between items-start mb-2">
							<div className="flex-1">
								<div className="flex items-center gap-2 mb-1">
									<span className={`text-xs font-medium px-2 py-1 rounded ${
										item.active === false 
											? 'bg-red-500/20 text-red-400' 
											: 'bg-green-500/20 text-green-400'
									}`}>
										{item.item_type.toUpperCase()}
									</span>
									<span className={`text-xs font-medium px-2 py-1 rounded ${
										item.active === false 
											? 'bg-red-500/20 text-red-400' 
											: 'bg-green-500/20 text-green-400'
									}`}>
										{getItemStatusText(item)}
									</span>
								</div>
								<h4 className={`font-medium ${getItemStatusColor(item)}`}>
									{item.description}
								</h4>
								{item.part_number && (
									<p className="text-xs text-gray-400">Part #: {item.part_number}</p>
								)}
							</div>
							<div className={`text-right ${getItemStatusColor(item)}`}>
								<div className="font-semibold">
									{formatCurrency(getItemTotal(item))}
								</div>
								{item.active === false && (
									<div className="text-xs text-red-400">Not included in total</div>
								)}
							</div>
						</div>
						
						<div className="flex justify-between text-sm text-gray-400">
							<div>
								{item.item_type === 'labor' ? (
									<span>{item.labor_hours || 0} hours @ {formatCurrency(item.unit_price || 0)}/hr</span>
								) : (
									<span>{item.quantity || 0} × {formatCurrency(item.unit_price || 0)}</span>
								)}
							</div>
							{item.notes && (
								<div className="text-xs text-gray-500 max-w-xs truncate">
									{item.notes}
								</div>
							)}
						</div>
					</div>
				))}
			</div>
			
			{/* Totals */}
			<div className="mt-4 pt-4 border-t border-gray-600">
				<div className="space-y-2 text-sm">
					{calculations.labourTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-gray-400">Labor</span>
							<span className="text-white font-medium">
								{formatCurrency(calculations.labourTotal)}
							</span>
						</div>
					)}
					{calculations.partsTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-gray-400">Parts</span>
							<span className="text-white font-medium">
								{formatCurrency(calculations.partsTotal)}
							</span>
						</div>
					)}
					{calculations.servicesTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-gray-400">Services</span>
							<span className="text-white font-medium">
								{formatCurrency(calculations.servicesTotal)}
							</span>
						</div>
					)}
					{calculations.feesTotal > 0 && (
						<div className="flex justify-between">
							<span className="text-gray-400">Fees</span>
							<span className="text-white font-medium">
								{formatCurrency(calculations.feesTotal)}
							</span>
						</div>
					)}
					<div className="flex justify-between pt-2 border-t border-gray-600">
						<span className="text-white">Subtotal</span>
						<span className="text-white font-medium">
							{formatCurrency(calculations.subtotal)}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-gray-400">Tax ({Math.round(TAX_RATE * 100)}%)</span>
						<span className="text-white font-medium">
							{formatCurrency(calculations.subtotal * TAX_RATE)}
						</span>
					</div>
					<div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-600">
						<span className="text-white">Total (Approved Items Only)</span>
						<span className="text-white">
							{formatCurrency(calculations.subtotal * (1 + TAX_RATE))}
						</span>
					</div>
					{calculations.rejectedItems.length > 0 && (
						<div className="text-xs text-red-400 pt-1">
							{calculations.rejectedItems.length} rejected item(s) excluded from total
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
