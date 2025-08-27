'use client';

import React from 'react';
import { Shield, Lock, Timer } from 'lucide-react';
import { useFinancialsAuth } from '@/contexts/FinancialsAuthContext';

interface FinancialsSectionIndicatorProps {
    showInNavbar?: boolean;
}

export function FinancialsSectionIndicator({ showInNavbar = false }: FinancialsSectionIndicatorProps) {
    const { isUnlocked, isLocked, lockoutTimeRemaining, sessionExpiresAt } = useFinancialsAuth();

    if (showInNavbar) {
        return (
            <div className="flex items-center">
                {isUnlocked ? (
                    <Shield className="w-4 h-4 text-green-400" title="Financial section unlocked" />
                ) : isLocked ? (
                    <Timer className="w-4 h-4 text-yellow-400" title={`Locked for ${lockoutTimeRemaining}s`} />
                ) : (
                    <Lock className="w-4 h-4 text-red-400" title="Financial section locked" />
                )}
            </div>
        );
    }

    // Full status display
    return (
        <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {isUnlocked ? (
                        <>
                            <Shield className="w-5 h-5 text-green-400 mr-2" />
                            <span className="text-green-400 font-medium">Financial Access: Active</span>
                        </>
                    ) : isLocked ? (
                        <>
                            <Timer className="w-5 h-5 text-yellow-400 mr-2" />
                            <span className="text-yellow-400 font-medium">
                                Locked ({lockoutTimeRemaining}s remaining)
                            </span>
                        </>
                    ) : (
                        <>
                            <Lock className="w-5 h-5 text-red-400 mr-2" />
                            <span className="text-red-400 font-medium">Financial Access: Locked</span>
                        </>
                    )}
                </div>
                
                {isUnlocked && sessionExpiresAt && (
                    <div className="text-xs text-gray-400">
                        Session expires: {new Date(sessionExpiresAt).toLocaleTimeString()}
                    </div>
                )}
            </div>
        </div>
    );
}