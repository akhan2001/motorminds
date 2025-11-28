import { Nav } from "@/components/navigation/nav"
import { motion } from "framer-motion"

export default function FeaturesLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<>
			<Nav />
			{children}
		</>
	)
}

