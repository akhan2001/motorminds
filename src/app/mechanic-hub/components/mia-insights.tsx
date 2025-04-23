import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, ThumbsUp, ArrowRight, Info, Calendar, ChevronDown, ChevronUp, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface MiaInsightsProps {
    insights?: {
        flags?: any[];
        upsellSuggestions?: any[];
        customerActions?: any[];
        summary?: string;
    };
    workOrderStatus?: string;
    recommendedFollowupDate?: string;
    loading?: boolean;
    onOpenRetention?: () => void;
    hasRetentionRecord?: boolean;
}

export default function MiaInsights({
    insights,
    workOrderStatus,
    recommendedFollowupDate,
    loading = false,
    onOpenRetention,
    hasRetentionRecord = false
}: MiaInsightsProps) {
    const [expandedCard, setExpandedCard] = useState<string | null>("summary");
    
    const toggleExpand = (cardId: string) => {
        if (expandedCard === cardId) {
        setExpandedCard(null);
        } else {
        setExpandedCard(cardId);
        }
    };
  
    if (loading) {
        return (
            <Card className="bg-[#292929] border-none">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-white">AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                </div>
                </CardContent>
            </Card>
        );
    }
  
    if (!insights || (!insights.summary && (!insights.flags || insights.flags.length === 0) && 
                    (!insights.upsellSuggestions || insights.upsellSuggestions.length === 0) && 
                    (!insights.customerActions || insights.customerActions.length === 0))) {
        return (
            <Card className="bg-[#292929] border-none">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-white">AI Insights</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="text-gray-400 text-sm italic">No AI insights available</div>
                </CardContent>
            </Card>
        );
    }
  
  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card className="bg-[#292929] border-none">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium text-white">
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* {insights.summary && (
            <div>
              <Label className="text-gray-400 text-xs">Summary</Label>
              <div className="text-white text-sm mt-1 p-3 bg-[#222] rounded-md border border-[#444]">
                {insights.summary}
              </div>
            </div>
          )} */}
          
          {/* Follow-up date if available */}
          {recommendedFollowupDate && (
            <div className="flex items-center mt-1">
              <Calendar className="h-4 w-4 mr-2 text-gray-400" />
              <p className="text-white text-sm">Follow-up: {new Date(recommendedFollowupDate).toLocaleDateString()}</p>
            </div>
          )}
          
          {/* Flags */}
          {insights.flags && insights.flags.length > 0 && (
            <div>
              <Label className="text-gray-400 text-xs">Flags</Label>
              <ul className="mt-1 space-y-2">
                {insights.flags.map((flag, i) => (
                  <li key={i} className="text-white text-sm flex items-start">
                    <span className="h-2 w-2 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    {typeof flag === 'string' ? flag : flag.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Upsell Opportunities */}
          {insights.upsellSuggestions && insights.upsellSuggestions.length > 0 && (
            <div>
              <Label className="text-gray-400 text-xs">Upsell Opportunities</Label>
              <ul className="mt-1 space-y-2">
                {insights.upsellSuggestions.map((upsell, i) => (
                  <li key={i} className="text-white text-sm flex items-start">
                    <span className="h-2 w-2 rounded-full bg-green-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    {typeof upsell === 'string' ? upsell : (
                      <div>
                        <span className="font-medium">{upsell.title}</span>
                        {upsell.description && <p className="text-gray-400 mt-1">{upsell.description}</p>}
                        {upsell.estimatedValue && 
                          <div className="text-green-400 mt-1">${upsell.estimatedValue}</div>
                        }
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Customer Actions */}
          {insights.customerActions && insights.customerActions.length > 0 && (
            <div>
              <Label className="text-gray-400 text-xs">Customer Actions</Label>
              <ul className="mt-1 space-y-2">
                {insights.customerActions.map((action, i) => (
                  <li key={i} className="text-white text-sm flex items-start">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 mr-2 flex-shrink-0"></span>
                    {typeof action === 'string' ? action : (
                      <div>
                        <span className="font-medium">{action.title}</span>
                        {action.message && <p className="text-gray-400 mt-1">{action.message}</p>}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
