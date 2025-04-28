import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertCircle } from "lucide-react";

type Upsell = {
	service: string;
	description: string;
	value_to_shop?: string;
	value_to_customer?: string;
	estimated_cost?: number;
	estimated_time?: string;
};

type MaintenanceFlag = {
	flag: string;
	description: string;
};

type Analysis = {
	work_order_id: string;
	maintenance_flags: MaintenanceFlag[];
	upsell_opportunities: Upsell[];
};

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: { shopId: string, taskId: string, workOrderData: DetailedRepairOrder }) {
	const [insights, setInsights] = useState<any>(null);
	const [analysis, setAnalysis] = useState<Analysis | null>(null);
	const [loading, setLoading] = useState(true);
	
	useEffect(() => {
		async function fetchInsights() {
			if (!taskId) return;
			
			setLoading(true);
			const { data, error } = await supabase
				.from("mia_customer_insights")
				.select("*")
				.eq("repair_order_id", taskId)
				.maybeSingle();
				
			if (!error && data) {
				setInsights(data);
				// Parse the analysis column (which is a JSONB in the database)
				if (data.analysis) {
					setAnalysis(data.analysis as Analysis);
				}
			}
			setLoading(false);
		}
		
		fetchInsights();
	}, [taskId]);
	
	return (
		<div className="w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-[#222222]">
				<h3 className="text-lg font-medium text-white">Upsell Opportunities</h3>
				{insights?.summary && (
					<p className="text-sm text-gray-400 mt-1">{insights.summary}</p>
				)}
			</div>
			
			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				{loading ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-pulse text-gray-400">Loading insights...</div>
					</div>
				) : insights ? (
					<>
						{/* Insight Priority */}
						<div className="mb-4">
							<Badge className={`
								${insights.priority === 'high' ? 'bg-red-600' : 
								insights.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}
							`}>
								{insights.priority?.toUpperCase() || 'NORMAL'} PRIORITY
							</Badge>
						</div>
						
						{/* Maintenance Flags */}
						{/* {analysis?.maintenance_flags?.length && analysis?.maintenance_flags?.length > 0 && (
							<div className="mb-6">
								<h4 className="text-white font-medium mb-2 flex items-center">
									<AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
									Maintenance Flags
								</h4>
								<div className="space-y-2">
									{analysis?.maintenance_flags?.map((flag, index) => (
										<div key={index} className="bg-yellow-900/20 border border-yellow-900/40 rounded-md p-3">
											<h5 className="text-yellow-400 text-sm font-medium">{flag.flag}</h5>
											<p className="text-sm text-gray-300 mt-1">{flag.description}</p>
										</div>
									))}
								</div>
							</div>
						)} */}
						
						{/* Upsell Opportunities */}
						<h4 className="text-white font-medium mb-2 flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-green-500" />
							Upsell Opportunities
						</h4>
						
						{analysis?.upsell_opportunities?.length && analysis?.upsell_opportunities?.length > 0 ? (
							<div className="space-y-3">
								{analysis.upsell_opportunities.map((upsell, index) => (
									<div key={index} className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
										<div className="flex justify-between items-start">
											<h5 className="font-medium text-white">{upsell.service}</h5>
											{upsell.estimated_cost && (
												<div className="flex items-center text-green-400">
													<DollarSign className="h-4 w-4 mr-1" />
													<span>{upsell.estimated_cost}</span>
												</div>
											)}
										</div>
										<p className="text-sm text-gray-300 mt-1">{upsell.description}</p>
										
										{/* {upsell.estimated_time && (
											<div className="flex items-center mt-2 text-xs text-gray-400">
												<Clock className="h-3 w-3 mr-1" />
												<span>Est. time: {upsell.estimated_time}</span>
											</div>
										)} */}
										
										{/* {(upsell.value_to_customer || upsell.value_to_shop) && (
											<div className="mt-2 grid grid-cols-1 gap-1">
												{upsell.value_to_customer && (
													<div className="text-xs">
														<strong className="text-gray-300">Customer value:</strong>{' '}
														<span className="text-gray-400">{upsell.value_to_customer}</span>
													</div>
												)}
											</div>
										)} */}
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-8 text-gray-400">
								<p>No upsell opportunities identified</p>
							</div>
						)}
						
						{/* Follow-up date if available */}
						{insights.recommended_follow_up_date && (
							<div className="mt-4 text-sm text-gray-400 border-t border-[#333333] pt-4">
								{new Date(insights.recommended_follow_up_date).toLocaleDateString() === new Date().toLocaleDateString() ? (
									// <strong>Recommended follow-up: Today</strong>
									<></>
								) : (
									<>
										<strong>Recommended follow-up:</strong> {new Date(insights.recommended_follow_up_date).toLocaleDateString()}
									</>
								)}
							</div>
						)}
					</>
				) : (
					<div className="text-center py-8 text-gray-400">
						<p>No insights available for this repair order</p>
					</div>
				)}
			</div>
		</div>
	);
}
