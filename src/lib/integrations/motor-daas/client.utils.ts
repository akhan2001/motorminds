/**
 * Utility functions for building MOTOR DaaS API requests
 */

/**
 * Build authenticated query string parameters
 * Extracted from repeated auth param building
 */
export function buildAuthQueryString(
	authParams: { Scheme: string; ApiKey: string; Sig: string; Xdate: string },
	additionalParams?: Record<string, string>,
	correlationId?: string
): string {
	const queryParts: string[] = []

	// Add auth params in correct order: Scheme, ApiKey, Sig, Xdate
	queryParts.push(`Scheme=${encodeURIComponent(authParams.Scheme)}`)
	queryParts.push(`ApiKey=${encodeURIComponent(authParams.ApiKey)}`)
	queryParts.push(`Sig=${authParams.Sig}`) // Already encoded, don't encode again
	queryParts.push(`Xdate=${encodeURIComponent(authParams.Xdate)}`)

	// Add additional params
	if (additionalParams) {
		Object.entries(additionalParams).forEach(([key, value]) => {
			queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
		})
	}

	// Add correlation ID
	if (correlationId) {
		queryParts.push(`xcorrelationid=${encodeURIComponent(correlationId)}`)
	}

	return queryParts.join('&')
}

/**
 * Build full URL with base URL cleaning
 * Extracted from repeated URL construction
 */
export function buildMotorUrl(baseUrl: string, endpoint: string): URL {
	const baseUrlClean = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
	const endpointPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
	return new URL(`${baseUrlClean}${endpointPath}`)
}

/**
 * Build standard MOTOR query params
 * Extracted from repeated query param building
 */
export function buildStandardQueryParams(options?: {
	contentSilos?: string
	attributeStandard?: string
	engineId?: number
	pageIndex?: number
	itemsPerPage?: number
	searchTerm?: string
	subjectId?: number
	resultType?: string
}): Record<string, string> {
	const params: Record<string, string> = {}

	if (options?.contentSilos) {
		params.ContentSilos = options.contentSilos
	}

	if (options?.attributeStandard) {
		params.AttributeStandard = options.attributeStandard
	} else {
		params.AttributeStandard = 'MOTOR' // Default
	}

	if (options?.engineId) {
		params.EN = options.engineId.toString()
	}

	if (options?.pageIndex !== undefined) {
		params.PageIndex = options.pageIndex.toString()
	}

	if (options?.itemsPerPage !== undefined) {
		params.ItemsPerPage = options.itemsPerPage.toString()
	}

	if (options?.searchTerm) {
		params.SearchTerm = options.searchTerm
	}

	if (options?.subjectId) {
		params.SAESubjectID = options.subjectId.toString()
	}

	if (options?.resultType) {
		params.ResultType = options.resultType
	}

	return params
}

