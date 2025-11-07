export interface SegmentCriteria {
    tags?: {
        contains?: string[] // Array of tags that must be present
        notContains?: string[] // Array of tags that must not be present
    }
    lastServiceDate?: {
        before?: string // ISO date string
        after?: string // ISO date string
    }
    serviceType?: {
        has?: string[] // Array of service types customer must have
    }
    vehicle?: {
        make?: string[]
        model?: string[]
        year?: {
            min?: number
            max?: number
        }
    }
    totalSpent?: {
        above?: number
        below?: number
    }
    daysSinceLastVisit?: {
        min?: number
        max?: number
    }
}

