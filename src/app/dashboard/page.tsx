import Image from "next/image"
import { Bell, ChevronLeft, ChevronRight, Edit, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function Dashboard() {
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

          {/* Calendar Section */}
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Calendar</h2>
            <Card className="bg-gray-900 border-gray-800 text-white">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <Button variant="ghost" className="text-white hover:text-white hover:bg-gray-800">
                    Select date
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-2xl font-bold">Mon, Aug 17</div>
                  <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-gray-800">
                    <Edit className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span>August 2025</span>
                    <ChevronDown />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-gray-800">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-white hover:text-white hover:bg-gray-800">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div key={i} className="py-2">
                      {day}
                    </div>
                  ))}

                  {[...Array(31)].map((_, i) => {
                    const day = i + 1
                    const isSelected = day === 17
                    return (
                      <div key={day} className={`py-2 rounded-full ${isSelected ? "bg-red-600" : "hover:bg-gray-800"}`}>
                        {day}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assistant Section */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-900 border-gray-800 text-white h-full">
              <CardContent className="p-6 flex flex-col h-full">
                <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                  <div className="h-20 w-20 rounded-full bg-black p-4 mb-4">
                    <Image
                      src="/placeholder.svg?height=80&width=80"
                      alt="MIA Logo"
                      width={80}
                      height={80}
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <h2 className="text-4xl font-bold mb-4">How Can I Assist You?</h2>
                  <p className="text-gray-400">
                    I'm MIA, your Motorminds mechanic assistant! I can help with repairs and diagnostics. I'm still in
                    beta, so more features are on the way. Stay tuned for updates!
                  </p>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Type your prompt here"
                    className="w-full bg-black border border-gray-800 rounded-full py-3 px-4 pr-12"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 w-8"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
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

