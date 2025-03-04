'use client'

import { Nav } from "../components/nav"
import { useEffect, useState } from "react"
import { getLeads } from "./utils/lead"
import { LeadRow } from "@/app/lead-generation/components/lead-row"

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
        <div className="bg-black h-screen">
            <Nav activeLink="Lead Generation" />
			<div className="mb-8 mx-10">
				<p className="text-gray-400">Hussain's</p>
				<h2 className="text-4xl font-bold flex items-center text-gray-200">
					<span className="w-1 h-10 bg-red-500 mr-3 rounded"></span>
					Lead Generator
				</h2>
			</div>

			<div className="flex gap-4 mx-10">
				<div className="flex-1 min-w-[60%]">
					{/* Leads Table */}
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

				{/* Message Box */}
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
			</div>
		</div>
	)
}
