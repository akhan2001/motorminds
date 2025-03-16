import { Card, CardContent } from "@/components/ui/card"; 
import { UsersRound, Flame, Gift, Check } from 'lucide-react';
import { getTotalLeads, getNewLeads, getPendingFollowUps, getConvertedLeads, getLeads } from "../utils/lead";
import { useState, useEffect } from "react";

type FilterType = 'ALL' | 'NEW' | 'REWARD' | 'CUSTOMER';

export function LeadFilter({ shopId, user, onFilterChange }: { 
    shopId: string, 
    user: any,
    onFilterChange: (filter: FilterType) => void 
}) {
    const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
    const [totalLeads, setTotalLeads] = useState(0);
    const [newLeads, setNewLeads] = useState(0);
    const [rewardLeads, setRewardLeads] = useState(0);
    const [convertedLeads, setConvertedLeads] = useState(0);

    useEffect(() => {
        const fetchTotalLeads = async () => {
            const data = await getTotalLeads(shopId);
            setTotalLeads(data.length);
        }
        fetchTotalLeads();

        const fetchNewLeads = async () => {
            const data = await getNewLeads(shopId);
            setNewLeads(data);
        }
        fetchNewLeads();

        const fetchRewardLeads = async () => {
            const data = await getLeads(shopId);
            console.log("All leads:", data);
            const rewardLeads = data.filter((lead: any) => lead.rewards_claim);
            console.log("Reward leads:", rewardLeads);
            setRewardLeads(rewardLeads.length);
        }
        fetchRewardLeads();

        const fetchConvertedLeads = async () => {
            const data = await getConvertedLeads(shopId);
            setConvertedLeads(data);
        }
        fetchConvertedLeads();
    }, [shopId]);

    const handleCardClick = (filter: FilterType) => {
        const newFilter = selectedFilter === filter ? 'ALL' : filter;
        setSelectedFilter(newFilter);
        onFilterChange(newFilter);
    };

    return (
        <section className="mb-10 w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-3 mb-3">
                <Card 
                    className={`bg-[#111] border-[#222] cursor-pointer transition-colors ${
                        selectedFilter === 'ALL' ? 'border-blue-500' : ''
                    }`}
                    onClick={() => handleCardClick('ALL')}
                >
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">All Leads</h3>
                            <UsersRound className={`w-5 h-5 ${
                                selectedFilter === 'ALL' ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{totalLeads}</p>
                        {/* <p className="text-sm text-gray-400">+12.5% from last month</p> */}
                    </CardContent>
                </Card>

                <Card 
                    className={`bg-[#111] border-[#222] cursor-pointer transition-colors ${
                        selectedFilter === 'NEW' ? 'border-blue-500' : ''
                    }`}
                    onClick={() => handleCardClick('NEW')}
                >
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">New Leads</h3>
                            <Flame className={`w-5 h-5 ${
                                selectedFilter === 'NEW' ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{newLeads}</p>
                        {/* <p className="text-sm text-gray-400">+5% from last month</p> */}
                    </CardContent>
                </Card>

                <Card 
                    className={`bg-[#111] border-[#222] cursor-pointer transition-colors ${
                        selectedFilter === 'REWARD' ? 'border-blue-500' : ''
                    }`}
                    onClick={() => handleCardClick('REWARD')}
                >
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Reward Leads</h3>
                            <Gift className={`w-5 h-5 ${
                                selectedFilter === 'REWARD' ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{rewardLeads}</p>
                    </CardContent>
                </Card>

                <Card 
                    className={`bg-[#111] border-[#222] cursor-pointer transition-colors ${
                        selectedFilter === 'CUSTOMER' ? 'border-blue-500' : ''
                    }`}
                    onClick={() => handleCardClick('CUSTOMER')}
                >
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg text-white mb-1">Converted Leads</h3>
                            <Check className={`w-5 h-5 ${
                                selectedFilter === 'CUSTOMER' ? 'text-blue-500' : 'text-gray-400'
                            }`} />
                        </div>
                        <p className="text-2xl mb-2 font-bold text-white">{convertedLeads}</p>
                        {/* <p className="text-sm text-gray-400">+10% from last month</p> */}
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
