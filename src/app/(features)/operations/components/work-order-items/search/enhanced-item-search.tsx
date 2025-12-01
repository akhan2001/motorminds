'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Package, History, TrendingUp, Copy, Plus } from 'lucide-react'
import { WorkOrderItemsService } from '../../../lib/work-order-items-service'
import { useWorkOrderItemTemplates } from '../../../hooks/use-work-order-item-templates'
import { WorkOrderItem } from '../../../types/work-order-items'
import { WorkOrderItemTemplate } from '../../../types/work-order-item-templates'
import { UnifiedFormItem, formItemToWorkOrderItem } from '../../../types/work-order-item-form'
import { toast } from 'sonner'

interface EnhancedItemSearchProps {
  shopId: string
  itemType?: string
  onItemSelected: (item: UnifiedFormItem) => void
  onTemplateSelected?: (template: WorkOrderItemTemplate) => void
  className?: string
}

type SearchTab = 'all' | 'templates' | 'recent' | 'frequent'

export const EnhancedItemSearch: React.FC<EnhancedItemSearchProps> = ({
  shopId,
  itemType,
  onItemSelected,
  onTemplateSelected,
  className = ''
}) => {
  const [searchInput, setSearchInput] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<SearchTab>('all')
  const [isSearching, setIsSearching] = useState(false)

  // Search results state
  const [matchedItems, setMatchedItems] = useState<WorkOrderItem[]>([])
  const [recentItems, setRecentItems] = useState<WorkOrderItem[]>([])
  const [frequentItems, setFrequentItems] = useState<Array<WorkOrderItem & { usage_count: number }>>([])

  // Fetch templates using existing hook
  const shouldFetchTemplates = searchTerm.length > 0
  const { data: templates = [], isLoading: templatesLoading } = useWorkOrderItemTemplates(
    shopId,
    { enabled: shouldFetchTemplates }
  )

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch work order items when search term changes
  useEffect(() => {
    if (!searchTerm) {
      setMatchedItems([])
      return
    }

    const fetchItems = async () => {
      setIsSearching(true)
      try {
        const results = await WorkOrderItemsService.searchWithSuggestions(
          shopId,
          searchTerm,
          itemType
        )
        setMatchedItems(results.matches)
        setRecentItems(results.recent)
        setFrequentItems(results.frequent)
      } catch (error) {
        console.error('Error searching items:', error)
        toast.error('Failed to search items')
      } finally {
        setIsSearching(false)
      }
    }

    fetchItems()
  }, [searchTerm, shopId, itemType])

  // Load recent and frequent items on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [recent, frequent] = await Promise.all([
          WorkOrderItemsService.getRecentWorkOrderItems(shopId, itemType, 5),
          WorkOrderItemsService.getFrequentWorkOrderItems(shopId, itemType, 5)
        ])
        setRecentItems(recent)
        setFrequentItems(frequent)
      } catch (error) {
        console.error('Error loading initial data:', error)
      }
    }

    loadInitialData()
  }, [shopId, itemType])

  // Filter templates by search term and item type
  const filteredTemplates = React.useMemo(() => {
    if (!shouldFetchTemplates) return []

    return templates.filter(template => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesType = !itemType || template.item_type === itemType

      return matchesSearch && matchesType
    })
  }, [templates, searchTerm, shouldFetchTemplates, itemType])

  // Convert WorkOrderItem to UnifiedFormItem
  const convertToFormItem = useCallback((item: WorkOrderItem): UnifiedFormItem => {
    return {
      id: crypto.randomUUID(), // Generate new ID for form
      item_type: item.item_type,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      unit_cost: item.unit_cost,
      labor_hours: item.labor_hours,
      technician_id: item.technician_id,
      part_number: item.part_number,
      supplier: item.supplier,
      warranty_period: item.warranty_period,
      category: item.category,
      notes: item.notes,
      isNew: true,
      hasChanges: false
    }
  }, [])

  // Convert template to UnifiedFormItem
  const convertTemplateToFormItem = useCallback((template: WorkOrderItemTemplate): UnifiedFormItem => {
    return {
      id: crypto.randomUUID(),
      item_type: template.item_type,
      description: template.name,
      quantity: template.quantity || 1,
      unit_price: template.unit_price || 0,
      total_price: (template.quantity || 1) * (template.unit_price || 0),
      unit_cost: template.unit_cost,
      labor_hours: template.labor_hours,
      part_number: template.part_number,
      supplier: template.supplier,
      warranty_period: template.warranty_period,
      category: template.category,
      notes: template.description,
      isNew: true,
      hasChanges: false
    }
  }, [])

  const handleItemClick = (item: WorkOrderItem) => {
    const formItem = convertToFormItem(item)
    onItemSelected(formItem)
    toast.success('Item added')
    setSearchInput('') // Clear search after selection
  }

  const handleTemplateClick = (template: WorkOrderItemTemplate) => {
    if (onTemplateSelected) {
      onTemplateSelected(template)
    } else {
      const formItem = convertTemplateToFormItem(template)
      onItemSelected(formItem)
    }
    toast.success('Template added')
    setSearchInput('') // Clear search after selection
  }

  const renderItemCard = (item: WorkOrderItem, usageCount?: number) => (
    <div
      key={item.id}
      className="p-3 bg-white dark:bg-card border border-border rounded-lg hover:border-blue-500 dark:hover:border-blue-400 cursor-pointer transition-colors"
      onClick={() => handleItemClick(item)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-foreground truncate">
              {item.description}
            </h4>
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex-shrink-0">
              {item.item_type}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {item.item_type === 'labor' && item.labor_hours && (
              <span>{item.labor_hours}h @ ${item.unit_price}/h</span>
            )}
            {item.item_type !== 'labor' && (
              <span>{item.quantity} × ${item.unit_price}</span>
            )}
            <span className="font-semibold text-foreground">
              ${item.total_price.toFixed(2)}
            </span>
            {usageCount && usageCount > 1 && (
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Used {usageCount}×
              </span>
            )}
          </div>
          {item.part_number && (
            <p className="text-xs text-muted-foreground mt-1">
              Part: {item.part_number}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            handleItemClick(item)
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )

  const renderTemplateCard = (template: WorkOrderItemTemplate) => (
    <div
      key={template.id}
      className="p-3 bg-white dark:bg-card border border-border rounded-lg hover:border-purple-500 dark:hover:border-purple-400 cursor-pointer transition-colors"
      onClick={() => handleTemplateClick(template)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Package className="h-3 w-3 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <h4 className="text-sm font-medium text-foreground truncate">
              {template.name}
            </h4>
            <span className="text-xs px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex-shrink-0">
              Template
            </span>
          </div>
          {template.description && (
            <p className="text-xs text-muted-foreground truncate">
              {template.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
              {template.item_type}
            </span>
            {template.unit_price && (
              <span className="font-semibold text-foreground">
                ${template.unit_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            handleTemplateClick(template)
          }}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )

  const isLoading = isSearching || templatesLoading
  const hasSearchTerm = searchTerm.length > 0
  const hasResults =
    matchedItems.length > 0 ||
    filteredTemplates.length > 0 ||
    recentItems.length > 0 ||
    frequentItems.length > 0

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Search Bar */}
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${itemType || 'all'} items and templates...`}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-10 bg-background text-foreground border-border"
          />
          {searchInput !== searchTerm && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-muted-foreground"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchTab)} className="h-full">
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
            <TabsTrigger value="all" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
              All
            </TabsTrigger>
            <TabsTrigger value="templates" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
              Templates
            </TabsTrigger>
            <TabsTrigger value="recent" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
              Recent
            </TabsTrigger>
            <TabsTrigger value="frequent" className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600">
              Frequent
            </TabsTrigger>
          </TabsList>

          {/* All Tab */}
          <TabsContent value="all" className="p-4 space-y-4 mt-0">
            {!hasSearchTerm && !hasResults ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-foreground text-lg font-medium mb-2">
                  Search for Items
                </h4>
                <p className="text-muted-foreground text-sm">
                  Type to search templates and existing items
                </p>
              </div>
            ) : isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                <p className="text-muted-foreground text-sm">Searching...</p>
              </div>
            ) : (
              <>
                {/* Matched Items */}
                {matchedItems.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Search className="h-4 w-4" />
                      Matching Items ({matchedItems.length})
                    </h5>
                    <div className="space-y-2">
                      {matchedItems.map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}

                {/* Templates */}
                {filteredTemplates.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Templates ({filteredTemplates.length})
                    </h5>
                    <div className="space-y-2">
                      {filteredTemplates.map(template => renderTemplateCard(template))}
                    </div>
                  </div>
                )}

                {/* Recent Items */}
                {!hasSearchTerm && recentItems.length > 0 && (
                  <div>
                    <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Recent Items
                    </h5>
                    <div className="space-y-2">
                      {recentItems.slice(0, 3).map(item => renderItemCard(item))}
                    </div>
                  </div>
                )}

                {/* No Results */}
                {hasSearchTerm && matchedItems.length === 0 && filteredTemplates.length === 0 && (
                  <div className="text-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-foreground text-lg font-medium mb-2">
                      No results found
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      Try a different search term
                    </p>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="p-4 space-y-2 mt-0">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map(template => renderTemplateCard(template))
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  {hasSearchTerm ? 'No templates found' : 'Search to find templates'}
                </p>
              </div>
            )}
          </TabsContent>

          {/* Recent Tab */}
          <TabsContent value="recent" className="p-4 space-y-2 mt-0">
            {recentItems.length > 0 ? (
              recentItems.map(item => renderItemCard(item))
            ) : (
              <div className="text-center py-12">
                <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  No recent items
                </p>
              </div>
            )}
          </TabsContent>

          {/* Frequent Tab */}
          <TabsContent value="frequent" className="p-4 space-y-2 mt-0">
            {frequentItems.length > 0 ? (
              frequentItems.map(item => renderItemCard(item, item.usage_count))
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  No frequently used items yet
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
