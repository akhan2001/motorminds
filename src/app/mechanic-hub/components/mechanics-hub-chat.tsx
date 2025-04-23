import { useState, useRef, useEffect } from "react";
import { AlertCircle, ThumbsUp, LoaderCircle, RefreshCw, PlusCircle, ClipboardList, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import CustomerRetentionSheet, { useRetentionSheet } from "@/app/lead-generation/components/customer-retention-sheet";
import { Badge } from "@/components/ui/badge";

interface CustomerRetention {
	id: string;
	shop_id: string;
	work_order_id: string;
	customer_id: string;
	vehicle_id: string;
	status: string;
	priority: string;
	created_at: string;
	recommended_followup_date: string;
	next_service_due_date: string | null;
	insights_json: any;
	summary: string | null;
	contact_method_preference: string | null;
	tags: string[] | null;
}

interface MechanicsHubChatProps {
	shopId: string;
	taskId: string;
	workOrderData: DetailedRepairOrder;
}

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: MechanicsHubChatProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [insights, setInsights] = useState<string>("");
	const [upsellSuggestions, setUpsellSuggestions] = useState<any[]>([]);
	const [flags, setFlags] = useState<any[]>([]);
	const [customerActions, setCustomerActions] = useState<any[]>([]);
	const [hasGenerated, setHasGenerated] = useState(false);
	const [retentionData, setRetentionData] = useState<CustomerRetention | null>(null);
	const [loadingRetention, setLoadingRetention] = useState(true);
	const { open, setOpen, retentionId, setRetentionId, openRetentionSheet } = useRetentionSheet();

	// Fetch customer retention data when component mounts
	useEffect(() => {
		const fetchRetentionData = async () => {
			setLoadingRetention(true);
			try {
				const { data, error } = await supabase
					.from("customer_retention")
					.select("*")
					.eq("work_order_id", taskId)
					.single();

				if (error) {
					console.error("Error fetching retention data:", error);
					return;
				}

				if (data) {
					setRetentionData(data);
					
					// If we already have retention data with insights, extract them
					if (data.insights_json) {
						if (data.insights_json.upsellSuggestions) setUpsellSuggestions(data.insights_json.upsellSuggestions);
						if (data.insights_json.flags) setFlags(data.insights_json.flags);
						if (data.insights_json.customerActions) setCustomerActions(data.insights_json.customerActions);
						setHasGenerated(true);
					}
				}
			} catch (error) {
				console.error("Error fetching retention data:", error);
			} finally {
				setLoadingRetention(false);
			}
		};

		if (taskId) {
			fetchRetentionData();
		}
	}, [taskId]);

	const generateInsights = async () => {
		try {
			setIsLoading(true);
			const response = await fetch("/mechanic-hub/api", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					messages: [{
						id: '1',
						role: 'assistant',
						content: "Hello! I'm Mia AI. I've analyzed this work order and have some insights:"
					}],
					work_order_data: workOrderData,
					shop_id: shopId,
					task_id: taskId
				})
			});
			
			if (!response.ok) {
				throw new Error(`Failed to get insights: ${response.status}`);
			}
			
			const data = await response.json();
			if (data.content) {
				// Extract JSON data
				const jsonData = parseJsonFromMessage(data.content);
				
				// Extract clean content for display
				const cleanContent = data.content.replace(/```json\s*[\s\S]*?\s*```/g, '').trim();
				setInsights(cleanContent);
				setHasGenerated(true);
				
				// If we have a retention record, update it with the new insights
				if (retentionData) {
					const { error } = await supabase
						.from("customer_retention")
						.update({
							insights_json: jsonData,
							updated_at: new Date().toISOString()
						})
						.eq("id", retentionData.id);
						
					if (error) {
						console.error("Error updating retention record:", error);
					} else {
						console.log("Updated retention record with new insights");
					}
				} else {
					// Create a new retention record if one doesn't exist
					const newRetentionId = crypto.randomUUID();
					const followupDate = new Date();
					followupDate.setMonth(followupDate.getMonth() + 3); // Default 3-month follow-up
					
					const { error } = await supabase
						.from("customer_retention")
						.insert({
							id: newRetentionId,
							shop_id: shopId,
							work_order_id: taskId,
							customer_id: workOrderData.customers?.id,
							vehicle_id: workOrderData.vehicle_id,
							status: 'pending',
							priority: jsonData.flags?.some((f: any) => f.type === 'urgent') ? 'high' : 'medium',
							recommended_followup_date: followupDate.toISOString().split('T')[0],
							insights_json: jsonData,
							summary: cleanContent
						});
						
					if (error) {
						console.error("Error creating retention record:", error);
					} else {
						setRetentionData({
							id: newRetentionId,
							shop_id: shopId,
							work_order_id: taskId,
							customer_id: workOrderData.customers?.id || "",
							vehicle_id: workOrderData.vehicle_id || "",
							status: 'pending',
							priority: jsonData.flags?.some((f: any) => f.type === 'urgent') ? 'high' : 'medium',
							created_at: new Date().toISOString(),
							recommended_followup_date: followupDate.toISOString().split('T')[0],
							next_service_due_date: null,
							insights_json: jsonData,
							summary: cleanContent,
							contact_method_preference: null,
							tags: null
						});
						console.log("Created new retention record");
					}
				}
				
				toast.success("Generated new insights for this work order");
			}
		} catch (error) {
			console.error("Error fetching insights:", error);
			toast.error("Failed to get AI insights");
		} finally {
			setIsLoading(false);
		}
	};

	const parseJsonFromMessage = (content: string) => {
		const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
		if (jsonMatch && jsonMatch[1]) {
			try {
				const data = JSON.parse(jsonMatch[1]);
				if (data.upsellSuggestions) setUpsellSuggestions(data.upsellSuggestions);
				if (data.flags) setFlags(data.flags);
				if (data.customerActions) setCustomerActions(data.customerActions);
				return data;
			} catch (error) {
				console.error("Failed to parse JSON from message:", error);
			}
		}
		return {};
	};

	// Placeholder function for view retention button
	const handleViewRetention = () => {
		openRetentionSheet(taskId);
	};

	return (
		<div className="flex flex-col h-full">
			{/* Header with buttons */}
			{/* <div className="p-4 border-b border-[#222222] flex items-center justify-between">
				<h3 className="text-sm font-medium text-gray-400">
					{loadingRetention ? (
						<div className="flex items-center gap-2">
							<LoaderCircle className="h-3 w-3 animate-spin" />
							Loading retention data...
						</div>
					) : retentionData ? (
						<div className="flex items-center gap-2">
							<span className={cn(
								"w-2 h-2 rounded-full",
								retentionData.priority === "high" ? "bg-red-500" :
								retentionData.priority === "medium" ? "bg-amber-500" : "bg-blue-500"
							)} />
							{retentionData.status === "pending" ? "Follow-up needed" : 
							 retentionData.status === "in_progress" ? "Follow-up in progress" :
							 retentionData.status === "completed" ? "Follow-up completed" : retentionData.status}
						</div>
					) : (
						"No retention data"
					)}
				</h3>
				
				<Button
					variant="outline"
					size="sm"
					className="text-xs border-[#333333] text-gray-300 hover:bg-[#222222]"
					onClick={handleViewRetention}
				>
					<ClipboardList className="h-3.5 w-3.5 mr-1" />
					View Retention
					<ArrowUpRight className="h-3 w-3 ml-1" />
				</Button>
			</div> */}
			
			{/* Generate button */}
			<div className="p-4 border-b border-[#222222]">
				<Button
					onClick={generateInsights}
					disabled={isLoading}
					className={cn(
						"w-full bg-[#22C55E] hover:bg-[#22C55E]/80 text-white flex items-center justify-center gap-3 py-6 text-base",
						hasGenerated && "bg-[#1A1A1A] hover:bg-[#222222] border border-[#333333]"
					)}
				>
					{isLoading ? (
						<>
							<LoaderCircle className="h-5 w-5 animate-spin" />
							Analyzing...
						</>
					) : hasGenerated ? (
						<>
							<RefreshCw className="h-5 w-5" />
							Regenerate Insights
						</>
					) : (
						<>
							<PlusCircle className="h-5 w-5" />
							Generate Insights
						</>
					)}
				</Button>
			</div>
			
			{/* Show follow-up date if available */}
			{retentionData?.recommended_followup_date && (
				<div className="px-4 py-2 border-b border-[#222222] bg-[#1a1a1a]">
					<div className="flex justify-between items-center">
						<span className="text-xs text-gray-400">Recommended follow-up:</span>

						<Badge variant="outline" className="bg-green-900/40 text-green-400 border-green-900/70">
							<span className="text-sm text-white font-medium">
								{new Date(retentionData.recommended_followup_date).toLocaleDateString()}
							</span>
						</Badge>
					</div>
				</div>
			)}
			
			{/* Scrollable content area */}
			<div className="flex-1 overflow-y-auto">
				{isLoading && !hasGenerated ? (
					<div className="flex items-center justify-center p-8 h-full">
						<div className="flex flex-col items-center gap-4">
							<LoaderCircle className="h-10 w-10 animate-spin text-gray-400" />
							<p className="text-gray-400 text-base">Analyzing work order...</p>
						</div>
					</div>
				) : (
					<>
						{/* Flags */}
						{flags.length > 0 && (
							<div className="p-4 border-b border-[#222222]">
								<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Flags</h4>
								<div className="space-y-2">
									{flags.map((flag, index) => (
										<div key={index} className={cn(
											"text-sm rounded px-3 py-2 flex items-center gap-2",
											flag.type === "important" && "bg-amber-950/40 text-amber-400 border border-amber-900/70",
											flag.type === "urgent" && "bg-red-950/40 text-red-400 border border-red-900/70",
											flag.type === "optional" && "bg-blue-950/40 text-blue-400 border border-blue-900/70"
										)}>
											<AlertCircle className="h-4 w-4 flex-shrink-0" />
											<span>{flag.message}</span>
										</div>
									))}
								</div>
							</div>
						)}
						
						{/* Upsell Opportunities */}
						{upsellSuggestions.length > 0 && (
							<div className="p-4 border-b border-[#222222]">
								<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Upsell Opportunities</h4>
								<div className="space-y-3">
									{upsellSuggestions.map((upsell, index) => (
										<div key={index} className="bg-[#1E1E1E] border border-[#333333] rounded p-3 text-sm text-gray-300">
											<div className="font-medium text-gray-200 text-base mb-1">{upsell.title}</div>
											<p className="text-gray-400 text-sm">{upsell.description}</p>
											<div className="text-green-400 mt-2 flex items-center gap-1.5">
												<span className="text-base">${upsell.estimatedValue}</span>
												<ThumbsUp className="h-4 w-4" />
											</div>
										</div>
									))}
								</div>
							</div>
						)}
						
						{/* Customer Actions */}
						{customerActions.length > 0 && (
							<div className="p-4 border-b border-[#222222]">
								<h4 className="text-sm font-semibold text-gray-400 uppercase mb-3">Customer Actions</h4>
								<div className="space-y-3">
									{customerActions.map((action, index) => (
										<div
											key={index} 
											className="w-full bg-[#1E1E1E] border border-[#333333] rounded p-3 text-sm text-gray-300"
										>
											<div className="font-medium text-gray-200 text-base mb-1">{action.title}</div>
											<p className="text-gray-400 text-sm">{action.message}</p>
										</div>
									))}
								</div>
							</div>
						)}
						
						{/* No insights generated yet */}
						{!hasGenerated && !isLoading && (
							<div className="flex items-center justify-center p-8 h-full">
								<div className="text-center">
									<p className="text-gray-400 text-base">
										{!retentionData ? 
											"No retention record found. Generate insights to create one." : 
											"Click the button above to generate insights for this work order."}
									</p>
								</div>
							</div>
						)}
					</>
				)}
			</div>
			
			{/* Add the retention sheet */}
			<CustomerRetentionSheet 
				retentionId={retentionId}
				open={open} 
				onOpenChange={setOpen}
			/>
		</div>
	);
}