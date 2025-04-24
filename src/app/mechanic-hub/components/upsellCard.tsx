// src/app/mechanic-hub/components/upsellCard.tsx
import React from "react";
import { ThumbsUp, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UpsellSuggestion {
    title: string;
    description: string;
    estimatedValue: number | string;
}

interface UpsellCardProps {
    suggestion: UpsellSuggestion;
    onAccept?: (suggestion: UpsellSuggestion) => void;
}

export default function UpsellCard({ suggestion, onAccept }: UpsellCardProps) {
    // Ensure estimatedValue is properly formatted
    const formatValue = (value: number | string): string => {
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        
        // If it's a string that can be parsed as a number
        const num = parseFloat(value as string);
        if (!isNaN(num)) {
            return num.toFixed(2);
        }
        
        // If it's not a valid number, return as is
        return value as string;
    };

    return (
        <div className="group p-3 rounded bg-[#1A1A1A] border border-[#333333] hover:bg-[#222222] transition-colors cursor-pointer mb-2">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-white font-medium">{suggestion.title}</p>
                    {suggestion.description && (
                        <p className="text-xs text-gray-400 mt-1 mb-1">{suggestion.description}</p>
                    )}
                    {/* <div className="flex justify-between items-center">
                        <p className="text-sm text-green-400">
                            {formatValue(suggestion.estimatedValue)}
                        </p>
                        
                        {onAccept && (
                            <Button 
                                size="sm" 
                                variant="outline" 
                                className="text-xs border-[#444444] text-gray-300 hover:bg-[#2a2a2a] h-7 px-2"
                                onClick={() => onAccept(suggestion)}
                            >
                                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                Add
                            </Button>
                        )}
                    </div> */}
                </div>
            </div>
        </div>
    );
}