"use client"

import { useCallback, useState } from "react"

/**
 * Hook to load/store values from localStorage with an API similar to useState().
 * Persists the new value to localStorage when the setter is called.
 *
 * @see https://usehooks.com/useLocalStorage/
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
	const [storedValue, setStoredValue] = useState<T>(() => {
		if (typeof window === "undefined") {
			return initialValue
		}
		try {
			const item = window.localStorage.getItem(key)
			return item ? (JSON.parse(item) as T) : initialValue
		} catch {
			return initialValue
		}
	})

	const setValue = useCallback(
		(value: T | ((val: T) => T)) => {
			try {
				const valueToStore = value instanceof Function ? value(storedValue) : value
				setStoredValue(valueToStore)
				if (typeof window !== "undefined") {
					window.localStorage.setItem(key, JSON.stringify(valueToStore))
				}
			} catch (e) {
				console.warn("useLocalStorage setValue error:", e)
			}
		},
		[key, storedValue]
	)

	return [storedValue, setValue] as const
}
