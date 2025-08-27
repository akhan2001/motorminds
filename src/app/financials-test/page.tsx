'use client';

import React from 'react';
import { FinancialsAuthProvider } from '@/contexts/FinancialsAuthContext';
import { FinancialsSectionIndicator } from '@/components/financials/FinancialsSectionIndicator';
import { FinancialSecuritySettings } from '@/components/settings/FinancialSecuritySettings';

export default function FinancialsTestPage() {
    return (
        <FinancialsAuthProvider>
            <div className="min-h-screen bg-black p-8">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            Financial Security Test Page
                        </h1>
                        <p className="text-gray-400">
                            Test the financial authentication system components
                        </p>
                    </div>

                    {/* Status Indicator */}
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">Status Indicator</h2>
                        <FinancialsSectionIndicator />
                    </div>

                    {/* Settings Component */}
                    <div>
                        <h2 className="text-xl font-semibold text-white mb-4">Settings Integration</h2>
                        <FinancialSecuritySettings />
                    </div>

                    {/* Test Links */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">Test Navigation</h2>
                        <div className="flex gap-4">
                            <a 
                                href="/financials" 
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                Go to Financials (Protected)
                            </a>
                            <a 
                                href="/settings" 
                                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                            >
                                Go to Settings
                            </a>
                        </div>
                    </div>

                    {/* API Test */}
                    <div className="bg-gray-800 rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-white mb-4">API Endpoints</h2>
                        <div className="space-y-2 text-sm text-gray-300">
                            <div>✅ POST /api/financials/auth/setup-password</div>
                            <div>✅ POST /api/financials/auth/verify-password</div>
                            <div>✅ GET /api/financials/auth/check-lockout</div>
                            <div>✅ GET /api/financials/auth/session-status</div>
                            <div>✅ DELETE /api/financials/auth/session-status (logout)</div>
                        </div>
                    </div>
                </div>
            </div>
        </FinancialsAuthProvider>
    );
}