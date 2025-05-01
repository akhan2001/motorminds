import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { ImmediateInsights, UpsellSuggestion, InsightFlag } from "@/app/mia/types/MiaInsights";
import { Button } from "@/components/ui/button";
import { generateImmediateAnalysis } from "@/app/mia/utils/insightsGenerator";

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: { shopId: string, taskId: string, workOrderData: DetailedRepairOrder }) {
	const [insights, setInsights] = useState<any>(null);
	const [analysis, setAnalysis] = useState<ImmediateInsights | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	
	const fetchInsights = async () => {
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
				setAnalysis(data.analysis as ImmediateInsights);
			}
		}
		setLoading(false);
	};
	
	useEffect(() => {
		fetchInsights();
	}, [taskId]);
	
	const handleRefreshInsights = async () => {
		if (refreshing || !taskId || !workOrderData) return;
		
		try {
			setRefreshing(true);
			
			const result = await generateImmediateAnalysis(
				workOrderData,
				insights?.id || ''
			);
			
			if (result.success) {
				// Fetch the latest data after generation
				await fetchInsights();
			} else {
				console.error("Error refreshing insights:", result.error);
			}
		} catch (error) {
			console.error("Error refreshing insights:", error);
		} finally {
			setRefreshing(false);
		}
	};
	
	return (
		<div className="w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-[#222222] flex justify-between items-center">
				<div>
					<h3 className="text-lg font-medium text-white">Mia Insights</h3>
					{/* {analysis?.summary && (
						<p className="text-sm text-gray-400 mt-1">{analysis.summary}</p>
					)} */}
				</div>
				<Button 
					variant="ghost" 
					size="sm" 
					className="h-8 w-8 p-0" 
					onClick={handleRefreshInsights}
					disabled={refreshing || loading}
					title="Regenerate insights"
				>
					<RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
					<span className="sr-only">Refresh insights</span>
				</Button>
			</div>
			
			{/* Content */}
			<div className="flex-1 overflow-y-auto p-4">
				{loading ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-pulse text-gray-400">Loading insights...</div>
					</div>
				) : refreshing ? (
					<div className="flex items-center justify-center h-32">
						<div className="animate-pulse text-gray-400">Regenerating insights...</div>
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
						
						{/* Flags */}
						{analysis?.flags && analysis.flags.length > 0 && (
							<div className="mb-6">
								<h4 className="text-white font-medium mb-2 flex items-center">
									<AlertCircle className="h-4 w-4 mr-2 text-yellow-500" />
									Maintenance Flags
								</h4>
								<div className="space-y-2">
									{analysis.flags.map((flag, index) => (
										<div key={index} className={`
											${flag.type === 'warning' ? 'bg-yellow-900/20 border-yellow-900/40' : 
											flag.type === 'urgent' ? 'bg-red-900/20 border-red-900/40' : 
											'bg-blue-900/20 border-blue-900/40'}
											border rounded-md p-3
										`}>
											<h5 className={`
												${flag.type === 'warning' ? 'text-yellow-400' : 
												flag.type === 'urgent' ? 'text-red-400' : 
												'text-blue-400'}
												text-sm font-medium
											`}>
												{flag.type.toUpperCase()}
											</h5>
											<p className="text-sm text-gray-300 mt-1">{flag.message}</p>
										</div>
									))}
								</div>
							</div>
						)}
						
						{/* Upsell Opportunities */}
						<h4 className="text-white font-medium mb-2 flex items-center">
							<DollarSign className="h-4 w-4 mr-2 text-green-500" />
							Upsell Opportunities
						</h4>
						
						{analysis?.upsell_suggestions && analysis.upsell_suggestions.length > 0 ? (
							<div className="space-y-3">
								{analysis.upsell_suggestions.map((upsell, index) => (
									<div key={index} className="bg-[#1A1A1A] rounded-lg p-3 border border-[#333333]">
										<div className="flex justify-between items-start">
											<h5 className="font-medium text-white">{upsell.title}</h5>
											{upsell.estimatedValue && (
												<div className="flex items-center text-green-400">
													<DollarSign className="h-4 w-4 mr-1" />
													<span>{upsell.estimatedValue}</span>
												</div>
											)}
										</div>
										<p className="text-sm text-gray-300 mt-1">{upsell.description}</p>
										
										{/* {upsell.priority && (
											<div className="mt-2">
												<Badge className={`
													${upsell.priority === 'high' ? 'bg-red-600/30 text-red-300 border-red-500' : 
													upsell.priority === 'medium' ? 'bg-yellow-600/30 text-yellow-300 border-yellow-500' : 
													'bg-blue-600/30 text-blue-300 border-blue-500'}
													text-xs
												`}>
													{upsell.priority.toUpperCase()} PRIORITY
												</Badge>
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
