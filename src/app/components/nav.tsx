import { Bell, Settings, HelpCircle } from "lucide-react"
import Image from "next/image"

export function Nav() {
return (
	<header className="bg-[#0d0d0d] px-4 pt-2 border-b border-[#1f1f1f] z-50">
		<nav className="flex items-center justify-between max-w-[1400px] mx-auto">
			<div className="flex flex-col items-start">
				{/* Left: Logo and Premium Badge */}
				<div className="flex items-center gap-4 py-3">
					<div className="flex items-center gap-2">
						<Image
						src="/motorminds-logo-white (1).svg"
						alt="Motorminds Logo"
						width={35}
						height={35}
						className="w-8 h-8"
						/>
						<span className="text-white font-medium">Motorminds</span>
					</div>
					<span className="px-3 py-1 text-xs bg-[#1f1f1f] text-white rounded-full">Premium</span>
				</div>
				{/* Center: Navigation Links */}
				<div className="hidden lg:flex items-center gap-8">
				{[
					{ name: "Dashboard", active: false },
					{ name: "Mechanic Hub", active: false },
					{ name: "Mia AI", active: true },
					{ name: "Invoices", active: false },
					{ name: "Lead Generation", active: false },
					{ name: "Loyalty", active: false },
					{ name: "Customers", active: false },
				].map((item) => (
					<a
					key={item.name}
					href="#"
					className={`py-2 border-b-2 ${
						item.active
						? "text-[#b22222] border-[#b22222]"
						: "text-[#979797] border-transparent hover:text-white hover:border-[#979797] transition-colors"
					}`}
					>
					{item.name}
					</a>
				))}
				</div>
			</div>
			{/* Right: Actions */}
			<div className="flex items-center gap-4">
			<button className="text-[#979797] hover:text-white transition-colors">
				{/* <span className="hidden md:inline mr-2">Help</span> */}
				<HelpCircle className="inline-block w-5 h-5" />
			</button>
			<button className="text-[#979797] hover:text-white transition-colors">
				{/* <span className="hidden md:inline mr-2">Settings</span> */}
				<Settings className="inline-block w-5 h-5" />
			</button>
			<button className="text-[#979797] hover:text-white transition-colors relative">
				<Bell className="w-5 h-5" />
				<span className="absolute -top-1 -right-1 w-2 h-2 bg-[#b22222] rounded-full" />
			</button>
			<div className="w-8 h-8 rounded-full bg-[#1f1f1f] flex items-center justify-center">
				<span className="text-white text-sm">AK</span>
			</div>
			</div>
		</nav>
	</header>
	)
}

