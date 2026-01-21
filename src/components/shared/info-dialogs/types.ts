import { LucideIcon } from 'lucide-react'

export interface InfoSection {
    title: string
    description?: string
    icon?: LucideIcon
    items?: string[]
    steps?: string[]
}

export interface InfoContent {
    sections: InfoSection[]
}
