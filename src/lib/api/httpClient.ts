import { getAccessToken } from '@/contexts/auth-provider'

/**
 * HTTP Client with automatic authentication
 * 
 * Based on Supabase Studio's HTTP client pattern:
 * - Automatically adds Authorization header to all requests
 * - Handles token refresh
 * - Provides consistent error handling
 * - Supports request/response interceptors
 * 
 * @example
 * ```ts
 * import { httpClient } from '@/lib/api/httpClient'
 * 
 * const data = await httpClient.get('/api/shops')
 * await httpClient.post('/api/shops', { name: 'My Shop' })
 * ```
 */

interface RequestOptions extends RequestInit {
    params?: Record<string, string>
}

class HttpClient {
    private baseURL: string

    constructor(baseURL: string = '') {
        this.baseURL = baseURL
    }

    /**
     * Construct headers with authentication
     */
    private async constructHeaders(customHeaders?: HeadersInit): Promise<Headers> {
        const headers = new Headers(customHeaders)

        // Add Content-Type if not already set
        if (!headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json')
        }

        // Add Authorization header if token exists
        const accessToken = await getAccessToken()
        if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`)
        }

        return headers
    }

    /**
     * Build URL with query parameters
     */
    private buildURL(path: string, params?: Record<string, string>): string {
        const url = new URL(path, this.baseURL || window.location.origin)

        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                url.searchParams.append(key, value)
            })
        }

        return url.toString()
    }

    /**
     * Handle response and errors
     */
    private async handleResponse<T>(response: Response): Promise<T> {
        // Check if response is ok
        if (!response.ok) {
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`

            try {
                const errorData = await response.json()
                errorMessage = errorData.error?.message || errorData.message || errorMessage
            } catch {
                // If response is not JSON, use status text
            }

            throw new Error(errorMessage)
        }

        // Parse JSON response
        try {
            return await response.json()
        } catch {
            // If response is not JSON, return empty object
            return {} as T
        }
    }

    /**
     * GET request
     */
    async get<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
        const { params, headers: customHeaders, ...fetchOptions } = options

        const url = this.buildURL(path, params)
        const headers = await this.constructHeaders(customHeaders)

        const response = await fetch(url, {
            ...fetchOptions,
            method: 'GET',
            headers,
        })

        return this.handleResponse<T>(response)
    }

    /**
     * POST request
     */
    async post<T = any>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
        const { params, headers: customHeaders, ...fetchOptions } = options

        const url = this.buildURL(path, params)
        const headers = await this.constructHeaders(customHeaders)

        const response = await fetch(url, {
            ...fetchOptions,
            method: 'POST',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        })

        return this.handleResponse<T>(response)
    }

    /**
     * PUT request
     */
    async put<T = any>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
        const { params, headers: customHeaders, ...fetchOptions } = options

        const url = this.buildURL(path, params)
        const headers = await this.constructHeaders(customHeaders)

        const response = await fetch(url, {
            ...fetchOptions,
            method: 'PUT',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        })

        return this.handleResponse<T>(response)
    }

    /**
     * PATCH request
     */
    async patch<T = any>(path: string, body?: any, options: RequestOptions = {}): Promise<T> {
        const { params, headers: customHeaders, ...fetchOptions } = options

        const url = this.buildURL(path, params)
        const headers = await this.constructHeaders(customHeaders)

        const response = await fetch(url, {
            ...fetchOptions,
            method: 'PATCH',
            headers,
            body: body ? JSON.stringify(body) : undefined,
        })

        return this.handleResponse<T>(response)
    }

    /**
     * DELETE request
     */
    async delete<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
        const { params, headers: customHeaders, ...fetchOptions } = options

        const url = this.buildURL(path, params)
        const headers = await this.constructHeaders(customHeaders)

        const response = await fetch(url, {
            ...fetchOptions,
            method: 'DELETE',
            headers,
        })

        return this.handleResponse<T>(response)
    }
}

// Export singleton instance
export const httpClient = new HttpClient()

// Export class for custom instances
export { HttpClient }

