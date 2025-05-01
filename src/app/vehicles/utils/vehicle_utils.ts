import { supabase } from "@/lib/supabase";

interface Vehicle {
    id: string;
    year: number;
    make: string;
    model: string;
    color: string;
    engine_type: string;
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

