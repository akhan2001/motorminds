"use client"

import { useState, useEffect } from "react"
import { VehicleSearch } from "./vehicle-search"
import { 
    searchVehicles, 
    getVehicleYears, 
    getVehicleMakes, 
    getVehicleModels,
    type Vehicle 
} from "@/app/vehicles/utils/vehicle_utils"
import { supabase } from "@/lib/supabase"

interface VehicleSearchContainerProps {
    onVehicleSelect?: (vehicle: Vehicle) => void
}

export function VehicleSearchContainer({ onVehicleSelect }: VehicleSearchContainerProps) {
    const [isSearching, setIsSearching] = useState(false)
    const [searchResults, setSearchResults] = useState<Vehicle[]>([])
    const [years, setYears] = useState<string[]>([])
    const [makes, setMakes] = useState<string[]>([])
    const [models, setModels] = useState<string[]>([])
    const [shopId, setShopId] = useState<string>("")
    const [selectedYear, setSelectedYear] = useState<string>("any")

    // Fetch shop_id on mount
    useEffect(() => {
        async function fetchShopId() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: userData, error: userError } = await supabase
                .from("users")
                .select("shop_id")
                .eq("id", user.id)
                .single();

            if (userError || !userData?.shop_id) {
                console.error("Error fetching shop_id", userError);
                return;
            }

            setShopId(userData.shop_id);
            
            // Once we have the shop_id, fetch the years
            const yearsData = await getVehicleYears(userData.shop_id);
            setYears(yearsData);
        }
        fetchShopId();
    }, []);

    // Fetch makes when year changes
    const handleYearChange = async (year: string) => {
        setSelectedYear(year);
        if (!shopId) return;

        const makesData = await getVehicleMakes(
            shopId,
            year === "any" ? undefined : year
        );
        setMakes(makesData);
        setModels([]); // Reset models when year changes
    };

    // Fetch models when make changes
    const handleMakeChange = async (make: string) => {
        if (!shopId) return;

        const modelsData = await getVehicleModels(
            shopId,
            make === "any" ? undefined : make,
            selectedYear === "any" ? undefined : selectedYear
        );
        setModels(modelsData);
    };

    const handleSearch = async (searchData: {
        searchQuery: string
        year: string
        make: string
        model: string
        licensePlate: string
    }) => {
        if (!shopId) return;

        setIsSearching(true);
        try {
            const { data, error } = await searchVehicles({
                searchQuery: searchData.searchQuery,
                year: searchData.year === "any" ? undefined : searchData.year,
                make: searchData.make === "any" ? undefined : searchData.make,
                model: searchData.model === "any" ? undefined : searchData.model,
                licensePlate: searchData.licensePlate,
                shop_id: shopId
            });

            if (error) throw error;
            setSearchResults(data || []);
        } catch (error) {
            console.error('Error searching vehicles:', error);
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <VehicleSearch
            onSearch={handleSearch}
            onVehicleSelect={onVehicleSelect}
            onYearChange={handleYearChange}
            onMakeChange={handleMakeChange}
            isSearching={isSearching}
            searchResults={searchResults}
            years={years}
            makes={makes}
            models={models}
        />
    );
} 