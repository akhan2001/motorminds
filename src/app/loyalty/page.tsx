import { Nav } from "@/app/components/nav"
import LoyaltyDashboard from "@/app/loyalty/components/loyalty-dashboard"

export default function Loyalty() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
        <Nav activeLink="Loyalty" />
        <LoyaltyDashboard />
    </div>
  )
}