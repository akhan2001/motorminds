'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, X } from 'lucide-react'
import { useSearch } from './SearchProvider'

export function ModernSearchInput() {
  const { searchTerm, updateSearch, resetSearch } = useSearch()
  const [localValue, setLocalValue] = useState(searchTerm)

  // Sync local value with URL state
  useEffect(() => {
    setLocalValue(searchTerm)
  }, [searchTerm])

  const handleInputChange = (value: string) => {
    setLocalValue(value)
    updateSearch(value)
  }

  const handleClear = () => {
    setLocalValue('')
    resetSearch()
  }

  return (
    <div className="relative flex items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search invoices by number, customer, title..."
          value={localValue}
          onChange={(e) => handleInputChange(e.target.value)}
          className="pl-10 pr-10 bg-[#131313] border-[#3a3a3a] text-white placeholder:text-gray-500 focus:border-red-500"
        />
        {localValue && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-700"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  )
}
