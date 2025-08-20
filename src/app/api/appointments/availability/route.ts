import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getShopIdForUser } from "@/utils/get-shop-id";

export async function GET(request: NextRequest) {
    try {
        const shopId = await getShopIdForUser();
        if (!shopId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');
        const service_type = searchParams.get('service_type');

        if (!date) {
            return NextResponse.json({ error: 'Date is required' }, { status: 400 });
        }

        const supabase = await createClient();

        // Get shop operating hours
        const { data: shop, error: shopError } = await supabase
            .from('shops')
            .select('operating_hours')
            .eq('id', shopId)
            .single();

        if (shopError) {
            return NextResponse.json({ error: shopError.message }, { status: 500 });
        }

        // Get existing appointments for the date
        const { data: appointments, error: appointmentsError } = await supabase
            .from('appointments')
            .select('start_time, end_time, service_type')
            .eq('shop_id', shopId)
            .eq('appointment_date', date)
            .neq('status', 'cancelled');

        if (appointmentsError) {
            return NextResponse.json({ error: appointmentsError.message }, { status: 500 });
        }

        // Calculate available time slots
        const availableSlots = calculateAvailableSlots(
            shop?.operating_hours,
            appointments || [],
            date,
            service_type
        );

        return NextResponse.json({ availableSlots, date });

    } catch (error) {
        console.error('Availability API error:', error);
        return NextResponse.json({ 
            error: 'Internal server error',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function calculateAvailableSlots(
    operatingHours: any,
    existingAppointments: any[],
    date: string,
    serviceType: string | null
) {
    try {
        // Parse operating hours if it's a string
        let parsedHours = operatingHours;
        if (typeof operatingHours === 'string') {
            try {
                parsedHours = JSON.parse(operatingHours);
            } catch (error) {
                console.error('Error parsing operating hours JSON:', error);
                return [];
            }
        }

        // Check if operating hours exist
        if (!parsedHours || typeof parsedHours !== 'object') {
            console.log('No operating hours configured for shop');
            return [];
        }

        // Get day of week (capitalize first letter to match the format)
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
        const daySchedule = parsedHours[dayOfWeek];

        if (!daySchedule) {
            console.log('No schedule found for', dayOfWeek);
            return [];
        }

        // Check if the shop is closed on this day
        if (daySchedule.closed === true) {
            return [];
        }

        // Get open and close times (format: "9:00", "17:00")
        const openTimeStr = daySchedule.openTime;
        const closeTimeStr = daySchedule.closeTime;

        if (!openTimeStr || !closeTimeStr) {
            console.error('Missing open/close times for', dayOfWeek, daySchedule);
            return [];
        }

        // Convert to minutes for easier calculation
        const openHour = parseTime24Hour(openTimeStr);
        const closeHour = parseTime24Hour(closeTimeStr);

        if (isNaN(openHour) || isNaN(closeHour)) {
            console.error('Invalid time parsing:', { openTimeStr, closeTimeStr });
            return [];
        }

        // Generate 30-minute slots
        const slots = [];
        let currentTime = openHour;

        while (currentTime < closeHour) {
            const slotStart = formatTime(currentTime);
            const slotEnd = formatTime(currentTime + 30);

            // Check if slot conflicts with existing appointments
            const hasConflict = existingAppointments.some(apt => {
                try {
                    const aptStart = parseTimeString(apt.start_time);
                    const aptEnd = parseTimeString(apt.end_time);
                    return (currentTime >= aptStart && currentTime < aptEnd) ||
                           (currentTime + 30 > aptStart && currentTime + 30 <= aptEnd);
                } catch (error) {
                    console.error('Error parsing appointment time:', apt, error);
                    return false; // If we can't parse, assume no conflict
                }
            });

            if (!hasConflict) {
                slots.push({
                    start_time: slotStart,
                    end_time: slotEnd,
                    available: true
                });
            }

            currentTime += 30; // 30-minute increments
        }

        return slots;
    } catch (error) {
        console.error('Error calculating available slots:', error);
        return [];
    }
}

function parseTime(timeStr: string): number {
    try {
        if (!timeStr || typeof timeStr !== 'string') {
            throw new Error('Invalid time string');
        }
        
        const [time, period] = timeStr.trim().split(' ');
        if (!time || !period) {
            throw new Error('Missing time or period');
        }
        
        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error('Invalid hours or minutes');
        }
        
        let totalMinutes = hours * 60 + minutes;
        
        if (period.toUpperCase() === 'PM' && hours !== 12) {
            totalMinutes += 12 * 60;
        } else if (period.toUpperCase() === 'AM' && hours === 12) {
            totalMinutes -= 12 * 60;
        }
        
        return totalMinutes;
    } catch (error) {
        console.error('Error parsing time:', timeStr, error);
        return NaN;
    }
}

function parseTimeString(timeStr: string): number {
    try {
        if (!timeStr || typeof timeStr !== 'string') {
            throw new Error('Invalid time string');
        }
        
        const [hours, minutes] = timeStr.trim().split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error('Invalid hours or minutes');
        }
        
        return hours * 60 + minutes;
    } catch (error) {
        console.error('Error parsing time string:', timeStr, error);
        return NaN;
    }
}

function parseTime24Hour(timeStr: string): number {
    try {
        if (!timeStr || typeof timeStr !== 'string') {
            throw new Error('Invalid time string');
        }
        
        // Handle both "9:00" and "09:00" formats
        const [hours, minutes = 0] = timeStr.trim().split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
            throw new Error('Invalid hours or minutes');
        }
        
        // Validate time ranges
        if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
            throw new Error('Time out of valid range');
        }
        
        return hours * 60 + minutes;
    } catch (error) {
        console.error('Error parsing 24-hour time:', timeStr, error);
        return NaN;
    }
}

function formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
