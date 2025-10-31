'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

interface FilterSectionProps {
  searchTerm: string
  setSearchTerm: (term: string) => void
  filter: 'all' | 'pending' | 'processing' | 'quoted' | 'ordered'
  setFilter: (filter: 'all' | 'pending' | 'processing' | 'quoted' | 'ordered') => void
}

export function FilterSection({ searchTerm, setSearchTerm, filter, setFilter }: FilterSectionProps) {
  const filters = ['all', 'pending', 'processing', 'quoted', 'ordered'] as const

  return (
    <div className="flex gap-4 mb-6">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search parts, suppliers, customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white"
          />
        </div>
      </div>
      <div className="flex gap-2">
        {filters.map((status) => (
          <Button
            key={status}
            onClick={() => setFilter(status)}
            variant={filter === status ? 'default' : 'outline'}
            className={
              filter === status
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'border-[#2a2a2a] text-gray-300 hover:bg-[#1a1a1a]'
            }
            size="sm"
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>
    </div>
  )
}
