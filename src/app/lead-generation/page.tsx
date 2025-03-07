'use client'

import { Nav } from "../components/nav"
import { useEffect, useState } from "react"
import { getLeads } from "./utils/lead"
import { LeadRow } from "@/app/lead-generation/components/lead-row"
import { LeadFilter } from "./components/lead-filters"
import { LeadTable } from "./components/lead-table"

export default function LeadGenerationPage() {
	const [leads, setLeads] = useState<any[]>([])
	const [selectedMessage, setSelectedMessage] = useState<string | null>(null)

	const handleLeadSelect = (id: string, message: string) => {
        setSelectedMessage(message)
    }
	
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

					<LeadFilter />

					<LeadTable />

					{/* <div className="flex gap-4">
						<div className="flex-1 min-w-[60%]">
							<div className="bg-[#0f0f0f] rounded-lg overflow-hidden">
								<div className="h-[750px] overflow-y-auto">
									{leads.map((lead) => (
										<LeadRow
											key={lead.id}
											id={lead.id}
											name={lead.customer_name}
											email={lead.email}
											phone={lead.phone}
											status={lead.status}
											message={lead.message}
											onSelect={handleLeadSelect}
										/>
									))}
								</div>
							</div>
						</div>

						<div className="flex-1">
							<div className="bg-[#0f0f0f] rounded-lg overflow-hidden h-[750px]">
								<div className="p-4 border-b border-gray-800">
									<h3 className="text-lg font-medium text-white">Message</h3>
								</div>
								<div className="max-h-[500px] overflow-y-auto p-4 text-white">
									{selectedMessage ? (
										<p className="whitespace-pre-wrap">{selectedMessage}</p>
									) : (
										<p className="text-gray-500 italic">Select a lead to view their message</p>
									)}
								</div>
							</div>
						</div>
					</div> */}
				</div>
			</div>
		</div>
	)
}
