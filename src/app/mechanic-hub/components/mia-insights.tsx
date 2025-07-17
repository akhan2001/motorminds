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
        work_order_analysis?: {
            current_work_assessment: string;
            related_systems: string[];
            mileage_considerations: string;
            timing_recommendations: string;
        };
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
          {/* Work Order Analysis */}
          {insights.work_order_analysis && (
            <div>
              <Label className="text-gray-400 text-xs">Work Order Analysis</Label>
              <div className="mt-1 space-y-3 p-3 bg-[#222] rounded-md border border-[#444]">
                {insights.work_order_analysis.current_work_assessment && (
                  <div>
                    <p className="text-blue-400 text-xs font-medium">Current Work Assessment</p>
                    <p className="text-white text-sm mt-1">{insights.work_order_analysis.current_work_assessment}</p>
                  </div>
                )}
                
                {insights.work_order_analysis.related_systems && insights.work_order_analysis.related_systems.length > 0 && (
                  <div>
                    <p className="text-blue-400 text-xs font-medium">Related Systems to Check</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {insights.work_order_analysis.related_systems.map((system, i) => (
                        <span key={i} className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                          {system}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {insights.work_order_analysis.mileage_considerations && (
                  <div>
                    <p className="text-blue-400 text-xs font-medium">Mileage Considerations</p>
                    <p className="text-white text-sm mt-1">{insights.work_order_analysis.mileage_considerations}</p>
                  </div>
                )}
                
                {insights.work_order_analysis.timing_recommendations && (
                  <div>
                    <p className="text-blue-400 text-xs font-medium">Timing Recommendations</p>
                    <p className="text-white text-sm mt-1">{insights.work_order_analysis.timing_recommendations}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
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
                    <div className="flex-1">
                      {typeof flag === 'string' ? flag : (
                        <div>
                          <div className="flex justify-between items-start">
                            <span>{flag.message}</span>
                            {flag.category && (
                              <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded ml-2">
                                {flag.category}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Upsell Opportunities - Enhanced */}
          {insights.upsellSuggestions && insights.upsellSuggestions.length > 0 && (
            <div>
              <Label className="text-gray-400 text-xs">Service Opportunities</Label>
              <ul className="mt-1 space-y-2">
                {insights.upsellSuggestions.map((upsell, i) => (
                  <li key={i} className="text-white text-sm">
                    <div className={`p-3 rounded border ${
                      upsell.category === 'immediate' ? 'border-red-500/30 bg-red-900/10' :
                      upsell.category === 'safety' ? 'border-orange-500/30 bg-orange-900/10' :
                      upsell.category === 'preventive' ? 'border-blue-500/30 bg-blue-900/10' :
                      'border-green-500/30 bg-green-900/10'
                    }`}>
                      <div className="flex items-start">
                        <span className="h-2 w-2 rounded-full bg-green-500 mt-1.5 mr-2 flex-shrink-0"></span>
                        <div className="flex-1">
                          {typeof upsell === 'string' ? upsell : (
                            <div>
                              <div className="flex justify-between items-start">
                                <span className="font-medium">{upsell.title}</span>
                                <div className="flex items-center gap-2">
                                  {upsell.category && (
                                    <span className="text-xs text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                      {upsell.category}
                                    </span>
                                  )}
                                  {upsell.priority && (
                                    <span className={`text-xs px-2 py-1 rounded ${
                                      upsell.priority === 'high' ? 'bg-red-900/30 text-red-300' :
                                      upsell.priority === 'medium' ? 'bg-yellow-900/30 text-yellow-300' :
                                      'bg-green-900/30 text-green-300'
                                    }`}>
                                      {upsell.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                              {upsell.description && <p className="text-gray-400 mt-1">{upsell.description}</p>}
                              {upsell.estimatedValue && 
                                <div className="text-green-400 mt-1">${upsell.estimatedValue}</div>
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
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
