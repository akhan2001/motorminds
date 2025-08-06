import { LeadFilter } from "./lead-filters";
import { LeadTable } from "./lead-table";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquare } from 'lucide-react';
import { useEffect, useState } from "react";
import { getShopName } from "@/utils/shopinfo/getShopInfo";
import Link from "next/link";

export function LeadDashboard({ shopId, user }: { shopId: string, user: any }) {
    const router = useRouter();
    const [shopName, setShopName] = useState<string | null>(null);
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'NEW' | 'REWARD' | 'CUSTOMER'>('ALL');

    useEffect(() => {
        const fetchShopName = async () => {
            const shopData = await getShopName(shopId);
            setShopName(shopData?.[0]?.shop_name || null);
        };
        fetchShopName();
    }, [shopId]);

    const handleViewShopPage = () => {
        console.log("Shop Name: ", shopName);
        window.open(`/customer/lead-generation/${shopName}-${shopId}`, '_blank');
    };

    return (
        <div className="flex items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-col pb-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
                            Lead Generation
                        </h1>
                        <div className="flex gap-2">
                            <Link href="/widget-dashboard">
                                <Button
                                    variant="outline"
                                    className="gap-2 text-white border-gray-500 hover:bg-gray-600 hover:text-white transition-all duration-300"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                    Widget Dashboard
                                </Button>
                            </Link>
                            <Button
                                onClick={handleViewShopPage}
                                variant="outline"
                                className="gap-2 text-white border-gray-500 hover:bg-gray-600 hover:text-white transition-all duration-300"
                            >
                                <ExternalLink className="h-4 w-4" />
                                View Shop Page
                            </Button>
                        </div>
                    </div>
                    <p className="text-gray-400">
                        Manage your leads and track their activity through the lead generation page.
                    </p>
                </div>
                <section>
                    <LeadFilter shopId={shopId} user={user} onFilterChange={(filter) => setActiveFilter(filter as 'ALL' | 'NEW' | 'REWARD' | 'CUSTOMER')} />
                </section>
                <section>
                    <LeadTable shopId={shopId} user={user} activeFilter={activeFilter as 'ALL' | 'NEW' | 'REWARD' | 'CUSTOMER'} />
                </section>
            </div>
        </div>
    );
}
