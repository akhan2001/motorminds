'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Shield, Check, X } from 'lucide-react';
import { useFinancialsAuth } from '@/contexts/FinancialsAuthContext';

interface PasswordRequirement {
    label: string;
    test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
    { label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: (pwd) => /\d/.test(pwd) }
];

interface FinancialsSetupPasswordProps {
    onComplete?: () => void;
    onCancel?: () => void;
}

export function FinancialsSetupPassword({ onComplete, onCancel }: FinancialsSetupPasswordProps) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const { setupPassword } = useFinancialsAuth();

    const isPasswordValid = passwordRequirements.every(req => req.test(password));
    const passwordsMatch = password === confirmPassword && password.length > 0;
    const canSubmit = isPasswordValid && passwordsMatch && !isLoading;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) return;

        setIsLoading(true);
        setError(null);

        try {
            const result = await setupPassword(password);
            
            if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                    onComplete?.();
                }, 2000);
            } else {
                setError(result.error || 'Failed to set password');
            }
        } catch (error) {
            setError('Network error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-8 w-full max-w-md">
                <div className="text-center">
                    <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                        <Check className="w-8 h-8 text-green-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                        Password Set Successfully
                    </h3>
                    <p className="text-gray-400 text-sm">
                        Your financial data is now protected with an additional layer of security.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-8 w-full max-w-md">
            <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                    <Shield className="w-8 h-8 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">
                    Set Financial Password
                </h2>
                <p className="text-gray-400 text-sm">
                    Add an extra layer of security to your financial data.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm">{error}</p>
                    </div>
                )}

                {/* Password Input */}
                <div>
                    <Label htmlFor="new-financial-password" className="text-gray-300 mb-2 block">
                        New Financial Password
                    </Label>
                    <div className="relative">
                        <Input
                            id="new-financial-password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter a strong password"
                            required
                            disabled={isLoading}
                            className="pr-12 bg-[#222222] border-[#333333] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
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

                {/* Password Requirements */}
                {password && (
                    <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Password Requirements:</Label>
                        <div className="space-y-1">
                            {passwordRequirements.map((req, index) => {
                                const isValid = req.test(password);
                                return (
                                    <div key={index} className="flex items-center text-sm">
                                        {isValid ? (
                                            <Check className="w-4 h-4 text-green-400 mr-2" />
                                        ) : (
                                            <X className="w-4 h-4 text-red-400 mr-2" />
                                        )}
                                        <span className={isValid ? 'text-green-400' : 'text-gray-400'}>
                                            {req.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Confirm Password Input */}
                {isPasswordValid && (
                    <div>
                        <Label htmlFor="confirm-financial-password" className="text-gray-300 mb-2 block">
                            Confirm Password
                        </Label>
                        <div className="relative">
                            <Input
                                id="confirm-financial-password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password"
                                required
                                disabled={isLoading}
                                className="pr-12 bg-[#222222] border-[#333333] text-white placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                                disabled={isLoading}
                            >
                                {showConfirmPassword ? (
                                    <EyeOff className="w-4 h-4" />
                                ) : (
                                    <Eye className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                        {confirmPassword && !passwordsMatch && (
                            <p className="text-red-400 text-sm mt-1">Passwords do not match</p>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {onCancel && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="flex-1 border-[#333333] text-gray-300 hover:bg-[#222222]"
                        >
                            Cancel
                        </Button>
                    )}
                    <Button
                        type="submit"
                        disabled={!canSubmit}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Setting Password...
                            </div>
                        ) : (
                            'Set Password'
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}