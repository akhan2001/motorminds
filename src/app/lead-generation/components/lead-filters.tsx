import { Card, CardContent } from "@/components/ui/card"; 
import { UsersRound, Flame, Clock, Check } from 'lucide-react';

export function LeadFilter() {
    return (
        <section className="mb-10 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 mb-3">
                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Total Leads</h3>
                            <UsersRound className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">247</p>
                        <p className="text-sm text-gray-400">+12.5% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Hot Leads</h3>
                            <Flame className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">64</p>
                        <p className="text-sm text-gray-400">+5% from last month</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Pending Follow Ups</h3>
                            <Clock className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">28</p>
                        <p className="text-sm text-gray-400">Due in 3 days</p>
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Converted Leads</h3>
                            <Check className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">12</p>
                        <p className="text-sm text-gray-400">+10% from last month</p>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
