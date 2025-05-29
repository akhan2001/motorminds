import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const DTC_CODES = [
    'P0420', // Catalyst System Efficiency Below Threshold
    'P0300', // Random/Multiple Cylinder Misfire Detected
    'P0171', // System Too Lean (Bank 1)
    'P0174', // System Too Lean (Bank 2)
    'P0455', // Evaporative Emission Control System Leak Detected (large leak)
];

const getRandomDTCs = () => {
    const numCodes = Math.floor(Math.random() * 3); // 0-2 codes
    const codes = [];
    for (let i = 0; i < numCodes; i++) {
        codes.push(DTC_CODES[Math.floor(Math.random() * DTC_CODES.length)]);
    }
    return [...new Set(codes)]; // Remove duplicates
};

const getStatus = (rpm: number, temp: number, fuel: number, dtcs: string[]) => {
    if (dtcs.length > 1 || temp > 110 || rpm > 4500) return 'critical';
    if (dtcs.length === 1 || temp > 95 || rpm > 4000 || fuel < 15) return 'warning';
    return 'healthy';
};

export async function POST(request: Request) {
    try {
        // Get all vehicles to simulate data for
        const { data: vehicles } = await supabase
            .from('customer_vehicles')
            .select('id')
            .limit(10);

        if (!vehicles || vehicles.length === 0) {
            return NextResponse.json({ error: 'No vehicles found' }, { status: 404 });
        }

        const simulatedData = await Promise.all(
            vehicles.map(async (vehicle) => {
                const rpm = Math.floor(Math.random() * 5000);
                const temp = Math.floor(Math.random() * 120);
                const fuel = Math.floor(Math.random() * 100);
                const dtcs = getRandomDTCs();
                
                const { data, error } = await supabase
                    .from('vehicle_obd_data')
                    .insert({
                        vehicle_id: vehicle.id,
                        rpm,
                        engine_temp: temp,
                        fuel_level: fuel,
                        dtc_codes: dtcs,
                        status: getStatus(rpm, temp, fuel, dtcs)
                    })
                    .select()
                    .single();

                if (error) throw error;
                return data;
            })
        );

        return NextResponse.json({ 
            message: 'Mock OBD data inserted successfully',
            data: simulatedData
        });

    } catch (error) {
        console.error('Error simulating OBD data:', error);
        return NextResponse.json(
            { error: 'Failed to simulate OBD data' },
            { status: 500 }
        );
    }
} 