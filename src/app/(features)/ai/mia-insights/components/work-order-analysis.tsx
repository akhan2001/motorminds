'use client'

import React from 'react'
import { FileText, Gauge, Clock, Wrench } from 'lucide-react'
import { WorkOrderAnalysis as WorkOrderAnalysisType } from '../types/mia-insights'

interface WorkOrderAnalysisProps {
    analysis: WorkOrderAnalysisType
}

export const WorkOrderAnalysis: React.FC<WorkOrderAnalysisProps> = ({ analysis }) => {
    if (!analysis) return null

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-medium text-foreground dark:text-gray-300 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                <span>Technical Analysis</span>
            </h4>
            
            <div className="bg-white dark:bg-[#131313] border border-border dark:border-[#2a2a2a] rounded-lg p-4 space-y-4">
                {/* Current Work Assessment */}
                <div>
                    <div className="flex items-center space-x-2 mb-2">
                        <Wrench className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                        <h5 className="text-sm font-medium text-foreground dark:text-gray-300">Current Work Assessment</h5>
                    </div>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                        {analysis.current_work_assessment}
                    </p>
                </div>

                {/* Related Systems */}
                {analysis.related_systems && analysis.related_systems.length > 0 && (
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Gauge className="h-4 w-4 text-green-500 dark:text-green-400" />
                            <h5 className="text-sm font-medium text-foreground dark:text-gray-300">Related Systems</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {analysis.related_systems.map((system, index) => (
                                <span 
                                    key={index}
                                    className="px-2 py-1 bg-blue-500/10 dark:bg-blue-900/20 border border-blue-500/30 rounded text-xs text-blue-600 dark:text-blue-300"
                                >
                                    {system}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Mileage Considerations */}
                {analysis.mileage_considerations && (
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Gauge className="h-4 w-4 text-yellow-500 dark:text-yellow-400" />
                            <h5 className="text-sm font-medium text-foreground dark:text-gray-300">Mileage Considerations</h5>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                            {analysis.mileage_considerations}
                        </p>
                    </div>
                )}

                {/* Timing Recommendations */}
                {analysis.timing_recommendations && (
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <Clock className="h-4 w-4 text-purple-500 dark:text-purple-400" />
                            <h5 className="text-sm font-medium text-foreground dark:text-gray-300">Timing Recommendations</h5>
                        </div>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 leading-relaxed">
                            {analysis.timing_recommendations}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
