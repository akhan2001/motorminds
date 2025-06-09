"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import debounce from "lodash.debounce"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Search, Edit, Trash2, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import { VehicleForm } from "./VehicleForm"

interface Vehicle {
    id: string;
    year: number;
    make: string;
    model: string;
    vin: string;
    license_plate: string;
    engine_type: string;
    color: string;
    mileage: number;
    customer_id: string;
}

interface Filters {
    year: string | null;
    make: string | null;
    model: string | null;
}

interface VehicleTableProps {
    shopId: string;
    refreshIndex?: number;
}

export function VehicleTable({ shopId, refreshIndex = 0 }: VehicleTableProps) {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
    const [sortConfig, setSortConfig] = useState<{key: string; direction: 'asc' | 'desc'}>({ 
        key: 'year', 
        direction: 'desc' 
    });
    const [filters, setFilters] = useState<Filters>({
        year: null,
        make: null,
        model: null,
    });
    const [pagination, setPagination] = useState({
        page: 1,
        pageSize: 10,
        total: 0,
    });
    const [filterOptions, setFilterOptions] = useState({
        years: [] as number[],
        makes: [] as string[],
        models: [] as string[],
    });

    // Debounced search function
    const debouncedFetchVehicles = useCallback(
        debounce((searchTerm: string) => {
            fetchVehicles(searchTerm);
        }, 300),
        [shopId, pagination.page]
    );

    // Update search and trigger debounced fetch
    const handleSearch = (value: string) => {
        setSearchQuery(value);
        debouncedFetchVehicles(value);
    };

    // Fetch vehicles with search term parameter
    async function fetchVehicles(searchTerm: string = searchQuery) {
        if (!shopId) {
            setVehicles([]);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            
            // First get all customers belonging to the shop
            const { data: customers, error: customerError } = await supabase
                .from('customers')
                .select('id')
                .eq('shop_id', shopId);

            if (customerError) throw customerError;

            if (!customers?.length) {
                setVehicles([]);
                setIsLoading(false);
                return;
            }

            const customerIds = customers.map(c => c.id);

            // Get all vehicles for these customers
            const { data: vehiclesData, error: vehiclesError } = await supabase
                .from('customer_vehicles')
                .select('*')
                .in('customer_id', customerIds);

            if (vehiclesError) throw vehiclesError;

            setAllVehicles(vehiclesData || []);
            applyFiltersAndSort(vehiclesData || [], searchTerm);

        } catch (error) {
            setVehicles([]);
            setFilterOptions({
                years: [],
                makes: [],
                models: [],
            });
        } finally {
            setIsLoading(false);
        }
    }

    // New function to handle filtering and sorting
    const applyFiltersAndSort = useCallback((data: Vehicle[], searchTerm: string = searchQuery) => {
        // Apply filters and search
        const filteredVehicles = data.filter((vehicle: Vehicle) => {
            if (!vehicle) return false;

            const matchesSearch = !searchTerm || [
                vehicle.make,
                vehicle.model,
                vehicle.vin,
                vehicle.license_plate,
                vehicle.color,
                vehicle.engine_type
            ].some(field => 
                field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
            );

            const matchesYear = !filters.year || vehicle.year?.toString() === filters.year;
            const matchesMake = !filters.make || vehicle.make === filters.make;
            const matchesModel = !filters.model || vehicle.model === filters.model;

            return matchesSearch && matchesYear && matchesMake && matchesModel;
        });

        // Apply sorting
        const sortedVehicles = [...filteredVehicles].sort((a, b) => {
            const aValue = a[sortConfig.key as keyof Vehicle] || '';
            const bValue = b[sortConfig.key as keyof Vehicle] || '';
            const modifier = sortConfig.direction === 'asc' ? 1 : -1;

            if (aValue < bValue) return -1 * modifier;
            if (aValue > bValue) return 1 * modifier;
            return 0;
        });

        // Apply pagination
        const total = sortedVehicles.length;
        const start = (pagination.page - 1) * pagination.pageSize;
        const end = start + pagination.pageSize;
        const paginatedVehicles = sortedVehicles.slice(start, end);

        setVehicles(paginatedVehicles);
        setPagination(prev => ({ ...prev, total }));

        // Update filter options from all vehicles (not just filtered)
        if (data.length > 0) {
            setFilterOptions({
                years: [...new Set(data.map(v => v.year))].filter(Boolean).sort((a, b) => b - a),
                makes: [...new Set(data.map(v => v.make))].filter(Boolean).sort(),
                models: [...new Set(data.map(v => v.model))].filter(Boolean).sort(),
            });
        }
    }, [filters, sortConfig, pagination.pageSize, pagination.page, searchQuery]);

    // Effect for initial fetch
    useEffect(() => {
        if (shopId) {
            fetchVehicles();
        }
        return () => {
            debouncedFetchVehicles.cancel();
        };
    }, [shopId, refreshIndex]);

    // Effect for filter/sort changes
    useEffect(() => {
        if (allVehicles.length > 0) {
            applyFiltersAndSort(allVehicles);
        }
    }, [filters, sortConfig, pagination.page]);

    // Handle sort
    const handleSort = (key: keyof Vehicle) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Render loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Filters Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-2 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                    <Input
                        placeholder="Search vehicles..."
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        className="pl-10 bg-[#131313] border border-[#222] text-white"
                    />
                </div>
                
                {filterOptions.years.length > 0 && (
                    <Select
                        value={filters.year || "all"}
                        onValueChange={(value) => setFilters(prev => ({ 
                            ...prev, 
                            year: value === "all" ? null : value 
                        }))}
                    >
                        <SelectTrigger className="bg-[#131313] border-[#222]">
                            <SelectValue placeholder="Filter by Year" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a1a1a] border-[#333]">
                            <SelectItem value="all" className="text-white">All Years</SelectItem>
                            {filterOptions.years.map(year => (
                                <SelectItem key={year} value={year.toString()} className="text-white">
                                    {year}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                <Select
                    value={filters.make || "all"}
                    onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        make: value === "all" ? null : value,
                        // Reset model when make changes
                        model: null 
                    }))}
                >
                    <SelectTrigger className="bg-[#131313] border-[#222] text-white">
                        <SelectValue placeholder="Filter by Make" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        <SelectItem value="all" className="text-white">All Makes</SelectItem>
                        {filterOptions.makes.map(make => (
                            <SelectItem key={make} value={make} className="text-white">
                                {make}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.model || "all"}
                    onValueChange={(value) => setFilters(prev => ({ 
                        ...prev, 
                        model: value === "all" ? null : value 
                    }))}
                    disabled={!filters.make}
                >
                    <SelectTrigger className="bg-[#131313] border-[#222] text-white">
                        <SelectValue placeholder="Filter by Model" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1a] border-[#333]">
                        <SelectItem value="all" className="text-white">All Models</SelectItem>
                        {filterOptions.models
                            .filter(model => !filters.make || vehicles.some(v => v.make === filters.make && v.model === model))
                            .map(model => (
                                <SelectItem key={model} value={model} className="text-white">
                                    {model}
                                </SelectItem>
                            ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Table Section */}
            <div className="rounded-md border border-[#222]">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#222] hover:bg-[#1a1a1a]">
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('year')}
                            >
                                Year {sortConfig.key === 'year' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('make')}
                            >
                                Make {sortConfig.key === 'make' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('model')}
                            >
                                Model {sortConfig.key === 'model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('vin')}
                            >
                                VIN {sortConfig.key === 'vin' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('license_plate')}
                            >
                                License Plate {sortConfig.key === 'license_plate' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('color')}
                            >
                                Color {sortConfig.key === 'color' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('mileage')}
                            >
                                Mileage {sortConfig.key === 'mileage' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                            <TableHead 
                                className="text-gray-400 cursor-pointer"
                                onClick={() => handleSort('engine_type')}
                            >
                                Engine {sortConfig.key === 'engine_type' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vehicles.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8">
                                    <p className="text-gray-400">
                                        {searchQuery || Object.values(filters).some(Boolean)
                                            ? "No vehicles found matching your filters"
                                            : "No vehicles found"}
                                    </p>
                                </TableCell>
                            </TableRow>
                        ) : (
                            vehicles.map((vehicle) => (
                                <TableRow key={vehicle.id} className="border-[#222] hover:bg-[#1a1a1a]">
                                    <TableCell>{vehicle.year}</TableCell>
                                    <TableCell>{vehicle.make}</TableCell>
                                    <TableCell>{vehicle.model}</TableCell>
                                    <TableCell>{vehicle.vin}</TableCell>
                                    <TableCell>{vehicle.license_plate}</TableCell>
                                    <TableCell>{vehicle.color}</TableCell>
                                    <TableCell>{vehicle.mileage}</TableCell>
                                    <TableCell>{vehicle.engine_type}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination Section */}
            {!isLoading && vehicles.length > 0 && (
                <div className="flex items-center justify-between py-4">
                    <p className="text-sm text-gray-400">
                        Showing {pagination.page * pagination.pageSize - pagination.pageSize + 1} to {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} vehicles
                    </p>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                            disabled={pagination.page === 1 || isLoading}
                            className="border-[#333] hover:bg-[#222] hover:text-white"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-gray-400">
                            Page {pagination.page} of {Math.ceil(pagination.total / pagination.pageSize)}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                            disabled={pagination.page === Math.ceil(pagination.total / pagination.pageSize) || isLoading}
                            className="border-[#333] hover:bg-[#222] hover:text-white"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}