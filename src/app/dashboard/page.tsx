"use client";

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState, useEffect } from "react";
import { getMessages } from "./api/receive-message/receive-message";
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"

export default function Dashboard() {
	const [date, setDate] = useState<Date | undefined>(new Date())
	const [messages, setMessages] = useState<any[]>([]);

	useEffect(() => {
		const fetchMessages = async () => {
			const messages = await getMessages("850e8400-e29b-41d4-a716-446655440001");
			if (messages) {
				setMessages(messages);
			}
		};
		fetchMessages();
	}, []);

	return (
		<div className="min-h-screen bg-black text-white">
		{/* Main Content */}
		<main className="container mx-auto p-4">
			{/* Welcome Header */}
			<div className="mb-6 flex items-center justify-between">
			<h1 className="flex items-center gap-4 text-4xl font-bold">
				<span className="h-8 w-2 bg-red-600 rounded"></span>
				Welcome Hussain
			</h1>
			<Button variant="destructive" className="rounded-md">
				<span className="mr-1">+</span> ADD NEW JOB
			</Button>
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
			<StatCard title="Leads" todayCount={20} monthCount={250} />
			<StatCard title="Customers" todayCount={20} monthCount={250} />
			<StatCard title="Tasks" todayLabel="To-Do" todayCount={15} monthLabel="Completed" monthCount={4} />
			</div>

			{/* Dashboard Content */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
			{/* Invoices Section */}
			
			<ScrollArea className="h-[500px]">
				<div className="lg:col-span-1 space-y-4">
					<h2 className="text-2xl font-bold mb-4">Upcoming Invoices</h2>
					<InvoiceCard
					invoiceNumber="1"
					invoiceId="11"
					clientName="AK Autos"
					address="3424 Clark Blvd"
					email="home@akautos.com"
					amount={565.0}
					issueDate="Feb 6, 2025"
					/>
					<InvoiceCard
					invoiceNumber="2"
					invoiceId="11"
					clientName="AK Autos"
					address="3424 Clark Blvd"
					email="home@akautos.com"
					amount={565.0}
					issueDate="Feb 6, 2025"
					/>
				</div>
			</ScrollArea>

			{/* Calendar Section */}
			<div className="lg:col-span-1">
				<h2 className="text-2xl font-bold mb-4">Calendar</h2>
				<Calendar 
					mode="single"
					selected={date}
					onSelect={setDate}
				/>
			</div>

			{/* Messages Section */}
			<div className="lg:col-span-1">
				<Card className="bg-gray-900 border-gray-800 text-white h-full">
					<CardHeader>
						<h2 className="text-2xl font-bold">Customer Messages</h2>
					</CardHeader>
					<CardContent className="p-6 flex flex-col h-full overflow-y-auto max-h-[600px]">
						<div className="flex flex-col space-y-4">
							{messages
								.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
								.map((msg) => (
									<Card key={msg.id} className="bg-gray-800 border-gray-700">
										<CardHeader className="pb-2">
											<div className="flex justify-between items-center">
												<h3 className="text-lg font-semibold">{msg.name}</h3>
												<Badge variant={msg.status === 'unread' ? "destructive" : "secondary"}>
													{msg.status}
												</Badge>
											</div>
										</CardHeader>
										<CardContent className="py-2">
											<p className="text-gray-300 mb-2">{msg.message}</p>
											<div className="flex flex-col text-xs text-gray-400 mt-2">
												<span>Email: {msg.email}</span>
												{msg.phone_number && <span>Phone: {msg.phone_number}</span>}
												<span className="mt-1">
													{new Date(msg.created_at).toLocaleString()}
												</span>
											</div>
										</CardContent>
										<CardFooter className="pt-2 pb-3 flex justify-end gap-2">
											<Button 
												variant="outline" 
												size="sm"
												onClick={() => {
													// Mark as read logic
													console.log(`Marking message ${msg.id} as read`);
												}}
											>
												Mark as Read
											</Button>
											<Button 
												variant="default" 
												size="sm"
												onClick={() => {
													// Reply logic
													console.log(`Replying to message ${msg.id}`);
												}}
											>
												Reply
											</Button>
										</CardFooter>
									</Card>
								))}
						</div>
						{messages.length === 0 && (
							<div className="text-center py-8 text-gray-400">
								No messages found
							</div>
						)}
						<Button onClick={() => getMessages("850e8400-e29b-41d4-a716-446655440001")} className="mt-4">
							Refresh Messages
						</Button>
					</CardContent>
				</Card>
			</div>
			</div>
		</main>
		</div>
	)
}

function ChevronDown() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function StatCard({ title, todayLabel = "Today", todayCount, monthLabel = "This Month", monthCount }: { title: string, todayLabel?: string, todayCount: number, monthLabel?: string, monthCount: number }) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-gray-400">
            {todayLabel}: <span className="text-white font-medium">{todayCount}</span>
          </div>
          <div className="text-gray-400">
            {monthLabel}: <span className="text-white font-medium">{monthCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function InvoiceCard({ invoiceNumber, invoiceId, clientName, address, email, amount, issueDate }: { invoiceNumber: string, invoiceId: string, clientName: string, address: string, email: string, amount: number, issueDate: string }) {
  return (
    <Card className="bg-gray-900 border-gray-800 text-white">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold">Invoice #{invoiceNumber}</h3>
            <p className="text-gray-400">#{invoiceId}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Your Name</p>
            <p className="text-xs text-gray-400">Your Studio</p>
            <p className="text-xs text-gray-400">Address</p>
            <p className="text-xs text-gray-400">email@example.com</p>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-4 flex justify-between">
          <div>
            <p className="text-xs text-gray-400">BILL TO</p>
            <p className="font-medium">{clientName}</p>
            <p className="text-xs text-gray-400">{address}</p>
            <p className="text-xs text-gray-400">{email}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">AMOUNT DUE</p>
            <p className="text-green-500 font-bold">${amount.toFixed(2)}</p>
            <p className="text-xs text-gray-400">Issued on: {issueDate}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

