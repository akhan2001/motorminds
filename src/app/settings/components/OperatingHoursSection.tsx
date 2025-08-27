import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UseFormReturn } from "react-hook-form"

interface DaySchedule {
    closed: boolean;
    openTime: string;
    closeTime: string;
}

type WeekSchedule = {
    Monday: DaySchedule;
    Tuesday: DaySchedule;
    Wednesday: DaySchedule;
    Thursday: DaySchedule;
    Friday: DaySchedule;
    Saturday: DaySchedule;
    Sunday: DaySchedule;
}

interface OperatingHoursSectionProps {
    form: UseFormReturn<any>
    operatingHours: WeekSchedule
    updateDaySchedule: (day: keyof WeekSchedule, field: keyof DaySchedule, value: any) => void
    times: string[]
}

export function OperatingHoursSection({ 
    form, 
    operatingHours, 
    updateDaySchedule, 
    times 
}: OperatingHoursSectionProps) {
    return (
        <FormField
            control={form.control}
            name="operating_hours"
            render={({ field }) => (
                <FormItem className="col-span-2">
                    <FormLabel>Operating Hours</FormLabel>
                    <FormDescription>
                        Set your shop's operating hours for each day of the week.
                    </FormDescription>
                    
                    <div className="space-y-4 mt-2">
                        {(Object.keys(operatingHours) as Array<keyof WeekSchedule>).map((day) => (
                            <div key={day} className="grid grid-cols-12 gap-3 items-center">
                                <div className="col-span-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={`${day}-closed`}
                                            checked={operatingHours[day].closed}
                                            onCheckedChange={(checked) => 
                                                updateDaySchedule(day, 'closed', checked === true)
                                            }
                                            className="bg-[#292929] border-[#626262]"
                                        />
                                        <label 
                                            htmlFor={`${day}-closed`}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                        >
                                            {day}
                                        </label>
                                    </div>
                                </div>
                                
                                {!operatingHours[day].closed ? (
                                    <>
                                        <div className="col-span-4">
                                            <div className="flex items-center">
                                                <span className="text-xs mr-2">Opens at</span>
                                                <Select
                                                    value={operatingHours[day].openTime}
                                                    onValueChange={(value) => updateDaySchedule(day, 'openTime', value)}
                                                >
                                                    <SelectTrigger className="bg-[#292929] border-[#626262] text-white">
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#292929] border-[#626262] text-white max-h-[300px]">
                                                        {times.map((time) => (
                                                            <SelectItem key={`${day}-open-${time}`} value={time}>
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        <div className="col-span-4">
                                            <div className="flex items-center">
                                                <span className="text-xs mr-2">Closes at</span>
                                                <Select
                                                    value={operatingHours[day].closeTime}
                                                    onValueChange={(value) => updateDaySchedule(day, 'closeTime', value)}
                                                >
                                                    <SelectTrigger className="bg-[#292929] border-[#626262] text-white">
                                                        <SelectValue placeholder="Select time" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#292929] border-[#626262] text-white max-h-[300px]">
                                                        {times.map((time) => (
                                                            <SelectItem key={`${day}-close-${time}`} value={time}>
                                                                {time}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="col-span-8 text-gray-500 italic">
                                        Closed
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                    
                    <FormMessage />
                </FormItem>
            )}
        />
    )
} 