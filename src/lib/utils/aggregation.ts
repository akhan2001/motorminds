// Data aggregation and transformation utility functions

/**
 * Group array of objects by a specified key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
        const groupKey = String(item[key])
        if (!groups[groupKey]) {
            groups[groupKey] = []
        }
        groups[groupKey].push(item)
        return groups
    }, {} as Record<string, T[]>)
}

/**
 * Count occurrences of values for a specific key
 */
export function countBy<T>(array: T[], key: keyof T): Record<string, number> {
    return array.reduce((counts, item) => {
        const countKey = String(item[key])
        counts[countKey] = (counts[countKey] || 0) + 1
        return counts
    }, {} as Record<string, number>)
}

/**
 * Sum values for a numeric key
 */
export function sumBy<T>(array: T[], key: keyof T): number {
    return array.reduce((sum, item) => {
        const value = item[key]
        return sum + (typeof value === 'number' ? value : 0)
    }, 0)
}

/**
 * Calculate average for a numeric key
 */
export function averageBy<T>(array: T[], key: keyof T): number {
    if (array.length === 0) return 0
    return sumBy(array, key) / array.length
}

/**
 * Get unique values from array
 */
export function unique<T>(array: T[]): T[] {
    return Array.from(new Set(array))
}

/**
 * Get unique values by a specific key
 */
export function uniqueBy<T>(array: T[], key: keyof T): T[] {
    const seen = new Set()
    return array.filter(item => {
        const keyValue = item[key]
        if (seen.has(keyValue)) {
            return false
        }
        seen.add(keyValue)
        return true
    })
}

/**
 * Calculate percentage distribution
 */
export function calculatePercentageDistribution(counts: Record<string, number>): Record<string, number> {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
    if (total === 0) return {}
    
    const percentages: Record<string, number> = {}
    for (const [key, count] of Object.entries(counts)) {
        percentages[key] = Math.round((count / total) * 100 * 100) / 100 // Round to 2 decimal places
    }
    return percentages
}

/**
 * Find top N items by a numeric key
 */
export function topN<T>(array: T[], key: keyof T, n: number): T[] {
    return array
        .sort((a, b) => {
            const aVal = a[key]
            const bVal = b[key]
            if (typeof aVal === 'number' && typeof bVal === 'number') {
                return bVal - aVal // Descending order
            }
            return 0
        })
        .slice(0, n)
}

/**
 * Chunk array into smaller arrays of specified size
 */
export function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

/**
 * Create frequency map of values
 */
export function frequency<T>(array: T[]): Map<T, number> {
    const freq = new Map<T, number>()
    for (const item of array) {
        freq.set(item, (freq.get(item) || 0) + 1)
    }
    return freq
}

/**
 * Calculate basic statistics for numeric array
 */
export function calculateStats(numbers: number[]): {
    min: number
    max: number
    sum: number
    average: number
    median: number
    count: number
} {
    if (numbers.length === 0) {
        return { min: 0, max: 0, sum: 0, average: 0, median: 0, count: 0 }
    }

    const sorted = [...numbers].sort((a, b) => a - b)
    const sum = numbers.reduce((a, b) => a + b, 0)
    const average = sum / numbers.length
    
    let median: number
    const middle = Math.floor(sorted.length / 2)
    if (sorted.length % 2 === 0) {
        median = (sorted[middle - 1] + sorted[middle]) / 2
    } else {
        median = sorted[middle]
    }

    return {
        min: sorted[0],
        max: sorted[sorted.length - 1],
        sum,
        average,
        median,
        count: numbers.length
    }
}
