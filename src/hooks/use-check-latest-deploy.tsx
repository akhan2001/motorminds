'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { format, differenceInHours, parseISO } from 'date-fns'
import { useDeploymentCommitQuery } from '@/lib/queries/deployment-commit-query'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

/** Default: only show toast if new deployment is at least this many hours newer than current */
const DEFAULT_MIN_HOURS_NEWER = 1 // 1 hour

/** In test mode (NEXT_PUBLIC_TEST_DEPLOYMENT_CHECK=true), show toast on any newer deployment (0 hours) so you can test without waiting 24h */
function getEffectiveMinHoursNewer(minHoursNewer: number): number {
    if (typeof process.env.NEXT_PUBLIC_TEST_DEPLOYMENT_CHECK === 'string' && process.env.NEXT_PUBLIC_TEST_DEPLOYMENT_CHECK === 'true') {
        return 0
    }
    return minHoursNewer
}

/**
 * Feature flag: set NEXT_PUBLIC_SHOW_REFRESH_TOAST=false to disable the toast
 * (check and API still run; toast will never be shown)
 */
function getShowRefreshToast(): boolean {
    if (typeof process.env.NEXT_PUBLIC_SHOW_REFRESH_TOAST === 'string') {
        return process.env.NEXT_PUBLIC_SHOW_REFRESH_TOAST !== 'false'
    }
    return true
}

/**
 * Toast component shown when a new version is available.
 * Theme-aware (light/dark). "Refresh" reloads the page; "Not now" dismisses.
 */
const DeployCheckToast = ({ id }: { id: string | number }) => {
    const router = useRouter()

    return (
        <div className="flex w-full min-w-[320px] max-w-[380px] flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-lg dark:shadow-none dark:ring-1 dark:ring-border">
            <div className="flex flex-row gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10 dark:bg-blue-400/10">
                    <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-1 flex-col gap-0.5 text-left">
                    <p className="font-semibold text-foreground">
                        A new version of MotorMinds is available
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Refresh to see the latest changes.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        toast.dismiss(id)
                        router.refresh()
                        window.location.reload()
                    }}
                >
                    Refresh
                </Button>
            </div>
        </div>
    )
}

/**
 * Hook that checks if a new deployment is available (Supabase Studio–style).
 *
 * Where it runs: typically once in the app root layout/providers so it runs on every project page.
 *
 * How it works:
 * 1. Fetches "current deployment" from /api/deployment-commit (commitSha + commitTime).
 * 2. On first valid response, stores commitTime as "our version" (currentCommitTime).
 * 3. On later refetches, if the API returns a different commitTime (new deployment) and the new
 *    deployment is at least minHoursNewer hours newer than our deployment → show toast once.
 * 4. Toast has "Refresh" (full reload) and "Not now" (dismiss).
 *
 * Feature flag: set NEXT_PUBLIC_SHOW_REFRESH_TOAST=false to never show the toast.
 *
 * Testing locally: set NEXT_PUBLIC_ENABLE_DEPLOYMENT_CHECK=true and
 * NEXT_PUBLIC_TEST_DEPLOYMENT_CHECK=true. Keep the tab open, change TEST_COMMIT_SHA
 * and restart the server; wait for the next refetch (~30s) — do not refresh the tab,
 * or the stored "current" deployment is lost and the toast cannot fire.
 *
 * @param enabled - Whether to run the check and query (e.g. production only).
 * @param minHoursNewer - Only show toast if new deployment is at least this many hours newer (default: 24; overridden to 0 when TEST_DEPLOYMENT_CHECK is true).
 */
export function useCheckLatestDeploy(
    enabled: boolean = true,
    minHoursNewer: number = DEFAULT_MIN_HOURS_NEWER
) {
    const [currentCommitTime, setCurrentCommitTime] = useState<string | null>(null)
    const [isToastShown, setIsToastShown] = useState(false)

    const showRefreshToast = getShowRefreshToast()
    const { data: commit, isLoading } = useDeploymentCommitQuery(enabled)

    // Log commit info on first load (for debugging)
    const commitLoggedRef = useRef(false)
    useEffect(() => {
        if (commit && !commitLoggedRef.current) {
            const commitTimeFormatted =
                commit.commitTime === 'unknown'
                    ? 'unknown time'
                    : format(parseISO(commit.commitTime), 'yyyy-MM-dd HH:mm:ss XXX')

            console.log(
                `[MotorMinds] Running commit ${commit.commitSha} deployed at ${commitTimeFormatted}`
            )
            commitLoggedRef.current = true
        }
    }, [commit])

    // Main logic: detect new deployment and show toast when new build is sufficiently newer
    useEffect(() => {
        if (!enabled || isLoading || !commit) return
        if (commit.commitSha === 'unknown' || commit.commitTime === 'unknown') return
        if (!showRefreshToast) return

        // First load: store the deployment we're running (by commitTime)
        if (!currentCommitTime) {
            setCurrentCommitTime(commit.commitTime)
            return
        }

        // Same deployment: no action
        if (commit.commitTime === currentCommitTime) return

        // Already shown toast this session
        if (isToastShown) return

        try {
            const newTime = parseISO(commit.commitTime)
            const ourTime = parseISO(currentCommitTime)
            const hoursNewer = differenceInHours(newTime, ourTime)
            const requiredHours = getEffectiveMinHoursNewer(minHoursNewer)

            if (hoursNewer < requiredHours) return

            toast.custom(
                (id) => <DeployCheckToast id={id} />,
                {
                    duration: Infinity,
                    position: 'bottom-right',
                }
            )
            setIsToastShown(true)
        } catch (error) {
            console.error('[Deployment Check] Error checking deployment:', error)
        }
    }, [commit, enabled, isLoading, currentCommitTime, isToastShown, minHoursNewer, showRefreshToast])

    return {
        currentCommit: commit?.commitSha,
        currentCommitTime: commit?.commitTime,
        isLoading,
    }
}
