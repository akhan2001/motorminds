'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { useSearch } from './SearchProvider'

interface ModernPaginationProps {
  totalItems: number
  itemsPerPage: number
}

export function ModernPagination({ totalItems, itemsPerPage }: ModernPaginationProps) {
  const { page, updatePage } = useSearch()
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-muted-foreground dark:text-gray-400">
        Showing {((page - 1) * itemsPerPage) + 1} to {Math.min(page * itemsPerPage, totalItems)} of {totalItems.toLocaleString()} results
      </div>
      
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePage(page - 1)}
          disabled={page === 1}
          className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        {visiblePages.map((pageNum, index) => (
          <div key={index}>
            {pageNum === '...' ? (
              <div className="px-3 py-2">
                <MoreHorizontal className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
              </div>
            ) : (
              <Button
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => updatePage(pageNum as number)}
                className={
                  page === pageNum
                    ? "bg-red-600 hover:bg-red-700 text-white"
                    : "bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white"
                }
              >
                {pageNum}
              </Button>
            )}
          </div>
        ))}

        <Button
          variant="outline"
          size="sm"
          onClick={() => updatePage(page + 1)}
          disabled={page === totalPages}
          className="bg-transparent border-border dark:border-[#3a3a3a] text-muted-foreground dark:text-gray-300 hover:bg-accent dark:hover:bg-[#2a2a2a] hover:text-foreground dark:hover:text-white disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
