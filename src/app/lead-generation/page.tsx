'use client'

import { Nav } from "../components/nav"
import { useEffect, useState } from "react"
import { getLeads } from "./utils/lead"
import { LeadFilter } from "./components/lead-filters"
import { LeadTable } from "./components/lead-table"

export default function LeadGenerationPage() {
	const [leads, setLeads] = useState<any[]>([])
	const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

	// const handleLeadSelect = (id: string, message: string) => {
    //     setSelectedMessage(message)
    // }
	
	useEffect(() => {
		const fetchLeads = async () => {
			const data = await getLeads()
			setLeads(data)
		}
		fetchLeads()
	}, [])

    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Nav activeLink="Lead Generation" />
			
            <div className="flex items-center justify-center py-8">
				<div className="container mx-auto max-w-[1300px]">
					<div className="flex flex-col pb-4 mb-4">
						<h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-white">Lead Generation</h1>
						<p className="text-gray-400">
						Manage your leads and track their activity through the lead generation page.
						</p>
					</div>

					<section>
						<LeadFilter />
					</section>

					<section>
						<LeadTable />
					</section>
				</div>
			</div>
		</div>
	)
}
