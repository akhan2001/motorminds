"use client"

import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface FilterOptions {
    years: number[];
    makes: string[];
    models: string[];
}

interface Filters {
    year: string | null;
    make: string | null;
    model: string | null;
}

interface VehicleFiltersProps {
    filters: Filters;
    filterOptions: FilterOptions;
    searchQuery: string;
    onSearchChange: (value: string) => void;
    onFilterChange: (filters: Filters) => void;
    vehicles: any[];
}

export function VehicleFilters({
    filters,
    filterOptions,
    searchQuery,
    onSearchChange,
    onFilterChange,
    vehicles
}: VehicleFiltersProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <Input
                    placeholder="Search vehicles..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 bg-[#131313] border border-[#222] text-white"
                />
            </div>
            
            {filterOptions.years.length > 0 && (
                <Select
                    value={filters.year || "all"}
                    onValueChange={(value) => onFilterChange({ 
                        ...filters, 
                        year: value === "all" ? null : value 
                    })}
                >
                    <SelectTrigger className="bg-[#131313] border-[#222] text-white">
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
                onValueChange={(value) => onFilterChange({ 
                    ...filters, 
                    make: value === "all" ? null : value,
                    model: null 
                })}
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
                onValueChange={(value) => onFilterChange({ 
                    ...filters, 
                    model: value === "all" ? null : value 
                })}
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
    )
} 