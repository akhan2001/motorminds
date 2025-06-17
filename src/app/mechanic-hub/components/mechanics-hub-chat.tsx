import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { ImmediateInsights, UpsellSuggestion, InsightFlag } from "@/app/mia/types/MiaInsights";
import { Button } from "@/components/ui/button";
import { generateImmediateAnalysis } from "@/app/mia/utils/insightsGenerator";
import { toast } from "sonner";

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
		
		// Additional validation
		if (!shopId) {
			console.error("Error refreshing insights: Shop ID is required");
			return;
		}
		
		try {
			setRefreshing(true);
			
			// Ensure workOrderData has the shop_id property
			const workOrderWithShopId = {
				...workOrderData,
				shop_id: shopId, // Ensure shop_id is included
				id: taskId // Ensure the repair order ID is included
			};
			
			console.log("Refreshing insights with data:", {
				shopId,
				taskId,
				hasWorkOrderData: !!workOrderData
			});
			
			const result = await generateImmediateAnalysis(
				workOrderWithShopId,
				insights?.id || ''
			);
			
			if (result.success) {
				// Fetch the latest data after generation
				await fetchInsights();
				console.log("Insights refreshed successfully");
				toast.success("Insights refreshed successfully");
			} else {
				console.error("Error refreshing insights:", result.error);
				toast.error("Failed to refresh insights");
			}
		} catch (error) {
			console.error("Error refreshing insights:", error);
			toast.error("Failed to refresh insights");
		} finally {
			// Add a minimum delay before allowing another refresh
			setTimeout(() => {
				setRefreshing(false);
			}, 1000); // 1 second minimum delay
		}
	};
	
	return (
		<div className="flex flex-col h-full">
			{/* Header - Fixed */}
			<div className="p-4 border-b border-[#222222] flex-shrink-0">
				<div className="flex justify-between items-center">
					<h3 className="text-lg font-medium text-white">Mia Insights</h3>
					<Button 
						variant="ghost" 
						size="sm" 
						className={`h-8 w-8 p-0 transition-opacity duration-200 ${refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
						onClick={handleRefreshInsights}
						disabled={refreshing || loading}
						title={refreshing ? "Refreshing insights..." : "Regenerate insights"}
					>
						<RefreshCw className={`h-4 w-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
						<span className="sr-only">
							{refreshing ? "Refreshing insights..." : "Refresh insights"}
						</span>
					</Button>
				</div>
			</div>
			
			{/* Content - Scrollable */}
			<div className="flex-1 overflow-y-auto min-h-0">
				<div className="p-4">
					{loading ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-pulse text-gray-400">Loading insights...</div>
						</div>
					) : refreshing ? (
						<div className="flex items-center justify-center h-32">
							<div className="animate-pulse text-gray-400">Regenerating insights...</div>
						</div>
					) : insights ? (
						<div className="space-y-4">
							{/* Insight Priority */}
							<div>
								<Badge className={`
									${insights.priority === 'high' ? 'bg-red-600' : 
									insights.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}
								`}>
									{insights.priority?.toUpperCase() || 'NORMAL'} PRIORITY
								</Badge>
							</div>
							
							{/* Flags */}
							{analysis?.flags && analysis.flags.length > 0 && (
								<div>
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
							<div>
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
											</div>
										))}
									</div>
								) : (
									<div className="text-center py-8 text-gray-400">
										<p>No upsell opportunities identified</p>
									</div>
								)}
							</div>
							
							{/* Follow-up date if available */}
							{insights.recommended_follow_up_date && (
								<div className="text-sm text-gray-400 border-t border-[#333333] pt-4">
									{new Date(insights.recommended_follow_up_date).toLocaleDateString() === new Date().toLocaleDateString() ? (
										<></>
									) : (
										<>
											<strong>Recommended follow-up:</strong> {new Date(insights.recommended_follow_up_date).toLocaleDateString()}
										</>
									)}
								</div>
							)}
						</div>
					) : (
						<div className="text-center py-8 text-gray-400">
							<p>No insights available for this repair order</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
