/**
 * Parses AI/OpenAI-style API errors (e.g. from stream/useChat) and returns
 * a user-friendly message. Handles JSON payloads like insufficient_quota.
 */
export function getChatErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		const msg = error.message
		try {
			const parsed = JSON.parse(msg) as {
				error?: { code?: string; message?: string; type?: string }
			}
			const apiError = parsed?.error
			if (apiError?.code === "insufficient_quota") {
				return "The AI service has reached its usage limit. Please check your plan and billing, or try again later."
			}
			if (apiError?.message && typeof apiError.message === "string") {
				return apiError.message
			}
		} catch {
			// not JSON, use message as-is
		}
		return msg || "Something went wrong. Please try again."
	}
	return "Something went wrong. Please try again."
}
