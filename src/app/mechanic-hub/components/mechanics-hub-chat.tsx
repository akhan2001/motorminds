import { useState, useEffect } from "react";
import { DetailedRepairOrder } from "@/components/task-details-modal";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { createMiaInsights } from "../util/mechanics-hub-utils";
import { LoaderCircle, PlusCircle } from "lucide-react";
import { toast } from "sonner";
import UpsellCard from "./upsellCard";

interface UpsellSuggestion {
	title: string;
	description: string;
	estimatedValue: number;
}

export default function MechanicsHubChat({ shopId, taskId, workOrderData }: { shopId: string, taskId: string, workOrderData: DetailedRepairOrder }) {
	const [isLoading, setIsLoading] = useState<boolean>(true);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const [showGenerateButton, setShowGenerateButton] = useState<boolean>(true);
	const [upsellSuggestions, setUpsellSuggestions] = useState<UpsellSuggestion[]>([]);
	const [debugInfo, setDebugInfo] = useState<string>("");

	// Example hard-coded suggestions (for testing)
	const exampleSuggestions = [
		{
			"title": "Tire Rotation",
			"description": "Extend the lifespan of your tires and improve overall vehicle performance.",
			"estimatedValue": 50
		},
		{
			"title": "Air Filter Replacement",
			"description": "Improve engine performance and fuel efficiency with a new air filter.",
			"estimatedValue": 30
		}
	];

	const fetchMiaInsights = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from("repair_order_details")
				.select("mia_insights")
				.eq("repair_order_id", taskId)
				.maybeSingle();

			if (error) {
				console.error("Error fetching Mia insights:", error);
				setDebugInfo(`Error: ${error.message}`);
			} else if (data?.mia_insights) {
				// If we have insights, hide the generate button
				setShowGenerateButton(false);
				
				// Extract the insights from mia_insights
				const miaData = data.mia_insights;
				console.log("Mia insights data:", miaData);
				
				// First check if we need to parse from raw_response
				if (miaData.raw_response) {
					try {
						// Parse values from the raw_response
						const rawResponseContent = miaData.raw_response;
						
						// Try to extract JSON from the markdown code block format
						const jsonMatch = rawResponseContent.match(/```json\s*([\s\S]*?)\s*```/);
						let parsedResponse;
						
						if (jsonMatch && jsonMatch[1]) {
							// If we found a code block, parse the content inside it
							parsedResponse = JSON.parse(jsonMatch[1]);
						} else {
							// Otherwise try to parse the whole response
							parsedResponse = JSON.parse(rawResponseContent);
						}
						
						// Check if it contains upsellSuggestions
						if (parsedResponse.upsellSuggestions && 
							Array.isArray(parsedResponse.upsellSuggestions) &&
							parsedResponse.upsellSuggestions.length > 0) {
							
							setDebugInfo(`Found ${parsedResponse.upsellSuggestions.length} suggestions in raw_response`);
							setUpsellSuggestions(parsedResponse.upsellSuggestions);
						} else {
							setDebugInfo("No upsell suggestions found in parsed raw_response");
						}
					} catch (parseError) {
						console.error("Error parsing raw_response:", parseError);
						setDebugInfo(`Error parsing raw_response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
					}
				}
				// If we still don't have suggestions, check other properties
				if (upsellSuggestions.length === 0) {
					if (miaData.upsell_suggestions && Array.isArray(miaData.upsell_suggestions) && miaData.upsell_suggestions.length > 0) {
						setUpsellSuggestions(miaData.upsell_suggestions);
						setDebugInfo(`Found ${miaData.upsell_suggestions.length} snake_case suggestions`);
					} else if (miaData.upsellSuggestions && Array.isArray(miaData.upsellSuggestions) && miaData.upsellSuggestions.length > 0) {
						setUpsellSuggestions(miaData.upsellSuggestions);
						setDebugInfo(`Found ${miaData.upsellSuggestions.length} camelCase suggestions`);
					} else {
						setDebugInfo(`No suggestions found in data structure: ${Object.keys(miaData).join(", ")}`);
					}
				}
			} else {
				setDebugInfo("No mia_insights data found");
			}
		} catch (error) {
			console.error("Failed to fetch insights:", error);
			setDebugInfo(`Exception: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsLoading(false);
		}
	};

	const handleGenerateInsights = async () => {
		setIsGenerating(true);
		setDebugInfo("Generating insights...");
		
		try {
			const result = await createMiaInsights(taskId, shopId);
			
			if (result?.success) {
				toast.success("Generated new Mia insights");
				setShowGenerateButton(false);
				setDebugInfo("Generation successful, fetching insights...");
				await fetchMiaInsights();
			} else {
				toast.error(result?.message || "Failed to generate insights");
				setDebugInfo(`Generation failed: ${result?.message}`);
			}
		} catch (error) {
			console.error("Error generating insights:", error);
			toast.error("An error occurred while generating insights");
			setDebugInfo(`Generation exception: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			setIsGenerating(false);
		}
	};

	// Handle adding an upsell to the work order
	const handleAddUpsell = (suggestion: UpsellSuggestion) => {
		toast.success(`Added ${suggestion.title} to work order`);
		// Implementation to actually add to work order would go here
	};

	useEffect(() => {
		if (taskId) {
			fetchMiaInsights();
		}
	}, [taskId]);

	return (
		<div className="w-full bg-[#131313] border-l border-[#222222] flex flex-col h-full">
			{/* Header */}
			<div className="p-4 border-b border-[#222222]">
				<h3 className="text-lg font-medium text-white">Mia AI Insights</h3>
			</div>
			
			{showGenerateButton && (
				<div className="p-4 border-b border-[#222222]">
					<Button
						onClick={handleGenerateInsights}
						disabled={isGenerating}
						className="bg-[#22C55E] hover:bg-[#22C55E]/80 text-white w-full"
					>
						{isGenerating ? (
							<>
								<LoaderCircle className="h-4 w-4 mr-2 animate-spin" />
								Analyzing Work Order...
							</>
						) : (
							<>
								<PlusCircle className="h-4 w-4 mr-2" /> Generate Insights
							</>
						)}
					</Button>
				</div>
			)}
			
			{isLoading ? (
				<div className="flex items-center justify-center flex-1 p-4">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
				</div>
			) : (
				<div className="flex-1 overflow-y-auto">
					<div className="p-4 space-y-2">
						{/* Upsell Suggestions */}
						{upsellSuggestions.length > 0 ? (
							<div className="mb-4">
								<h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
									<PlusCircle className="h-3.5 w-3.5 mr-1.5" /> UPSELL OPPORTUNITIES
								</h4>
								{upsellSuggestions.map((suggestion, index) => (
									<UpsellCard 
										key={index} 
										suggestion={suggestion} 
										// onAccept={handleAddUpsell}
									/>
								))}
							</div>
						) : (
							<div className="text-xs text-gray-500 italic">
								No upsell opportunities available
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}