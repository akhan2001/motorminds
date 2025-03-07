import { Card, CardContent } from "@/components/ui/card"; 
import { UsersRound, Flame, Clock, Check } from 'lucide-react';
import { getTotalLeads, getHotLeads, getPendingFollowUps, getConvertedLeads } from "../utils/lead";
import { useState, useEffect } from "react";

export function LeadFilter() {
    const [totalLeads, setTotalLeads] = useState(0);
    const [hotLeads, setHotLeads] = useState(0);
    const [pendingFollowUps, setPendingFollowUps] = useState(0);
    const [convertedLeads, setConvertedLeads] = useState(0);

    useEffect(() => {
        const fetchTotalLeads = async () => {
            const data = await getTotalLeads();
            setTotalLeads(data.length);
        }
        fetchTotalLeads();

        const fetchHotLeads = async () => {
            const data = await getHotLeads();
            setHotLeads(data);
        }
        fetchHotLeads();

        const fetchPendingFollowUps = async () => {
            const data = await getPendingFollowUps();
            setPendingFollowUps(data);
        }
        fetchPendingFollowUps();

        const fetchConvertedLeads = async () => {
            const data = await getConvertedLeads();
            setConvertedLeads(data);
        }
        fetchConvertedLeads();
    }, []);

    return (
        <section className="mb-10 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 mb-3">
                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Total Leads</h3>
                            <UsersRound className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{totalLeads}</p>
                        {/* <p className="text-sm text-gray-400">+12.5% from last month</p> */}
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Hot Leads</h3>
                            <Flame className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{hotLeads}</p>
                        {/* <p className="text-sm text-gray-400">+5% from last month</p> */}
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Pending Follow Ups</h3>
                            <Clock className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{pendingFollowUps}</p>
                        {/* <p className="text-sm text-gray-400">Due in 3 days</p> */}
                    </CardContent>
                </Card>

                <Card className="bg-[#111] border-[#222]">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Converted Leads</h3>
                            <Check className="text-gray-400 w-5 h-5" />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{convertedLeads}</p>
                        {/* <p className="text-sm text-gray-400">+10% from last month</p> */}
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
