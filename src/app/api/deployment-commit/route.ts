import { NextResponse } from 'next/server'

/**
 * Returns the current deployment commit information
 * Uses Vercel environment variables for commit info
 * 
 * Note: For more accurate commit timestamps, consider using the build-time
 * approach documented in the implementation guide (generate-commit-info.js)
 */
export async function GET() {
    try {
        // For testing in development: use TEST_COMMIT_SHA env var if set
        const testCommitSha = process.env.TEST_COMMIT_SHA || process.env.NEXT_PUBLIC_TEST_COMMIT_SHA
        
        // Vercel provides these environment variables
        const commitSha = testCommitSha ||
            process.env.VERCEL_GIT_COMMIT_SHA ||
            process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
            // Fallback: try to get from git in dev, or use a test value
            (process.env.NODE_ENV === 'development' ? 'dev-test' : 'unknown')

        // For commit time, use deployment creation time if available
        // VERCEL_DEPLOYMENT_CREATED_AT is set by Vercel (ISO 8601 format)
        // Fallback to current time for local development
        const commitTime = process.env.VERCEL_DEPLOYMENT_CREATED_AT ||
            (process.env.VERCEL ? new Date().toISOString() : new Date().toISOString())

        return NextResponse.json({
            commitSha: commitSha === 'unknown' ? 'unknown' : commitSha.substring(0, 7), // Short SHA
            commitTime: commitTime,
        })
    } catch (error) {
        console.error('[Deployment Commit API] Error:', error)
        return NextResponse.json(
            {
                commitSha: 'unknown',
                commitTime: 'unknown'
            },
            { status: 500 }
        )
    }
}

