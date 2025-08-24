"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "@/components/ui/resizable"
import InvoiceDashboardClient from "./invoice-dashboard-client"

interface InvoicesClientLayoutProps {
	shopId: string
}

export default function InvoicesClientLayout({ shopId }: InvoicesClientLayoutProps) {
	const [showMia, setShowMia] = useState(true)
	const [groupHeight, setGroupHeight] = useState<number>(0)

	useEffect(() => {
		const calc = () => {
			const header = document.querySelector('header') as HTMLElement | null
			const navH = header?.offsetHeight ?? 0
			const vh = window.innerHeight
			setGroupHeight(Math.max(0, vh - navH))
		}
		calc()
		window.addEventListener('resize', calc)
		return () => window.removeEventListener('resize', calc)
	}, [])

	return (
		<main className="flex-1">
			{/* Header controls - simple and aligned */}
			<div className="px-4 py-3">
				<div className="flex items-center justify-between">
					<h1 className="text-2xl font-bold">Invoices</h1>
					<Button
						variant="outline"
						className="bg-[#0d0d0d] border-[#1f1f1f] text-white hover:bg-white/10"
						onClick={() => setShowMia((v) => !v)}
					>
						{showMia ? 'Hide Assistant' : 'Show Assistant'}
					</Button>
				</div>
			</div>

			{/* Full-width resizable area */}
			<ResizablePanelGroup
				direction="horizontal"
				className="w-full rounded-none overflow-hidden"
				style={{ height: groupHeight || undefined, minHeight: groupHeight || undefined }}
			>
				{/* Left: Invoice Dashboard */}
				<ResizablePanel defaultSize={showMia ? 65 : 100} minSize={30} className="min-w-0">
					<div className="h-full px-4 pb-4">
						<div className="h-full w-full bg-[#0f0f0f] border border-[#1f1f1f] rounded-md">
							<InvoiceDashboardClient shopId={shopId} />
						</div>
					</div>
				</ResizablePanel>

				{showMia && (
					<>
						<ResizableHandle withHandle className="bg-[#1f1f1f]" />
						<ResizablePanel defaultSize={35} minSize={30} maxSize={40} className="min-w-[320px]">
							<div className="h-full px-4 pb-4">
								<div className="h-full w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-md">
									{/* Placeholder Mia block for now */}
									<div className="h-full flex items-center justify-center text-[#979797]">
										Mia Sidebar
									</div>
								</div>
							</div>
						</ResizablePanel>
					</>
				)}
			</ResizablePanelGroup>
		</main>
	)
}