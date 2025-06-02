"use client"

import { useState } from "react"
import { SearchIcon } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface Vehicle {
    id: string
    year?: string
    make?: string
    model?: string
    vin?: string
    color?: string
    licensePlate?: string
    mileage?: string
    customer?: {
        id: string
        name: string
        phone: string
        email?: string
        address?: string
    }
}

interface VehicleSearchProps {
    onSearch: (searchData: {
        searchQuery: string
        year: string
        make: string
        model: string
        licensePlate: string
    }) => void
    onVehicleSelect?: (vehicle: Vehicle) => void
    onMakeChange: (make: string) => void
    onYearChange: (year: string) => void
    isSearching?: boolean
    searchResults?: Vehicle[]
    years: string[]
    makes: string[]
    models: string[]
}

export function VehicleSearch({ 
    onSearch,
    onVehicleSelect,
    onMakeChange,
    onYearChange,
    isSearching = false,
    searchResults = [],
    years = [],
    makes = [],
    models = []
}: VehicleSearchProps) {
    // Local state for search form
    const [searchData, setSearchData] = useState({
        searchQuery: "",
        year: "any",
        make: "any",
        model: "any",
        licensePlate: "",
    })

    // Add selected vehicle state
    const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

    // Handle search
    const handleSearch = () => {
        onSearch({
            ...searchData,
            // Convert "any" to empty string for the backend
            year: searchData.year === "any" ? "" : searchData.year,
            make: searchData.make === "any" ? "" : searchData.make,
            model: searchData.model === "any" ? "" : searchData.model,
        })
    }

    // Handle vehicle selection
    const handleVehicleSelect = (vehicle: Vehicle) => {
        setSelectedVehicleId(vehicle.id)
        onVehicleSelect?.(vehicle)
    }

    return (
        <div className="space-y-4">
            {/* Vehicle Search Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Search Vehicle</h3>
                <div className="bg-[#1A1A1A] rounded-xl p-6">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <Input
                                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 flex-1"
                                placeholder="Enter VIN, License Plate, or Vehicle Details"
                                value={searchData.searchQuery}
                                onChange={(e) =>
                                    setSearchData(prev => ({ 
                                        ...prev, 
                                        searchQuery: e.target.value.toUpperCase() 
                                    }))
                                }
                            />
                            <Button
                                type="button"
                                variant="outline"
                                className="bg-[#292929] text-white border-[#626262] hover:bg-[#626262] hover:text-white"
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                <SearchIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Year</Label>
                                <Select
                                    value={searchData.year}
                                    onValueChange={(value) => {
                                        setSearchData(prev => ({ 
                                            ...prev, 
                                            year: value,
                                            make: "any", // Reset make when year changes
                                            model: "any"  // Reset model when year changes
                                        }));
                                        onYearChange(value);
                                    }}
                                >
                                    <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500">
                                        <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                        <SelectItem value="any">Any Year</SelectItem>
                                        {years.map((year) => (
                                            <SelectItem key={year} value={year}>
                                                {year}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Make</Label>
                                <Select
                                    value={searchData.make}
                                    onValueChange={(value) => {
                                        setSearchData(prev => ({ 
                                            ...prev, 
                                            make: value,
                                            model: "any" // Reset model when make changes
                                        }));
                                        onMakeChange(value === "any" ? "" : value);
                                    }}
                                >
                                    <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500">
                                        <SelectValue placeholder="Select Make" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                        <SelectItem value="any">Any Make</SelectItem>
                                        {makes.map((make) => (
                                            <SelectItem key={make} value={make}>
                                                {make}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-400">Model</Label>
                                <Select
                                    value={searchData.model}
                                    onValueChange={(value) =>
                                        setSearchData(prev => ({ ...prev, model: value }))
                                    }
                                    disabled={searchData.make === "any"} // Disable if no make is selected
                                >
                                    <SelectTrigger className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500">
                                        <SelectValue placeholder="Select Model" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                        <SelectItem value="any">Any Model</SelectItem>
                                        {models.map((model) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1.5">
                                <Label className="text-gray-400">License Plate</Label>
                                <Input
                                    value={searchData.licensePlate}
                                    onChange={(e) =>
                                        setSearchData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))
                                    }
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500"
                                    placeholder="e.g. ABC123"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Results */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-white">Search Results</h3>
                <div className="bg-[#1A1A1A] rounded-xl p-6">
                    {isSearching ? (
                        <div className="text-center text-gray-400 py-8">
                            Searching...
                        </div>
                    ) : searchResults.length > 0 ? (
                        <div className={cn(
                            "space-y-4",
                            searchResults.length > 5 && "max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#626262] scrollbar-track-[#292929]"
                        )}>
                            {searchResults.map((result) => (
                                <div
                                    key={result.id}
                                    className={cn(
                                        "flex items-center justify-between p-4 border rounded-lg cursor-pointer transition-all duration-200",
                                        selectedVehicleId === result.id
                                            ? "border-[#22C55E] bg-[#22C55E]/10 hover:bg-[#22C55E]/20"
                                            : "border-[#626262] hover:bg-[#292929]"
                                    )}
                                    onClick={() => handleVehicleSelect(result)}
                                >
                                    <div className="space-y-1">
                                        <div className="text-white font-medium">
                                            {result.year} {result.make} {result.model}
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            VIN: {result.vin || 'N/A'} • License: {result.licensePlate || 'N/A'}
                                        </div>
                                        {result.customer && (
                                            <div className="text-sm text-gray-400">
                                                Owner: {result.customer.name}
                                            </div>
                                        )}
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "ml-4",
                                            selectedVehicleId === result.id
                                                ? "border-[#22C55E] text-[#22C55E] hover:bg-[#22C55E]/20"
                                                : "border-[#626262] text-white hover:bg-[#626262]"
                                        )}
                                    >
                                        Select
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-400 py-8">
                            {searchData.searchQuery || searchData.year || searchData.make || searchData.model || searchData.licensePlate
                                ? 'No vehicles found matching your search criteria'
                                : 'Enter vehicle details above to search for matching vehicles and their owners'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
} 