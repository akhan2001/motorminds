'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { format, differenceInHours, parseISO } from 'date-fns'
import { useDeploymentCommitQuery } from '@/lib/queries/deployment-commit-query'
import { Button } from '@/components/ui/button'
import { InfoIcon } from 'lucide-react'

/**
 * Toast component shown when new version is available
 */
const DeployCheckToast = ({ id }: { id: string | number }) => {
    const router = useRouter()

    return (
        <div className="flex w-full flex-col gap-3 rounded-lg bg-white p-4 shadow-lg">
            <div className="flex flex-row gap-3">
                <InfoIcon className="w-5 h-5 text-blue-500" />
                <div className="flex w-full flex-col justify-between text-sm">
                    <p className="font-medium text-black">
                        A new version of MotorMinds is available
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Please refresh the page to see the latest changes.
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    className="bg-blue-500 hover:bg-blue-600 text-white"
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
 * Hook that checks if a new deployment is available
 * 
 * How it works:
 * 1. On first load, stores the current commit time
 * 2. Periodically checks for new commits (via React Query)
 * 3. If a new commit is found AND user has been on old version for 24+ hours:
 *    - Shows a toast notification
 *    - Allows user to refresh to get new version
 * 
 * @param enabled - Whether to enable the check (default: true)
 * @param minHoursBeforeNotify - Minimum hours before showing notification (default: 24)
 */
export function useCheckLatestDeploy(
    enabled: boolean = true,
    minHoursBeforeNotify: number = 0
) {
    const router = useRouter()
    const [initialCommitSha, setInitialCommitSha] = useState<string>('')
    const [initialLoadTime, setInitialLoadTime] = useState<Date | null>(null)
    const [isToastShown, setIsToastShown] = useState(false)

    const { data: commit, isLoading } = useDeploymentCommitQuery(enabled)

    // Log commit info on first load (for debugging)
    const commitLoggedRef = useRef(false)
    useEffect(() => {
        if (commit && !commitLoggedRef.current) {
            const commitTime =
                commit.commitTime === 'unknown'
                    ? 'unknown time'
                    : format(parseISO(commit.commitTime), 'yyyy-MM-dd HH:mm:ss XXX')

            console.log(
                `[MotorMinds] Running commit ${commit.commitSha} deployed at ${commitTime}`
            )
            commitLoggedRef.current = true
        }
    }, [commit])

    // Main logic: Check for new deployments
    useEffect(() => {
        // Early returns
        if (!enabled || isLoading || !commit || commit.commitSha === 'unknown') {
            return
        }

        // First load: Store the current commit SHA and page load time
        if (!initialCommitSha) {
            setInitialCommitSha(commit.commitSha)
            setInitialLoadTime(new Date())
            return
        }

        // Same commit: No action needed
        if (initialCommitSha === commit.commitSha) {
            return
        }

        // Already shown toast: Don't show again
        if (isToastShown) {
            return
        }

        // Check if enough time has passed since initial page load (24 hours by default)
        if (!initialLoadTime) {
            return
        }

        try {
            const hoursSinceLoad = differenceInHours(new Date(), initialLoadTime)

            if (hoursSinceLoad < minHoursBeforeNotify) {
                return
            }

            // Show the toast notification
            toast.custom(
                (id) => <DeployCheckToast id={id} />,
                {
                    duration: Infinity, // Don't auto-dismiss
                    position: 'bottom-right',
                }
            )

            setIsToastShown(true)
        } catch (error) {
            console.error('[Deployment Check] Error checking deployment:', error)
        }
    }, [commit, enabled, isLoading, initialCommitSha, initialLoadTime, isToastShown, minHoursBeforeNotify, router])

    return {
        currentCommit: commit?.commitSha,
        currentCommitTime: commit?.commitTime,
        isLoading,
    }
}

