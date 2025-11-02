'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Archive } from 'lucide-react'
import { useAuth } from '../../../operations/hooks/use-auth'
import { useArchivedInvoicesModern, useArchivedInvoiceCountModern } from '../../hooks/use-archived-invoices-modern'
import { ArchivedInvoiceCard } from '../../../components/invoices/archived/ArchivedInvoiceCard'
import { ModernSearchInput } from './ModernSearchInput'
import { ModernPagination } from './ModernPagination'
import { useSearch } from './SearchProvider'
import { InvoiceDetailSheet } from '../../../components/invoices/InvoiceDetailSheet'
import { useInvoiceDetailSheet } from '../../hooks/use-invoice-detail-sheet'

const ITEMS_PER_PAGE = 50

export function ModernArchivedInvoicesList() {
  const { shopId } = useAuth()
  const { searchTerm, page } = useSearch()
  const { selectedInvoice, isSheetOpen, openInvoiceDetail, closeInvoiceDetail } = useInvoiceDetailSheet()
  
  const { 
    data: invoices = [], 
    isLoading, 
    error,
    isFetching 
  } = useArchivedInvoicesModern({
    shopId: shopId || '',
    search: searchTerm,
    page,
    limit: ITEMS_PER_PAGE,
    enabled: !!shopId
  })

  const { 
    data: totalCount = 0 
  } = useArchivedInvoiceCountModern({
    shopId: shopId || '',
    search: searchTerm,
    enabled: !!shopId
  })

  if (error) {
    return (
      <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">Error Loading Archived Invoices</h3>
          <p className="text-red-500 dark:text-red-400">
            {error instanceof Error ? error.message : 'Failed to load archived invoices'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-50 dark:bg-[#1a1a1a] border-border dark:border-[#2a2a2a]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-foreground dark:text-white flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archived Invoices
            {totalCount > 0 && (
              <span className="bg-secondary dark:bg-[#2a2a2a] text-muted-foreground dark:text-gray-300 text-sm px-2 py-1 rounded ml-2">
                {totalCount.toLocaleString()}
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <ModernSearchInput />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 w-full bg-secondary dark:bg-[#2a2a2a]" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && invoices.length === 0 && (
          <div className="p-8 text-center">
            <Archive className="h-12 w-12 text-muted-foreground dark:text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground dark:text-white mb-2">
              {searchTerm ? 'No archived invoices found' : 'No archived invoices'}
            </h3>
            <p className="text-muted-foreground dark:text-gray-400">
              {searchTerm 
                ? 'Try adjusting your search terms'
                : 'Archived invoices will appear here'
              }
            </p>
          </div>
        )}

        {/* Invoice List */}
        {!isLoading && invoices.length > 0 && (
          <>
            <div className="space-y-3 relative">
              {/* Subtle loading overlay for subsequent fetches */}
              {isFetching && (
                <div className="absolute inset-0 bg-black/20 dark:bg-black/20 rounded-lg z-10 flex items-center justify-center">
                  <div className="bg-slate-50 dark:bg-[#1a1a1a] px-3 py-1 rounded text-sm text-foreground dark:text-gray-300">
                    Updating...
                  </div>
                </div>
              )}
              
              {invoices.map((invoice) => (
                <ArchivedInvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => openInvoiceDetail(invoice)}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-6 pt-4 border-t border-border dark:border-gray-800">
              <ModernPagination 
                totalItems={totalCount}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </div>
          </>
        )}
      </CardContent>

      {/* Invoice Detail Sheet */}
      <InvoiceDetailSheet
        invoice={selectedInvoice}
        isOpen={isSheetOpen}
        onClose={closeInvoiceDetail}
      />
    </Card>
  )
}
