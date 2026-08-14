import { NextResponse } from 'next/server'

/** In dev, one commitTime per server process so a restarted server returns a different "deployment" for the notification test */
const devDeployTime = process.env.NODE_ENV === 'development' ? new Date().toISOString() : null

/**
 * Returns the current deployment commit information
 * Uses Vercel environment variables for commit info
 *
 * In development, commitTime is fixed per server run so that after you restart the server
 * (e.g. after changing TEST_COMMIT_SHA), the next refetch sees a new deployment.
 */
export async function GET() {
    try {
        // For testing in development: use TEST_COMMIT_SHA env var if set
        const testCommitSha = process.env.TEST_COMMIT_SHA || process.env.NEXT_PUBLIC_TEST_COMMIT_SHA

        // Vercel provides these environment variables
        const commitSha = testCommitSha ||
            process.env.VERCEL_GIT_COMMIT_SHA ||
            process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
            (process.env.NODE_ENV === 'development' ? 'dev-test' : 'unknown')

        // Commit time. Vercel does not expose a deployment timestamp as a system env
        // var, so VERCEL_DEPLOYMENT_CREATED_AT is only set if you define it yourself.
        //
        // Never fall back to `new Date()` here: the client stores this value on load
        // and treats any later change as a new deployment, so a per-request timestamp
        // reads as an endless stream of deploys and fires the refresh toast on a timer
        // forever. 'unknown' is the correct answer when we don't know - the client
        // skips the check entirely in that case.
        const commitTime = process.env.VERCEL_DEPLOYMENT_CREATED_AT ||
            (process.env.VERCEL ? 'unknown' : (devDeployTime ?? 'unknown'))

        return NextResponse.json(
            {
                commitSha: commitSha === 'unknown' ? 'unknown' : commitSha.substring(0, 7), // Short SHA
                commitTime: commitTime,
            },
            {
                headers: {
                    'Cache-Control': 's-maxage=600, stale-while-revalidate', // 10 min
                },
            }
        )
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

