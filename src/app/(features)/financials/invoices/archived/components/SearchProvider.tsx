'use client'

import { createContext, useContext, ReactNode } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

interface SearchContextType {
  searchTerm: string
  page: number
  updateSearch: (term: string) => void
  updatePage: (page: number) => void
  resetSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export function SearchProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const searchTerm = searchParams.get('search') || ''
  const page = Number(searchParams.get('page')) || 1

  // Debounced search update - prevents excessive API calls
  const updateSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (term) {
      params.set('search', term)
    } else {
      params.delete('search')
    }
    
    // Reset to page 1 when searching
    params.set('page', '1')
    
    router.push(`${pathname}?${params.toString()}`)
  }, 300)

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', newPage.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  const resetSearch = () => {
    const params = new URLSearchParams()
    params.set('page', '1')
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <SearchContext.Provider value={{
      searchTerm,
      page,
      updateSearch,
      updatePage,
      resetSearch
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}
