'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'

export default function AuthTestPage() {
    const [authStatus, setAuthStatus] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const supabase = createClient()
                
                // Check user
                const { data: { user }, error: userError } = await supabase.auth.getUser()
                
                // Check session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession()
                
                // Test API endpoint
                const apiResponse = await fetch('/api/financials/auth/debug-cookies')
                const apiData = await apiResponse.json()
                
                setAuthStatus({
                    user: {
                        loggedIn: !!user,
                        userId: user?.id,
                        email: user?.email,
                        userError: userError?.message
                    },
                    session: {
                        hasSession: !!session,
                        hasAccessToken: !!session?.access_token,
                        sessionError: sessionError?.message
                    },
                    api: {
                        status: apiResponse.status,
                        data: apiData
                    },
                    timestamp: new Date().toISOString()
                })
            } catch (error) {
                setAuthStatus({
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            } finally {
                setLoading(false)
            }
        }

        checkAuth()
    }, [])

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white p-8">
                <h1 className="text-2xl font-bold mb-4">🔍 Testing Authentication...</h1>
                <p>Loading...</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-8">
            <h1 className="text-2xl font-bold mb-4">🔍 Authentication Test Results</h1>
            
            <div className="space-y-6">
                {/* User Status */}
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">👤 User Status</h2>
                    <div className="space-y-1">
                        <p><strong>Logged In:</strong> <span className={authStatus?.user?.loggedIn ? 'text-green-400' : 'text-red-400'}>{authStatus?.user?.loggedIn ? 'YES ✅' : 'NO ❌'}</span></p>
                        <p><strong>User ID:</strong> {authStatus?.user?.userId || 'Not available'}</p>
                        <p><strong>Email:</strong> {authStatus?.user?.email || 'Not available'}</p>
                        {authStatus?.user?.userError && <p><strong>Error:</strong> <span className="text-red-400">{authStatus.user.userError}</span></p>}
                    </div>
                </div>

                {/* Session Status */}
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">🔐 Session Status</h2>
                    <div className="space-y-1">
                        <p><strong>Has Session:</strong> <span className={authStatus?.session?.hasSession ? 'text-green-400' : 'text-red-400'}>{authStatus?.session?.hasSession ? 'YES ✅' : 'NO ❌'}</span></p>
                        <p><strong>Has Access Token:</strong> <span className={authStatus?.session?.hasAccessToken ? 'text-green-400' : 'text-red-400'}>{authStatus?.session?.hasAccessToken ? 'YES ✅' : 'NO ❌'}</span></p>
                        {authStatus?.session?.sessionError && <p><strong>Error:</strong> <span className="text-red-400">{authStatus.session.sessionError}</span></p>}
                    </div>
                </div>

                {/* API Test */}
                <div className="bg-gray-900 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">🌐 API Test</h2>
                    <div className="space-y-1">
                        <p><strong>Status Code:</strong> <span className={authStatus?.api?.status === 200 ? 'text-green-400' : 'text-red-400'}>{authStatus?.api?.status}</span></p>
                        <p><strong>Auth Cookies:</strong> {authStatus?.api?.data?.authCookies || 0}</p>
                        <p><strong>Cookie Names:</strong> {authStatus?.api?.data?.authCookieNames?.join(', ') || 'None'}</p>
                    </div>
                </div>

                {/* Raw Data */}
                <details className="bg-gray-900 p-4 rounded-lg">
                    <summary className="cursor-pointer font-semibold">📋 Raw Debug Data (Click to expand)</summary>
                    <pre className="mt-2 text-sm overflow-auto bg-gray-800 p-2 rounded">
                        {JSON.stringify(authStatus, null, 2)}
                    </pre>
                </details>

                {/* Instructions */}
                <div className="bg-blue-900 p-4 rounded-lg">
                    <h2 className="text-xl font-semibold mb-2">🎯 What This Tells Us</h2>
                    <div className="space-y-2">
                        {authStatus?.user?.loggedIn ? (
                            <p className="text-green-400">✅ You are logged in! The issue is likely in the server-side authentication.</p>
                        ) : (
                            <p className="text-red-400">❌ You are NOT logged in. You need to log in first!</p>
                        )}
                        
                        {authStatus?.session?.hasSession ? (
                            <p className="text-green-400">✅ Session exists! Cookies should be working.</p>
                        ) : (
                            <p className="text-red-400">❌ No session found. Authentication cookies may be missing.</p>
                        )}
                        
                        <p className="text-yellow-400">📋 Copy this entire page output and share it to help diagnose the issue.</p>
                    </div>
                </div>
            </div>
        </div>
    )
}