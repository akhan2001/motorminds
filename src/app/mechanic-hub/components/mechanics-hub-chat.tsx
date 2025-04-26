import { useState } from "react";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { Button } from "@/components/ui/button";
import { createMiaInsights } from "../util/mechanics-hub-utils";
import { LoaderCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: { shopId: string, taskId: string, workOrderData: DetailedRepairOrder }) {
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [debugInfo, setDebugInfo] = useState<string>("");
	const [miaInsightsData, setMiaInsightsData] = useState<any>(null);
	const [miaCustomerInsightsData, setMiaCustomerInsightsData] = useState<any>(null);

	const handleTestInsights = async () => {
		setIsGenerating(true);
		setDebugInfo(`Starting test with:\nshopId: ${shopId}\ntaskId: ${taskId}`);
		
		try {
			// 0. Print out initial values
			setDebugInfo(prev => `${prev}\n\nWorkOrder Data Sample:`);
			if (workOrderData) {
				const sample = {
					id: workOrderData.id,
					status: workOrderData.status,
					customer_id: workOrderData.customer_id,
					vehicle_id: workOrderData.vehicle_id,
					shop_id: shopId
				};
				setDebugInfo(prev => `${prev}\n${JSON.stringify(sample, null, 2)}`);
			} else {
				setDebugInfo(prev => `${prev}\nNo work order data available!`);
			}
			
			// 1. Generate insights
			setDebugInfo(prev => `${prev}\n\nGenerating insights...`);
			const result = await createMiaInsights(taskId, shopId);
			setDebugInfo(prev => `${prev}\nResult: ${JSON.stringify(result, null, 2)}`);
			
			if (result?.success) {
				toast.success("Generated new Mia insights");
				
				// 2. Check repair_order_details for mia_insights
				setDebugInfo(prev => `${prev}\n\nChecking repair_order_details table...`);
				const { data: repairOrderDetails, error: repairOrderError } = await supabase
					.from("repair_order_details")
					.select("mia_insights, insights_status")
					.eq("repair_order_id", taskId)
					.maybeSingle();
				
				if (repairOrderError) {
					setDebugInfo(prev => `${prev}\nError: ${repairOrderError.message}`);
				} else {
					setMiaInsightsData(repairOrderDetails);
					setDebugInfo(prev => `${prev}\nStatus: ${repairOrderDetails?.insights_status || 'unknown'}`);
					
					// Print a sample of the insights data (not all of it as it could be very large)
					if (repairOrderDetails?.mia_insights) {
						setDebugInfo(prev => `${prev}\nInsights found! Sample:`);
						const insights = repairOrderDetails.mia_insights;
						const sample = {
							summary: insights.summary,
							upsell_count: insights.upsell_suggestions?.length || 0,
							flags_count: insights.flags?.length || 0
						};
						setDebugInfo(prev => `${prev}\n${JSON.stringify(sample, null, 2)}`);
					} else {
						setDebugInfo(prev => `${prev}\nNo insights data found in repair_order_details`);
					}
				}
				
				// 3. Check mia_customer_insights table
				setDebugInfo(prev => `${prev}\n\nChecking mia_customer_insights table...`);
				const { data: customerInsights, error: customerInsightsError } = await supabase
					.from("mia_customer_insights")
					.select("*")
					.eq("repair_order_id", taskId)
					.maybeSingle();
				
				if (customerInsightsError) {
					setDebugInfo(prev => `${prev}\nError: ${customerInsightsError.message}`);
				} else {
					setMiaCustomerInsightsData(customerInsights);
					if (customerInsights) {
						setDebugInfo(prev => `${prev}\nRecord FOUND! Raw Data:`);
						
						// Print ALL fields individually for clarity
						setDebugInfo(prev => `${prev}\n\n--- CUSTOMER INSIGHTS FIELDS ---`);
						setDebugInfo(prev => `${prev}\nid: ${customerInsights.id || 'null'}`);
						setDebugInfo(prev => `${prev}\ncustomer_id: ${customerInsights.customer_id || 'null'}`);
						setDebugInfo(prev => `${prev}\nvehicle_id: ${customerInsights.vehicle_id || 'null'}`);
						setDebugInfo(prev => `${prev}\nshop_id: ${customerInsights.shop_id || 'null'}`);
						setDebugInfo(prev => `${prev}\ngenerated_from: ${customerInsights.generated_from || 'null'}`);
						setDebugInfo(prev => `${prev}\nrepair_order_id: ${customerInsights.repair_order_id || 'null'}`);
						setDebugInfo(prev => `${prev}\nsummary: ${customerInsights.summary || 'null'}`);
						setDebugInfo(prev => `${prev}\ncreated_at: ${customerInsights.created_at || 'null'}`);
						setDebugInfo(prev => `${prev}\nupdated_at: ${customerInsights.updated_at || 'null'}`);
						setDebugInfo(prev => `${prev}\ntimeframe: ${customerInsights.timeframe || 'null'}`);
						setDebugInfo(prev => `${prev}\npriority: ${customerInsights.priority || 'null'}`);
						setDebugInfo(prev => `${prev}\nstatus: ${customerInsights.status || 'null'}`);
						setDebugInfo(prev => `${prev}\nrecommended_follow_up_date: ${customerInsights.recommended_follow_up_date || 'null'}`);
						setDebugInfo(prev => `${prev}\nestimated_value: ${customerInsights.estimated_value || 'null'}`);
						setDebugInfo(prev => `${prev}\nconfidence_score: ${customerInsights.confidence_score || 'null'}`);
						
						// Check if analysis field exists and what type it is
						if (customerInsights.analysis) {
							setDebugInfo(prev => `${prev}\n\nanalysis: (${typeof customerInsights.analysis}) ${
								typeof customerInsights.analysis === 'object' 
								? 'JSON object present' 
								: customerInsights.analysis
							}`);
							
							// If it's an object, show its keys
							if (typeof customerInsights.analysis === 'object') {
								const analysisKeys = Object.keys(customerInsights.analysis);
								setDebugInfo(prev => `${prev}\nanalysis keys: ${analysisKeys.join(', ')}`);
								
								// Sample of each key if not too large
								analysisKeys.forEach(key => {
									const value = customerInsights.analysis[key];
									if (Array.isArray(value)) {
										setDebugInfo(prev => `${prev}\nanalysis.${key}: Array with ${value.length} items`);
									} else if (typeof value === 'object') {
										setDebugInfo(prev => `${prev}\nanalysis.${key}: Object with keys: ${Object.keys(value).join(', ')}`);
									} else {
										setDebugInfo(prev => `${prev}\nanalysis.${key}: ${String(value).substring(0, 100)}${String(value).length > 100 ? '...' : ''}`);
									}
								});
							}
						} else {
							setDebugInfo(prev => `${prev}\nanalysis: null or undefined`);
						}
						
						// Also log to console for easier debugging
						console.log("customerInsights full data:", customerInsights);
					} else {
						setDebugInfo(prev => `${prev}\nNO RECORD FOUND in mia_customer_insights table`);
					}
				}
			} else {
				toast.error(result?.message || "Failed to generate insights");
				setDebugInfo(prev => `${prev}\nGeneration failed: ${result?.message || 'Unknown error'}`);
			}
		} catch (error) {
			console.error("Error in test function:", error);
			toast.error("An error occurred while testing");
			setDebugInfo(prev => `${prev}\nTest exception: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<div className="w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-[#222222]">
				<h3 className="text-lg font-medium text-white">Mia AI Insights Tester</h3>
			</div>
			
			{/* Test Button */}
			<div className="p-4 border-b border-[#222222]">
				<Button
					onClick={handleTestInsights}
					disabled={isGenerating}
					className="bg-[#22C55E] hover:bg-[#22C55E]/80 text-white w-full"
				>
					{isGenerating ? (
						<>
							<LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
							Testing Mia AI...
						</>
					) : (
						<>
							<PlusCircle className="h-4 w-4 mr-2" /> Test Mia Insights Tables
						</>
					)}
				</Button>
			</div>
			
			{/* Debug Info */}
			<div className="flex-1 overflow-y-auto p-4">
				<h4 className="text-sm font-medium text-gray-400 mb-2">Test Results:</h4>
				<pre className="whitespace-pre-wrap text-xs text-gray-300 border border-gray-700 rounded p-3 bg-black overflow-auto max-h-[500px]">
					{debugInfo || "Click the button to test"}
				</pre>
				
				{miaCustomerInsightsData && (
					<div className="mt-4">
						<h4 className="text-sm font-medium text-gray-400 mb-2">mia_customer_insights Record:</h4>
						<div className="border border-green-700 rounded p-3 bg-green-900/20 text-xs">
							<p><strong>ID:</strong> {miaCustomerInsightsData.id}</p>
							<p><strong>Created:</strong> {new Date(miaCustomerInsightsData.created_at).toLocaleString()}</p>
							<p><strong>Summary:</strong> {miaCustomerInsightsData.summary}</p>
							<p><strong>Priority:</strong> {miaCustomerInsightsData.priority}</p>
							<p><strong>Status:</strong> {miaCustomerInsightsData.status}</p>
							<p><strong>Timeframe:</strong> {miaCustomerInsightsData.timeframe}</p>
							<p><strong>Value:</strong> ${miaCustomerInsightsData.estimated_value}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}