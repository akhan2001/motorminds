'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, Shield, Timer } from 'lucide-react';
import { useFinancialsAuth } from '@/contexts/FinancialsAuthContext';

interface FinancialsPasswordModalProps {
    onClose?: () => void;
}

export function FinancialsPasswordModal({ onClose }: FinancialsPasswordModalProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        unlock,
        isLocked,
        lockoutTimeRemaining,
        attemptCount
    } = useFinancialsAuth();

    // Clear error when password changes
    useEffect(() => {
        if (error) setError(null);
    }, [password]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim() || isLoading || isLocked) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await unlock(password);

            if (result.success) {
                setPassword('');
                onClose?.();
            } else {
                setError(result.error || 'Access denied');
                setPassword('');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (seconds: number): string => {
        if (seconds < 60) {
            return `${seconds} second${seconds !== 1 ? 's' : ''}`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getAttemptMessage = (): string => {
        if (attemptCount === 0) return '';
        if (attemptCount === 1) return '1 failed attempt';
        if (attemptCount === 2) return '2 failed attempts - 1 more will lock you out';
        return 'Maximum attempts reached';
    };

    return (
        <div className="fixed top-20 left-0 right-0 bottom-0 z-40 flex items-center justify-center">
            {/* Backdrop - only covers area below navbar */}
            <div className="absolute inset-0 bg-black/70 dark:bg-black/70 backdrop-blur-xs" />

            {/* Modal */}
            <div className="relative bg-slate-50 dark:bg-card border border-border rounded-lg p-8 w-full max-w-md mx-4 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="mx-auto w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mb-4">
                        <Shield className="w-8 h-8 text-red-600 dark:text-red-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Financial Data Access
                    </h2>
                    <p className="text-muted-foreground text-sm">
                        This section requires additional authentication for security.
                    </p>
                </div>

                {/* Lockout Screen */}
                {isLocked && (
                    <div className="text-center py-6">
                        <Timer className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-foreground mb-2">
                            Temporarily Locked
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Too many failed attempts. Please wait before trying again.
                        </p>
                        <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20 rounded-lg p-4">
                            <div className="text-2xl font-mono text-yellow-600 dark:text-yellow-400 mb-1">
                                {formatTime(lockoutTimeRemaining)}
                            </div>
                            <div className="text-sm text-yellow-700 dark:text-yellow-300">
                                remaining
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Form */}
                {!isLocked && (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-500/10 border border-red-300 dark:border-red-500/20 rounded-lg p-3">
                                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        {/* Attempt Warning */}
                        {attemptCount > 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-300 dark:border-yellow-500/20 rounded-lg p-3">
                                <p className="text-yellow-700 dark:text-yellow-400 text-sm">
                                    {getAttemptMessage()}
                                </p>
                            </div>
                        )}

                        {/* Password Input */}
                        <div>
                            <Label htmlFor="financial-password" className="text-foreground mb-2 block">
                                Financial Access Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input
                                    id="financial-password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your financial password"
                                    required
                                    disabled={isLoading}
                                    className="pl-10 pr-12 bg-white dark:bg-background border-border text-foreground placeholder-muted-foreground focus:border-red-600 focus:ring-red-600"
                                    autoFocus
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    disabled={isLoading}
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-4 h-4" />
                                    ) : (
                                        <Eye className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={!password.trim() || isLoading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                    Verifying...
                                </div>
                            ) : (
                                'Access Financial Data'
                            )}
                        </Button>
                    </form>
                )}

                {/* Help Text */}
                <div className="mt-6 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground text-center">
                        Contact your administrator if you've forgotten your financial password.
                    </p>
                </div>
            </div>
        </div>
    );
}