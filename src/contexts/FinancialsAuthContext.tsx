'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { FinancialsAuthState, FinancialsAuthActions, LockoutStatus, SessionStatus } from '@/lib/types/financials-auth';

interface FinancialsAuthContextType extends FinancialsAuthState, FinancialsAuthActions {}

const FinancialsAuthContext = createContext<FinancialsAuthContextType | undefined>(undefined);

interface FinancialsAuthProviderProps {
    children: ReactNode;
}

const SESSION_STORAGE_KEY = 'financials-auth-state';
const ACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds

export function FinancialsAuthProvider({ children }: FinancialsAuthProviderProps) {
    const [state, setState] = useState<FinancialsAuthState>({
        isUnlocked: false,
        isLocked: false,
        lockoutTimeRemaining: 0,
        attemptCount: 0,
        sessionExpiresAt: null,
        hasPassword: false
    });

    const [lastActivity, setLastActivity] = useState<number>(Date.now());

    // Activity tracking
    const updateActivity = useCallback(() => {
        setLastActivity(Date.now());
    }, []);

    // Check for inactivity and auto-lock
    useEffect(() => {
        const checkInactivity = () => {
            if (state.isUnlocked && Date.now() - lastActivity > ACTIVITY_TIMEOUT) {
                lock();
            }
        };

        const interval = setInterval(checkInactivity, 30000); // Check every 30 seconds
        return () => clearInterval(interval);
    }, [state.isUnlocked, lastActivity]);

    // Add activity listeners
    useEffect(() => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, updateActivity, true);
        });

        return () => {
            events.forEach(event => {
                document.removeEventListener(event, updateActivity, true);
            });
        };
    }, [updateActivity]);

    // Load state from sessionStorage on mount
    useEffect(() => {
        const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                if (parsed.sessionExpiresAt) {
                    const expiresAt = new Date(parsed.sessionExpiresAt);
                    if (expiresAt > new Date()) {
                        setState(prev => ({
                            ...prev,
                            isUnlocked: true,
                            sessionExpiresAt: expiresAt
                        }));
                        updateActivity();
                    } else {
                        // Session expired, clear it
                        sessionStorage.removeItem(SESSION_STORAGE_KEY);
                    }
                }
            } catch (error) {
                console.error('Error loading financial auth state:', error);
                sessionStorage.removeItem(SESSION_STORAGE_KEY);
            }
        }

        // Always check session status on mount
        checkStatus();
    }, []);

    // Save state to sessionStorage when unlocked state changes
    useEffect(() => {
        if (state.isUnlocked && state.sessionExpiresAt) {
            sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
                sessionExpiresAt: state.sessionExpiresAt.toISOString()
            }));
        } else {
            sessionStorage.removeItem(SESSION_STORAGE_KEY);
        }
    }, [state.isUnlocked, state.sessionExpiresAt]);

    const setupPassword = useCallback(async (password: string) => {
        try {
            const response = await fetch('/api/financials/auth/setup-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setState(prev => ({ ...prev, hasPassword: true }));
                return { success: true };
            } else {
                return { success: false, error: data.error || 'Failed to set password' };
            }
        } catch (error) {
            return { success: false, error: 'Network error occurred' };
        }
    }, []);

    const unlock = useCallback(async (password: string) => {
        try {
            const response = await fetch('/api/financials/auth/verify-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                const expiresAt = new Date(data.expiresAt);
                setState(prev => ({
                    ...prev,
                    isUnlocked: true,
                    isLocked: false,
                    lockoutTimeRemaining: 0,
                    attemptCount: 0,
                    sessionExpiresAt: expiresAt
                }));
                updateActivity();
                return { success: true };
            } else if (response.status === 429) {
                // Rate limited
                setState(prev => ({
                    ...prev,
                    isLocked: true,
                    lockoutTimeRemaining: data.lockoutRemaining || 60
                }));
                return { success: false, error: data.error, lockoutRemaining: data.lockoutRemaining };
            } else {
                // Wrong password
                await checkLockout(); // Update attempt count
                return { success: false, error: data.error || 'Invalid password' };
            }
        } catch (error) {
            return { success: false, error: 'Network error occurred' };
        }
    }, []);

    const lock = useCallback(() => {
        setState(prev => ({
            ...prev,
            isUnlocked: false,
            sessionExpiresAt: null
        }));
        
        // Call logout endpoint to clear server-side session
        fetch('/api/financials/auth/session-status', {
            method: 'DELETE',
        }).catch(console.error);
    }, []);

    const checkStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/financials/auth/session-status');
            const data: SessionStatus = await response.json();

            if (response.ok && data.isValid && data.expiresAt) {
                const expiresAt = new Date(data.expiresAt);
                if (expiresAt > new Date()) {
                    setState(prev => ({
                        ...prev,
                        isUnlocked: true,
                        sessionExpiresAt: expiresAt
                    }));
                    updateActivity();
                } else {
                    lock();
                }
            } else {
                setState(prev => ({
                    ...prev,
                    isUnlocked: false,
                    sessionExpiresAt: null
                }));
            }
        } catch (error) {
            console.error('Error checking session status:', error);
        }
    }, [lock]);

    const checkLockout = useCallback(async (): Promise<LockoutStatus> => {
        try {
            const response = await fetch('/api/financials/auth/check-lockout');
            const data: LockoutStatus = await response.json();

            if (response.ok) {
                setState(prev => ({
                    ...prev,
                    isLocked: data.isLockedOut,
                    lockoutTimeRemaining: data.lockoutRemaining,
                    attemptCount: data.attemptCount
                }));
                return data;
            }
        } catch (error) {
            console.error('Error checking lockout:', error);
        }
        
        return { isLockedOut: false, lockoutRemaining: 0, attemptCount: 0 };
    }, []);

    // Countdown timer for lockout
    useEffect(() => {
        if (state.lockoutTimeRemaining > 0) {
            const timer = setInterval(() => {
                setState(prev => {
                    const newRemaining = prev.lockoutTimeRemaining - 1;
                    if (newRemaining <= 0) {
                        return {
                            ...prev,
                            isLocked: false,
                            lockoutTimeRemaining: 0
                        };
                    }
                    return {
                        ...prev,
                        lockoutTimeRemaining: newRemaining
                    };
                });
            }, 1000);

            return () => clearInterval(timer);
        }
    }, [state.lockoutTimeRemaining]);

    const contextValue: FinancialsAuthContextType = {
        ...state,
        unlock,
        lock,
        checkStatus,
        setupPassword,
        checkLockout
    };

    return (
        <FinancialsAuthContext.Provider value={contextValue}>
            {children}
        </FinancialsAuthContext.Provider>
    );
}

export function useFinancialsAuth(): FinancialsAuthContextType {
    const context = useContext(FinancialsAuthContext);
    if (context === undefined) {
        throw new Error('useFinancialsAuth must be used within a FinancialsAuthProvider');
    }
    return context;
}