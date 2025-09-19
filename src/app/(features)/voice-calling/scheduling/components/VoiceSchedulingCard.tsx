import { PhoneCall } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


export default function VoiceSchedulingCard() {
    return (
        <>
        {/* Future: Voice Scheduling */}
        <Card className="bg-[#111111] border-[#2a2a2a] opacity-50">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 rounded-lg">
                        <PhoneCall className="h-6 w-6 text-blue-400" />
                    </div>
                    Voice Scheduling
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                        Coming Soon
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-gray-400">
                    AI agent for appointment scheduling, customer follow-ups, 
                    and service reminders via automated phone calls.
                </p>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Appointment scheduling
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Service reminders
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-300">
                        <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                        Customer follow-ups
                    </div>
                </div>

                <Button disabled className="w-full bg-gray-600 text-gray-400 cursor-not-allowed">
                    Coming Soon
                </Button>
            </CardContent>
        </Card>
        </>
    )
}
