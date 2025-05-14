import { Nav } from "./components/nav";
import DashboardPage from "./dashboard/page";

export default function Page() {
	return (
		<div className="h-screen bg-black">
			<DashboardPage />
		</div>
	);
}