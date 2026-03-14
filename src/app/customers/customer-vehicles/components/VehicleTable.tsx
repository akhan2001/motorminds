'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Filter, Building2, Loader2 } from 'lucide-react'
import { useAccessContext } from '@/hooks/customers'
import { vehicleKeys } from '@/data/vehicles/keys'
import {
    VehicleDetailSheet,
    type VehicleWithContext,
} from '@/components/shared/vehicle-detail-sheet'

function useDebouncedSearch(initialValue = '', delay = 300) {
    const [searchTerm, setSearchTerm] = useState(initialValue)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue)

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm)
        }, delay)
        return () => clearTimeout(handler)
    }, [searchTerm, delay])

    return {
        searchTerm: searchTerm ?? '',
        debouncedSearchTerm: debouncedSearchTerm ?? '',
        setSearchTerm,
    }
}

interface VehicleTableProps {
    shopId: string
    user: any
    refreshIndex?: number
}

export function VehicleTable({
    shopId,
    refreshIndex = 0,
}: VehicleTableProps) {
    const queryClient = useQueryClient()
    const [selectedVehicle, setSelectedVehicle] =
        useState<VehicleWithContext | null>(null)
    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [selectedShopIds, setSelectedShopIds] = useState<string[]>([])
    const ITEMS_PER_PAGE = 50

    const { searchTerm, debouncedSearchTerm, setSearchTerm } =
        useDebouncedSearch('', 300)

    const {
        accessContext,
        isLoading: contextLoading,
        showShopFilter,
        showShopColumn,
        availableShops,
        accessScope,
    } = useAccessContext()

    const { data: vehiclesData, isLoading: vehiclesLoading } = useQuery({
        queryKey: [
            ...vehicleKeys.list({
                search: debouncedSearchTerm,
                shopFilter: selectedShopIds[0],
                page: currentPage,
            }),
            refreshIndex,
        ],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: currentPage.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            })
            if (debouncedSearchTerm.trim()) {
                params.set('search', debouncedSearchTerm.trim())
            }
            if (selectedShopIds.length === 1) {
                params.set('shop_id', selectedShopIds[0])
            }
            const res = await fetch(`/api/vehicles?${params}`)
            if (!res.ok) throw new Error('Failed to fetch vehicles')
            return res.json()
        },
        enabled: !!shopId && !contextLoading,
        staleTime: 30000,
        placeholderData: (prev) => prev,
    })

    const vehicles = useMemo(
        () => vehiclesData?.vehicles || [],
        [vehiclesData]
    )
    const totalCount = useMemo(() => vehiclesData?.total || 0, [vehiclesData])
    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE)

    const { data: vehicleHistory, isLoading: historyLoading, error: historyError } =
        useQuery({
            queryKey: vehicleKeys.history(selectedVehicle?.id ?? ''),
            queryFn: async () => {
                if (!selectedVehicle) return null
                const res = await fetch(
                    `/api/admin/vehicles/${selectedVehicle.id}/history`
                )
                if (!res.ok) throw new Error('Failed to fetch vehicle history')
                return res.json()
            },
            enabled: !!selectedVehicle,
            staleTime: 60000,
            retry: 1,
        })

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            setSearchTerm(e.target.value)
            setCurrentPage(1)
        },
        [setSearchTerm]
    )

    const handleShopFilter = useCallback((shopIds: string[]) => {
        setSelectedShopIds(shopIds)
        setCurrentPage(1)
    }, [])

    const handlePageChange = useCallback((page: number) => {
        setCurrentPage(page)
    }, [])

    const handleRowClick = useCallback((vehicle: VehicleWithContext) => {
        setSelectedVehicle(vehicle)
        setIsSheetOpen(true)
    }, [])

    const handleSheetClose = useCallback(() => {
        setIsSheetOpen(false)
        setSelectedVehicle(null)
    }, [])

    const handleVehicleUpdated = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: vehicleKeys.lists() })
        if (selectedVehicle) {
            queryClient.invalidateQueries({
                queryKey: vehicleKeys.history(selectedVehicle.id),
            })
        }
    }, [queryClient, selectedVehicle])

    const getPageNumbers = () => {
        const pages: number[] = []
        const maxVisible = 5
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i)
        } else {
            const start = Math.max(1, currentPage - 2)
            const end = Math.min(totalPages, start + maxVisible - 1)
            for (let i = start; i <= end; i++) pages.push(i)
        }
        return pages
    }

    const startItem = (currentPage - 1) * ITEMS_PER_PAGE + 1
    const endItem = Math.min(currentPage * ITEMS_PER_PAGE, totalCount)

    if (contextLoading || (vehiclesLoading && !vehiclesData)) {
        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search vehicles..."
                            className="pl-10"
                            disabled
                            value=""
                            readOnly
                        />
                    </div>
                </div>
                <div className="rounded-md border border-border overflow-hidden bg-card">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-b border-border">
                                <TableHead className="text-foreground font-medium">
                                    Year
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Make
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Model
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    VIN
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    License Plate
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Owner
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(8)].map((_, i) => (
                                <TableRow
                                    key={i}
                                    className="border-b border-border"
                                >
                                    <TableCell>
                                        <Skeleton className="h-4 w-12" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-24" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-28" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-20" />
                                    </TableCell>
                                    <TableCell>
                                        <Skeleton className="h-4 w-32" />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={
                            showShopFilter
                                ? 'Search by year, make, model, VIN, or license plate (organization-wide)...'
                                : 'Search by year, make, model, VIN, or license plate...'
                        }
                        value={searchTerm || ''}
                        onChange={handleSearchChange}
                        className="pl-10 bg-background border-border text-foreground"
                    />
                </div>
                {showShopFilter && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="flex items-center gap-2">
                                <Filter className="h-4 w-4" />
                                {selectedShopIds.length === 0
                                    ? 'All Shops'
                                    : selectedShopIds.length === 1
                                    ? availableShops.find(
                                          (s) => s.id === selectedShopIds[0]
                                      )?.shop_name || '1 Shop'
                                    : `${selectedShopIds.length} Shops`}
                                {selectedShopIds.length > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {selectedShopIds.length}
                                    </Badge>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel className="flex items-center justify-between">
                                Filter by Shop
                                {selectedShopIds.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleShopFilter([])}
                                        className="h-auto p-1 text-xs"
                                    >
                                        Clear
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {availableShops.map((shop) => (
                                <DropdownMenuCheckboxItem
                                    key={shop.id}
                                    checked={selectedShopIds.includes(shop.id)}
                                    onCheckedChange={(checked) => {
                                        const newSelected = checked
                                            ? [...selectedShopIds, shop.id]
                                            : selectedShopIds.filter(
                                                  (id) => id !== shop.id
                                              )
                                        handleShopFilter(newSelected)
                                    }}
                                >
                                    {shop.shop_name}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {/* Table */}
            <div className="rounded-md border border-border overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow className="hover:bg-muted/50 border-b border-border">
                                <TableHead className="text-foreground font-medium">
                                    Year
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Make
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Model
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    VIN
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    License Plate
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Color
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Mileage
                                </TableHead>
                                <TableHead className="text-foreground font-medium">
                                    Owner
                                </TableHead>
                                {showShopColumn && (
                                    <TableHead className="text-foreground font-medium">
                                        Shop
                                    </TableHead>
                                )}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {vehicles.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={showShopColumn ? 9 : 8}
                                        className="text-center py-8"
                                    >
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-muted-foreground">
                                                {searchTerm
                                                    ? 'No vehicles found matching your search.'
                                                    : 'No vehicles found.'}
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                vehicles.map((vehicle: VehicleWithContext) => (
                                    <TableRow
                                        key={vehicle.id}
                                        className="hover:bg-muted/50 border-b border-border cursor-pointer"
                                        onClick={() => handleRowClick(vehicle)}
                                    >
                                        <TableCell className="text-foreground">
                                            {vehicle.year ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-foreground">
                                            {vehicle.make ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-foreground">
                                            {vehicle.model ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vehicle.vin ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-foreground">
                                            {vehicle.license_plate ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vehicle.color ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {vehicle.mileage != null
                                                ? vehicle.mileage.toLocaleString()
                                                : '-'}
                                        </TableCell>
                                        <TableCell className="text-foreground font-medium">
                                            <div className="flex items-center gap-2">
                                                {vehicle.customer_name ?? '-'}
                                                {showShopColumn &&
                                                    !vehicle.isFromCurrentShop &&
                                                    vehicle.shopName && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                                                        >
                                                            <Building2 className="h-3 w-3 mr-1" />
                                                            {vehicle.shopName}
                                                        </Badge>
                                                    )}
                                            </div>
                                        </TableCell>
                                        {showShopColumn && (
                                            <TableCell className="text-muted-foreground">
                                                {vehicle.shopName ?? '-'}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between py-4 px-4 bg-muted/30 border-t border-border">
                        <div className="text-sm text-muted-foreground hidden sm:block">
                            Showing {startItem} to {endItem} of {totalCount}{' '}
                            vehicles
                        </div>
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() =>
                                            handlePageChange(
                                                Math.max(1, currentPage - 1)
                                            )
                                        }
                                        className={
                                            currentPage === 1
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                                {getPageNumbers().map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() =>
                                                handlePageChange(page)
                                            }
                                            isActive={currentPage === page}
                                            className="cursor-pointer"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() =>
                                            handlePageChange(
                                                Math.min(
                                                    totalPages,
                                                    currentPage + 1
                                                )
                                            )
                                        }
                                        className={
                                            currentPage === totalPages
                                                ? 'pointer-events-none opacity-50'
                                                : 'cursor-pointer'
                                        }
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </div>

            {selectedVehicle && (
                <VehicleDetailSheet
                    vehicle={selectedVehicle}
                    vehicleHistory={vehicleHistory}
                    isOpen={isSheetOpen}
                    onClose={handleSheetClose}
                    loading={historyLoading}
                    error={historyError?.message ?? null}
                    onVehicleUpdated={handleVehicleUpdated}
                />
            )}
        </div>
    )
}
