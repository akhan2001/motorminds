/**
 * Formats operating hours from a JSON string into a human-readable format
 * 
 * @param hoursString - JSON string containing operating hours data
 * @returns An object with formatted operating hours for display
 */
export function formatOperatingHours(hoursString: string): { 
    [key: string]: string 
} {
    try {
        // Parse the JSON string
        const hours = JSON.parse(hoursString);
        
        // Initialize the result object
        const formattedHours: { [key: string]: string } = {};
        
        // Group consecutive days with the same hours
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        let currentGroup: string[] = [];
        let currentSchedule: { closed: boolean; openTime: string; closeTime: string } | null = null;
        
        // Process each day
        for (let i = 0; i < daysOfWeek.length; i++) {
            const day = daysOfWeek[i];
            const schedule = hours[day];
            
            if (!schedule) continue;
            
            // If this is the first day or the schedule is different from the current group
            if (
            !currentSchedule || 
            currentSchedule.closed !== schedule.closed || 
            currentSchedule.openTime !== schedule.openTime || 
            currentSchedule.closeTime !== schedule.closeTime
            ) {
            // If we have a current group, add it to the result
            if (currentGroup.length > 0) {
                const key = currentGroup.length === 1 
                ? currentGroup[0] 
                : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
                
                formattedHours[key] = currentSchedule!.closed 
                ? 'Closed' 
                : `${currentSchedule!.openTime} - ${currentSchedule!.closeTime}`;
            }
            
            // Start a new group
            currentGroup = [day];
            currentSchedule = schedule;
            } else {
            // Add to the current group
            currentGroup.push(day);
            }
        }
        
        // Add the last group
        if (currentGroup.length > 0) {
            const key = currentGroup.length === 1 
            ? currentGroup[0] 
            : `${currentGroup[0]}-${currentGroup[currentGroup.length - 1]}`;
            
            formattedHours[key] = currentSchedule!.closed 
            ? 'Closed' 
            : `${currentSchedule!.openTime} - ${currentSchedule!.closeTime}`;
        }
        
        return formattedHours;
    } catch (e) {
        console.error("Error parsing operating hours:", e);
        return {
            "Monday-Friday": "9:00 - 17:00",
            "Saturday-Sunday": "Closed"
        };
    }
}