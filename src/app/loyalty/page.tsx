import { createClient } from "@/utils/supabase/server";
import { Nav } from "../components/nav";
import LoyaltyDashboard from "./components/LoyaltyDashboard";

export default async function LoyaltyPage() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();

    return (
        <div className="h-screen bg-black">
            <Nav activeLink="Loyalty" />
            <div className="flex flex-col justify-start h-screen">
                <div className="flex flex-row items-start px-10 max-w-[1400px] mr-auto">
                    <div className="w-5 h-5 bg-red-500 rounded-full"></div>
                    <h1 className="text-white text-[3rem] font-bold">Welcome {user?.email}</h1>
                </div>
                {/* <LoyaltyDashboard /> */}
                
            </div>
        </div>
	);
}