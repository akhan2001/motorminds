export interface FinancialsAuthAttempt {
    id: string;
    shop_id: string;
    created_at: string;
}

export interface FinancialsAccessLog {
    id: string;
    shop_id: string;
    user_id: string;
    ip_address: string;
    status: 'success' | 'failure' | 'password_setup' | 'session_timeout';
    created_at: string;
}

export interface LockoutStatus {
    isLockedOut: boolean;
    lockoutRemaining: number;
    attemptCount: number;
}

export interface SessionStatus {
    isValid: boolean;
    expiresAt?: string;
    shopId?: string;
    reason?: string;
}

export interface FinancialsAuthState {
    isUnlocked: boolean;
    isLocked: boolean;
    lockoutTimeRemaining: number;
    attemptCount: number;
    sessionExpiresAt: Date | null;
    hasPassword: boolean;
}

export interface FinancialsAuthActions {
    unlock: (password: string) => Promise<{ success: boolean; error?: string; lockoutRemaining?: number }>;
    lock: () => void;
    checkStatus: () => Promise<void>;
    setupPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
    checkLockout: () => Promise<LockoutStatus>;
}