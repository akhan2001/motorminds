import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Clock, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { ImmediateInsights, UpsellSuggestion, InsightFlag } from "@/app/mia/types/MiaInsights";
import { Button } from "@/components/ui/button";
import { generateImmediateAnalysis } from "@/app/mia/utils/insightsGenerator";
import { toast } from "sonner";

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: { shopId: string, taskId: string, workOrderData: DetailedRepairOrder }) {
	const [insights, setInsights] = useState<any>(null);
	const [analysis, setAnalysis] = useState<ImmediateInsights | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [refreshCount, setRefreshCount] = useState(0);
	const [lastRefreshTime, setLastRefreshTime] = useState<number>(0);
	const [refreshCounter, setRefreshCounter] = useState(0);
	
	const MAX_REFRESHES = 3;
	const RATE_LIMIT_DELAY = 10000; // 10 seconds between refreshes
	
	// Load refresh count from localStorage on component mount
	useEffect(() => {
		if (taskId) {
			const stored = localStorage.getItem(`mia_refresh_${taskId}`);
			if (stored) {
				const data = JSON.parse(stored);
				setRefreshCount(data.count || 0);
				setLastRefreshTime(data.lastTime || 0);
			}
		}
	}, [taskId]);
	
	// Auto-generate insights for new work orders
	useEffect(() => {
		if (!isLoading && !insights && !refreshing && refreshCount === 0 && taskId && workOrderData && shopId) {
			// Check if this work order was created recently (within last 5 minutes)
			const workOrderCreatedAt = new Date(workOrderData.created_at);
			const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
			
			if (workOrderCreatedAt > fiveMinutesAgo) {
				handleRefreshInsights();
			}
		}
	}, [isLoading, insights, refreshing, refreshCount, taskId, workOrderData, shopId]);
	
	// Debug logging for analysis data (disabled for performance)
	// useEffect(() => {
	// 	if (analysis) {
	// 		console.log("Analysis loaded:", analysis);
	// 		console.log("Upsell suggestions:", analysis.upsell_suggestions);
	// 	}
	// }, [analysis]);
	
	useEffect(() => {
		let timeoutId: NodeJS.Timeout;
		setIsLoading(true);
		setInsights(null);
		setAnalysis(null);

		const pollForInsights = async (attempt = 1) => {
			if (!taskId) {
				setIsLoading(false);
				return;
			}

			const { data, error } = await supabase
				.from("mia_customer_insights")
				.select("*")
				.eq("repair_order_id", taskId)
				.maybeSingle();
			
			if (error) {
				console.error("Error fetching insights:", error);
				setIsLoading(false);
				return;
			}

			if (data) {
				setInsights(data);
				if (data.analysis) {
					setAnalysis(data.analysis as ImmediateInsights);
				}
				setIsLoading(false);
			} else if (attempt < 10) {
				timeoutId = setTimeout(() => pollForInsights(attempt + 1), 2000);
			} else {
				setIsLoading(false);
			}
		};

		pollForInsights();

		return () => {
			clearTimeout(timeoutId);
		}
	}, [taskId, refreshCounter]);
	
	const handleRefreshInsights = async () => {
		if (refreshing || !taskId || !workOrderData) return;
		
		if (!shopId) {
			console.error("Error refreshing insights: Shop ID is required");
			return;
		}

		// Check refresh limit
		if (refreshCount >= MAX_REFRESHES) {
			toast.error(`Maximum of ${MAX_REFRESHES} refreshes reached for this work order`);
			return;
		}

		// Check rate limit
		const now = Date.now();
		const timeSinceLastRefresh = now - lastRefreshTime;
		if (timeSinceLastRefresh < RATE_LIMIT_DELAY) {
			const remainingTime = Math.ceil((RATE_LIMIT_DELAY - timeSinceLastRefresh) / 1000);
			toast.error(`Please wait ${remainingTime} seconds before refreshing again`);
			return;
		}
		
		try {
			setRefreshing(true);
			
			const workOrderWithShopId = {
				...workOrderData,
				shop_id: shopId,
				id: taskId 
			};
			
			const result = await generateImmediateAnalysis(
				workOrderWithShopId,
				insights?.id || ''
			);
			
			if (result.success) {
				const newRefreshCount = refreshCount + 1;
				const newRefreshTime = now;
				
				// Update state
				setRefreshCount(newRefreshCount);
				setLastRefreshTime(newRefreshTime);
				setRefreshCounter(c => c + 1);
				
				// Store in localStorage
				localStorage.setItem(`mia_refresh_${taskId}`, JSON.stringify({
					count: newRefreshCount,
					lastTime: newRefreshTime
				}));
				
				toast.success(`Insights refreshed! (${newRefreshCount}/${MAX_REFRESHES} used)`);
			} else {
				console.error("Error refreshing insights:", result.error);
				toast.error("Failed to refresh insights");
			}
		} catch (error) {
			console.error("Error refreshing insights:", error);
			toast.error("Failed to refresh insights");
		} finally {
			setTimeout(() => {
				setRefreshing(false);
			}, 1000);
		}
	};
	
	return (
		<div className="flex flex-col h-full max-h-[calc(100vh-200px)] min-h-[400px]">
			{/* Header - Fixed */}
			<div className="p-3 md:p-4 border-b border-[#222222] flex-shrink-0">
				<div className="flex justify-between items-center">
					<h3 className="text-base md:text-lg font-medium text-white">Mia Insights</h3>
					{refreshCount < MAX_REFRESHES && (
						<Button 
							variant="ghost" 
							size="sm" 
							className={`h-7 w-7 md:h-8 md:w-8 p-0 transition-opacity duration-200 ${refreshing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
							onClick={handleRefreshInsights}
							disabled={refreshing || isLoading}
							title={refreshing ? "Refreshing insights..." : `Generate insights (${refreshCount}/${MAX_REFRESHES} used)`}
						>
							<Zap className={`h-3 w-3 md:h-4 md:w-4 text-blue-400 ${refreshing ? 'animate-pulse' : ''}`} />
							<span className="sr-only">
								{refreshing ? "Refreshing insights..." : "Generate insights"}
							</span>
						</Button>
					)}
					{refreshCount >= MAX_REFRESHES && (
						<div className="text-xs text-gray-500">
							Max refreshes reached
						</div>
					)}
				</div>
			</div>
			
			{/* Content - Scrollable */}
			<div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
				<div className="p-3 md:p-4 pb-6 md:pb-8 space-y-3 md:space-y-4">
					{isLoading ? (
						<div className="flex items-center justify-center h-24 md:h-32">
							<div className="animate-pulse text-gray-400 text-xs md:text-sm">Loading insights...</div>
						</div>
					) : insights ? (
						<div>
							{/* Insight Priority */}
							<div>
								<Badge className={`
									text-xs md:text-sm mb-2
									${insights.priority === 'high' ? 'bg-red-600' : 
									insights.priority === 'medium' ? 'bg-yellow-600' : 'bg-blue-600'}
								`}>
									{insights.priority?.toUpperCase() || 'NORMAL'} PRIORITY
								</Badge>
							</div>
							
							{/* Work Order Analysis */}
							{analysis?.work_order_analysis && (
								<div className="bg-[#1A1A1A] rounded-lg p-3 md:p-4 border border-[#333333]">
									<h4 className="text-sm md:text-base text-white font-medium my-2 flex items-center">
										<Clock className="h-3 w-3 md:h-4 md:w-4 mr-2 text-blue-500" />
										Work Order Analysis
									</h4>
									
									{analysis.work_order_analysis.current_work_assessment && (
										<div className="mb-2 md:mb-3">
											<h5 className="text-xs md:text-sm font-medium text-blue-400 mb-1">Current Work Assessment</h5>
											<p className="text-xs md:text-sm text-gray-300 leading-relaxed">{analysis.work_order_analysis.current_work_assessment}</p>
										</div>
									)}
									
									{analysis.work_order_analysis.related_systems && analysis.work_order_analysis.related_systems.length > 0 && (
										<div className="mb-2 md:mb-3">
											<h5 className="text-xs md:text-sm font-medium text-blue-400 mb-1">Related Systems to Check</h5>
											<div className="flex flex-wrap gap-1">
												{analysis.work_order_analysis.related_systems.map((system, index) => (
													<span key={index} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
														{system}
													</span>
												))}
											</div>
										</div>
									)}
									
									{analysis.work_order_analysis.mileage_considerations && (
										<div className="mb-2 md:mb-3">
											<h5 className="text-xs md:text-sm font-medium text-blue-400 mb-1">Mileage Considerations</h5>
											<p className="text-xs md:text-sm text-gray-300 leading-relaxed">{analysis.work_order_analysis.mileage_considerations}</p>
										</div>
									)}
									
									{analysis.work_order_analysis.timing_recommendations && (
										<div>
											<h5 className="text-xs md:text-sm font-medium text-blue-400 mb-1">Timing Recommendations</h5>
											<p className="text-xs md:text-sm text-gray-300 leading-relaxed">{analysis.work_order_analysis.timing_recommendations}</p>
										</div>
									)}
								</div>
							)}
							
							{/* Flags */}
							{analysis?.flags && analysis.flags.length > 0 && (
								<div>
									<h4 className="text-sm md:text-base text-white font-medium my-2 flex items-center">
										<AlertCircle className="h-3 w-3 md:h-4 md:w-4 mr-2 text-yellow-500" />
										Maintenance Flags
									</h4>
									<div className="space-y-2">
										{analysis.flags.map((flag, index) => (
											<div key={index} className={`
												${flag.type === 'warning' ? 'bg-yellow-900/20 border-yellow-900/40' : 
												flag.type === 'urgent' ? 'bg-red-900/20 border-red-900/40' : 
												'bg-blue-900/20 border-blue-900/40'}
												border rounded-md p-2 md:p-3
											`}>
												<div className="flex justify-between items-start mb-1">
													<h5 className={`
														${flag.type === 'warning' ? 'text-yellow-400' : 
														flag.type === 'urgent' ? 'text-red-400' : 
														'text-blue-400'}
														text-xs md:text-sm font-medium
													`}>
														{flag.type.toUpperCase()}
													</h5>
													<span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
														{flag.category}
													</span>
												</div>
												<p className="text-xs md:text-sm text-gray-300 leading-relaxed">{flag.message}</p>
											</div>
										))}
									</div>
								</div>
							)}
							
							{/* Upsell Opportunities - Categorized */}
							<div>
								<h4 className="text-sm md:text-base text-white font-medium my-2 flex items-center">
									<DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-2 text-green-500" />
									Service Opportunities
								</h4>
								
								{analysis?.upsell_suggestions && analysis.upsell_suggestions.length > 0 ? (
									<div className="space-y-2 md:space-y-3">
										{/* Group by category */}
										{['immediate', 'safety', 'preventive', 'seasonal'].map(category => {
											const categoryItems = analysis.upsell_suggestions.filter(item => item.category === category);
											if (categoryItems.length === 0) return null;
											
											const categoryColors = {
												immediate: 'border-red-500/30 bg-red-900/10',
												safety: 'border-orange-500/30 bg-orange-900/10',
												preventive: 'border-blue-500/30 bg-blue-900/10',
												seasonal: 'border-green-500/30 bg-green-900/10'
											};
											
											const categoryIcons = {
												immediate: '🔴',
												safety: '⚠️',
												preventive: '🔧',
												seasonal: '📅'
											};
											
											return (
												<div key={category} className={`border rounded-lg p-2 md:p-3 ${categoryColors[category as keyof typeof categoryColors]}`}>
													<h5 className="text-xs md:text-sm font-medium text-white mb-2 flex items-center">
														<span className="mr-2">{categoryIcons[category as keyof typeof categoryIcons]}</span>
														{category.charAt(0).toUpperCase() + category.slice(1)} Services
													</h5>
													{categoryItems.map((upsell, index) => (
														<div key={index} className="bg-[#1A1A1A] rounded-lg p-2 md:p-3 border border-[#333333] mb-2 last:mb-0">
															<div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
																<h6 className="text-xs md:text-sm font-medium text-white flex-1">{upsell.title}</h6>
																<div className="flex items-center gap-2 flex-shrink-0">
																	{upsell.priority && (
																		<span className={`text-xs px-2 py-1 rounded ${
																			upsell.priority === 'high' ? 'bg-red-900/30 text-red-300' :
																			upsell.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
																			'bg-green-900/30 text-green-300'
																		}`}>
																			{upsell.priority}
																		</span>
																	)}
																	{upsell.estimatedValue && (
																		<div className="flex items-center text-green-400">
																			<DollarSign className="h-3 w-3 md:h-4 md:w-4 mr-1" />
																			<span className="text-xs md:text-sm">{upsell.estimatedValue}</span>
																		</div>
																	)}
																</div>
															</div>
															<p className="text-xs md:text-sm text-gray-300 mt-1 leading-relaxed">{upsell.description}</p>
														</div>
													))}
												</div>
											);
										})}
									</div>
								) : (
									<div className="text-center py-6 md:py-8 text-gray-400">
										<p className="text-xs md:text-sm">No service opportunities identified</p>
									</div>
								)}
							</div>
							
							{/* Follow-up date if available */}
							{insights.recommended_follow_up_date && (
								<div className="text-xs md:text-sm text-gray-400 border-t border-[#333333] pt-3 md:pt-4 mt-4">
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
						<div className="text-center py-6 md:py-8 text-gray-400 space-y-4">
							<p className="text-xs md:text-sm">No insights available for this repair order</p>
							{refreshCount < MAX_REFRESHES && (
								<Button
									onClick={handleRefreshInsights}
									disabled={refreshing || isLoading}
									className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 text-sm"
								>
									{refreshing ? (
										<>
											<RefreshCw className="h-4 w-4 mr-2 animate-spin" />
											Generating...
										</>
									) : (
										<>
											<Zap className="h-4 w-4 mr-2" />
											Generate AI Insights
										</>
									)}
								</Button>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
