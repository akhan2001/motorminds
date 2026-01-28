"use client"

/**
 * FinancialsSessionBar - Shows when financial section is unlocked.
 * Displays a green indicator bar with "Financial session active" and a lock button.
 */
export function FinancialsSessionBar() {
	return (
		<div className="bg-green-50 dark:bg-green-600/10 border-b border-green-300 dark:border-green-600/20 p-2">
			<div className="max-w-7xl mx-auto flex items-center justify-between">
				<div className="flex items-center text-green-600 dark:text-green-400 text-sm">
					<div className="w-2 h-2 bg-green-600 dark:bg-green-400 rounded-full mr-2" />
					Financial session active
				</div>
				<button
					onClick={() => {
						// Reload to lock the section
						window.location.reload()
					}}
					className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 text-sm underline"
				>
					Lock section
				</button>
			</div>
		</div>
	)
}
