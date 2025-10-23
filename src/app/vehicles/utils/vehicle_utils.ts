import { supabase } from "@/lib/supabase";

export interface Vehicle {
    id: string;
    customer_id?: string;
    year?: string;
    make?: string;
    model?: string;
    vin?: string;
    license_plate?: string;
    engine_type?: string;
    color?: string;
    mileage?: string;
    created_at?: string;
    customer?: {
        id: string;
        name: string;
        phone: string;
        email?: string;
        address?: string;
    }
}

export interface VehicleSearchParams {
    searchQuery?: string;  // For VIN or license plate search
    year?: string;
    make?: string;
    model?: string;
    licensePlate?: string;
    shop_id?: string;
}

export async function getVehicleInfoById(id: string): Promise<Vehicle | null> {
    const { data, error } = await supabase
        .from('customer_vehicles')
        .select(`
            id,
            year,
            make,
            model,
            color,
            engine_type
        `)
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching vehicle info:', error);
        return null;
    }

    return data;
}

export async function searchVehicles(params: VehicleSearchParams): Promise<{ data: Vehicle[] | null; error: any }> {
    try {
        // Search both customer_vehicles and staging_vehicles
        let query = supabase
            .from('customer_vehicles')
            .select(`
                *,
                customers!inner (
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_address,
                    shop_id
                )
            `)
            .eq('customers.shop_id', params.shop_id);
        
        let stagingQuery = supabase
            .from('staging_vehicles')
            .select(`
                *,
                staging_customers!inner (
                    id,
                    customer_name,
                    customer_phone,
                    customer_email,
                    customer_address,
                    shop_id
                )
            `)
            .eq('staging_customers.shop_id', params.shop_id);

        // Add filters based on search criteria
        if (params.searchQuery) {
            // Search in both VIN and license plate fields
            query = query.or(`vin.ilike.%${params.searchQuery}%,license_plate.ilike.%${params.searchQuery}%`)
            stagingQuery = stagingQuery.or(`vin.ilike.%${params.searchQuery}%,license_plate.ilike.%${params.searchQuery}%`)
        }
        if (params.year) {
            query = query.eq('year', params.year)
            stagingQuery = stagingQuery.eq('year', params.year)
        }
        if (params.make) {
            query = query.ilike('make', `%${params.make}%`)
            stagingQuery = stagingQuery.ilike('make', `%${params.make}%`)
        }
        if (params.model) {
            query = query.ilike('model', `%${params.model}%`)
            stagingQuery = stagingQuery.ilike('model', `%${params.model}%`)
        }
        if (params.licensePlate) {
            query = query.ilike('license_plate', `%${params.licensePlate}%`)
            stagingQuery = stagingQuery.ilike('license_plate', `%${params.licensePlate}%`)
        }

        // Execute both queries in parallel
        const [regularResult, stagingResult] = await Promise.all([
            query,
            stagingQuery
        ])

        const { data, error } = regularResult
        const { data: stagingData, error: stagingError } = stagingResult

        if (error) {
            throw error
        }

        if (stagingError) {
            console.error('Staging vehicle search error:', stagingError)
            // Continue with regular vehicles only if staging search fails
        }

        // Transform regular vehicles
        const transformedData = data?.map(vehicle => ({
            id: vehicle.id,
            customer_id: vehicle.customer_id,
            year: vehicle.year?.toString(),
            make: vehicle.make,
            model: vehicle.model,
            vin: vehicle.vin,
            license_plate: vehicle.license_plate,
            engine_type: vehicle.engine_type,
            color: vehicle.color,
            mileage: vehicle.mileage?.toString(),
            created_at: vehicle.created_at,
            customer: vehicle.customers ? {
                id: vehicle.customers.id,
                name: vehicle.customers.customer_name,
                phone: vehicle.customers.customer_phone,
                email: vehicle.customers.customer_email,
                address: vehicle.customers.customer_address,
            } : undefined
        })) || []

        // Transform staging vehicles
        const transformedStagingData = stagingData?.map(vehicle => ({
            id: vehicle.id,
            customer_id: vehicle.customer_id,
            year: vehicle.year?.toString(),
            make: vehicle.make,
            model: vehicle.model,
            vin: vehicle.vin,
            license_plate: vehicle.license_plate,
            engine_type: vehicle.engine_type,
            color: vehicle.color,
            mileage: vehicle.mileage?.toString(),
            created_at: vehicle.created_at,
            customer: vehicle.staging_customers ? {
                id: vehicle.staging_customers.id,
                name: vehicle.staging_customers.customer_name,
                phone: vehicle.staging_customers.customer_phone,
                email: vehicle.staging_customers.customer_email,
                address: vehicle.staging_customers.customer_address,
            } : undefined
        })) || []

        // Combine both results
        const allVehicles = [...transformedData, ...transformedStagingData]

        return { data: allVehicles.length > 0 ? allVehicles : null, error: null }
    } catch (error) {
        console.error('Error searching vehicles:', error)
        return { data: null, error }
    }
}

export async function getVehicleYears(shop_id: string): Promise<string[]> {
    try {
        const { data, error } = await supabase
            .from('customer_vehicles')
            .select('year, customers!inner(shop_id)')
            .eq('customers.shop_id', shop_id)
            .order('year', { ascending: false });

        if (error) throw error;

        // Get unique years and filter out null values
        const years = [...new Set(data.map(item => item.year))]
            .filter(year => year !== null)
            .map(year => year.toString());

        return years;
    } catch (error) {
        console.error('Error fetching vehicle years:', error);
        return [];
    }
}

export async function getVehicleMakes(shop_id: string, year?: string): Promise<string[]> {
    try {
        let query = supabase
            .from('customer_vehicles')
            .select('make, customers!inner(shop_id)')
            .eq('customers.shop_id', shop_id);

        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get unique makes and filter out null/empty values
        const makes = [...new Set(data.map(item => item.make))]
            .filter(make => make)
            .sort();

        return makes;
    } catch (error) {
        console.error('Error fetching vehicle makes:', error);
        return [];
    }
}

export async function getVehicleModels(shop_id: string, make?: string, year?: string): Promise<string[]> {
    try {
        let query = supabase
            .from('customer_vehicles')
            .select('model, customers!inner(shop_id)')
            .eq('customers.shop_id', shop_id);

        if (make) {
            query = query.eq('make', make);
        }
        if (year) {
            query = query.eq('year', year);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Get unique models and filter out null/empty values
        const models = [...new Set(data.map(item => item.model))]
            .filter(model => model)
            .sort();

        return models;
    } catch (error) {
        console.error('Error fetching vehicle models:', error);
        return [];
    }
}

