'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Shield, Lock, Eye, Clock, AlertTriangle } from 'lucide-react';
import { FinancialsSetupPassword } from '@/components/financials/FinancialsSetupPassword';
import { createClient } from '@/utils/supabase/client';

interface AccessLogEntry {
    id: string;
    status: string;
    created_at: string;
    ip_address: string;
}

export function FinancialSecuritySettings() {
    const [hasPassword, setHasPassword] = useState<boolean | null>(null);
    const [showSetup, setShowSetup] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [accessLogs, setAccessLogs] = useState<AccessLogEntry[]>([]);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        checkPasswordStatus();
        if (hasPassword) {
            loadAccessLogs();
        }
    }, [hasPassword]);

    const checkPasswordStatus = async () => {
        try {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) {
                setIsLoading(false);
                return;
            }

            // Get user's shop_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single();

            if (userError || !userData?.shop_id) {
                setIsLoading(false);
                return;
            }

            // Check if shop has financial password
            const { data: shopData, error: shopError } = await supabase
                .from('shops')
                .select('financials_password_hash')
                .eq('id', userData.shop_id)
                .single();

            if (shopError) {
                console.error('Error checking password status:', shopError);
                setIsLoading(false);
                return;
            }

            setHasPassword(!!shopData?.financials_password_hash);
        } catch (error) {
            console.error('Error in password status check:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAccessLogs = async () => {
        try {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            
            if (authError || !user) return;

            // Get user's shop_id
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('shop_id')
                .eq('id', user.id)
                .single();

            if (userError || !userData?.shop_id) return;

            // Get recent access logs (last 10 entries)
            const { data: logs, error: logsError } = await supabase
                .from('financials_access_log')
                .select('id, status, created_at, ip_address')
                .eq('shop_id', userData.shop_id)
                .order('created_at', { ascending: false })
                .limit(10);

            if (logsError) {
                console.error('Error loading access logs:', logsError);
                return;
            }

            setAccessLogs(logs || []);
        } catch (error) {
            console.error('Error loading access logs:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return 'text-green-400';
            case 'failure': return 'text-red-400';
            case 'password_setup': return 'text-blue-400';
            case 'session_timeout': return 'text-yellow-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success': return <Shield className="w-4 h-4" />;
            case 'failure': return <AlertTriangle className="w-4 h-4" />;
            case 'password_setup': return <Lock className="w-4 h-4" />;
            case 'session_timeout': return <Clock className="w-4 h-4" />;
            default: return <Eye className="w-4 h-4" />;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="bg-gray-800 rounded-lg p-4">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-600 rounded w-1/3 mb-2"></div>
                        <div className="h-3 bg-gray-600 rounded w-2/3"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (showSetup) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Financial Security</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowSetup(false)}
                        className="border-gray-600 text-gray-300"
                    >
                        Cancel
                    </Button>
                </div>
                
                <FinancialsSetupPassword
                    onComplete={() => {
                        setShowSetup(false);
                        setHasPassword(true);
                    }}
                    onCancel={() => setShowSetup(false)}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">Financial Security</h3>
                
                {/* Password Status */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            {hasPassword ? (
                                <>
                                    <Shield className="w-5 h-5 text-green-400 mr-3" />
                                    <div>
                                        <h4 className="text-white font-medium">Financial Password Active</h4>
                                        <p className="text-gray-400 text-sm">
                                            Your financial data is protected with additional authentication
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
                                    <div>
                                        <h4 className="text-white font-medium">No Financial Password</h4>
                                        <p className="text-gray-400 text-sm">
                                            Set up additional protection for your financial data
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <Button
                            onClick={() => setShowSetup(true)}
                            className={hasPassword 
                                ? "bg-blue-600 hover:bg-blue-700" 
                                : "bg-green-600 hover:bg-green-700"
                            }
                        >
                            {hasPassword ? 'Change Password' : 'Set Password'}
                        </Button>
                    </div>
                </div>

                {/* Security Features */}
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                    <h4 className="text-white font-medium mb-3">Security Features</h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center text-gray-300">
                            <Shield className="w-4 h-4 mr-2 text-blue-400" />
                            Additional password protection for financial data
                        </div>
                        <div className="flex items-center text-gray-300">
                            <Lock className="w-4 h-4 mr-2 text-blue-400" />
                            Automatic lockout after 3 failed attempts
                        </div>
                        <div className="flex items-center text-gray-300">
                            <Clock className="w-4 h-4 mr-2 text-blue-400" />
                            15-minute session timeout for inactivity
                        </div>
                        <div className="flex items-center text-gray-300">
                            <Eye className="w-4 h-4 mr-2 text-blue-400" />
                            Complete audit trail of access attempts
                        </div>
                    </div>
                </div>

                {/* Access Logs */}
                {hasPassword && (
                    <div className="bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-white font-medium">Recent Access Activity</h4>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setShowLogs(!showLogs);
                                    if (!showLogs) loadAccessLogs();
                                }}
                                className="border-gray-600 text-gray-300"
                            >
                                {showLogs ? 'Hide' : 'Show'} Logs
                            </Button>
                        </div>

                        {showLogs && (
                            <div className="space-y-2">
                                {accessLogs.length > 0 ? (
                                    accessLogs.map((log) => (
                                        <div key={log.id} className="flex items-center justify-between py-2 px-3 bg-gray-700 rounded text-sm">
                                            <div className="flex items-center">
                                                <span className={getStatusColor(log.status)}>
                                                    {getStatusIcon(log.status)}
                                                </span>
                                                <span className="ml-2 text-gray-300 capitalize">
                                                    {log.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 text-xs">
                                                {new Date(log.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-sm text-center py-4">
                                        No access activity yet
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
 