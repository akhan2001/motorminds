"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Nav } from "@/app/components/nav"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Plus, Edit2, Trash2, Search } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { checkUser } from "@/utils/supabase/supabase-auth"

interface Service {
  id: string
  shop_id: string
  service_name: string
  description: string
  price: number
  quantity: number
  type: "labor" | "parts"
  created_at: string
}

export default function ServiceParts() {
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentService, setCurrentService] = useState<Service | null>(null)
  const [newService, setNewService] = useState<Partial<Service>>({
    service_name: "",
    description: "",
    price: 0,
    quantity: 1,
    type: "labor"
  })
  const [shopId, setShopId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchShopId = async () => {
      try {
        const user = await checkUser()
        if (user) {
          const id = await getShopId(user.id)
          setShopId(id)
          fetchServices(id)
        }
      } catch (error) {
        console.error("Error fetching shop ID:", error)
      }
    }

    fetchShopId()
  }, [])

  useEffect(() => {
    if (services.length > 0) {
      filterServices()
    }
  }, [searchQuery, activeTab, services])

  const fetchServices = async (shopId: string) => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("shop_services")
        .select("*")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })

      if (error) throw error

      setServices(data || [])
      setFilteredServices(data || [])
    } catch (error) {
      console.error("Error fetching services:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterServices = () => {
    let filtered = [...services]

    // Filter by tab (service type)
    if (activeTab !== "all") {
      filtered = filtered.filter(service => service.type === activeTab)
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        service => 
          service.service_name.toLowerCase().includes(query) || 
          service.description.toLowerCase().includes(query)
      )
    }

    setFilteredServices(filtered)
  }

  const handleAddService = async () => {
    if (!shopId || !newService.service_name || !newService.type) return

    try {
      const { data, error } = await supabase
        .from("shop_services")
        .insert([
          {
            shop_id: shopId,
            service_name: newService.service_name,
            description: newService.description || "",
            price: newService.price || 0,
            quantity: newService.type === "parts" ? (newService.quantity || 1) : null,
            type: newService.type
          }
        ])
        .select()

      if (error) throw error

      setServices([...(data || []), ...services])
      resetForm()
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding service:", error)
    }
  }

  const handleUpdateService = async () => {
    if (!currentService || !currentService.id) return

    try {
      const { error } = await supabase
        .from("shop_services")
        .update({
          service_name: currentService.service_name,
          description: currentService.description,
          price: currentService.price,
          quantity: currentService.quantity,
          type: currentService.type
        })
        .eq("id", currentService.id)

      if (error) throw error

      setServices(services.map(service => 
        service.id === currentService.id ? currentService : service
      ))
      setIsEditDialogOpen(false)
    } catch (error) {
      console.error("Error updating service:", error)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return

    try {
      const { error } = await supabase
        .from("shop_services")
        .delete()
        .eq("id", id)

      if (error) throw error

      setServices(services.filter(service => service.id !== id))
    } catch (error) {
      console.error("Error deleting service:", error)
    }
  }

  const resetForm = () => {
    setNewService({
      service_name: "",
      description: "",
      price: 0,
      quantity: 1,
      type: "labor"
    })
  }

  const handleEditClick = (service: Service) => {
    setCurrentService(service)
    setIsEditDialogOpen(true)
  }

    return (
    <div className="flex flex-col h-screen bg-[#0d0d0d] text-white">
            <Nav activeLink="Mechanic Hub" />
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Service & Parts Catalog</h1>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
                <Plus className="w-4 h-4 mr-2" /> Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1A1A1A] text-white border-[#333]">
              <DialogHeader>
                <DialogTitle>Add New Service or Part</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="text-sm font-medium">Type</label>
                  <Select
                    value={newService.type}
                    onValueChange={(value: "labor" | "parts") => {
                      const newQuantity = value === "labor" ? undefined : 1;
                      setNewService({ 
                        ...newService, 
                        type: value,
                        quantity: newQuantity
                      });
                    }}
                  >
                    <SelectTrigger className="bg-[#131313] border-[#333] focus:ring-0">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131313] border-[#333] text-white">
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="parts">Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="serviceName" className="text-sm font-medium">Service/Part Name</label>
                  <Input 
                    id="serviceName"
                    value={newService.service_name}
                    onChange={(e) => setNewService({ ...newService, service_name: e.target.value })}
                    className="bg-[#131313] border-[#333] focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="description"
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                    className="bg-[#131313] border-[#333] focus:ring-0 min-h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="price" className="text-sm font-medium">Price ($)</label>
                    <Input
                      id="price"
                      type="number"
                      value={newService.price?.toString()}
                      onChange={(e) => setNewService({ ...newService, price: parseFloat(e.target.value) || 0 })}
                      className="bg-[#131313] border-[#333] focus:ring-0"
                    />
                  </div>
                  {newService.type === "parts" && (
                    <div className="space-y-2">
                      <label htmlFor="quantity" className="text-sm font-medium">Quantity</label>
                      <Input
                        id="quantity"
                        type="number"
                        value={newService.quantity?.toString()}
                        onChange={(e) => setNewService({ ...newService, quantity: parseInt(e.target.value) || 1 })}
                        className="bg-[#131313] border-[#333] focus:ring-0"
                      />
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="border-[#333] text-white">
                  Cancel
                </Button>
                <Button onClick={handleAddService} className="bg-[#22C55E] hover:bg-[#22C55E]/90 text-white">
                  Add Item
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="bg-[#131313] border-[#333] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search services and parts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-[#1A1A1A] border-[#333] focus:ring-0 text-white"
                />
              </div>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
                <TabsList className="bg-[#1A1A1A] border border-[#333]">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="labor">Labor</TabsTrigger>
                  <TabsTrigger value="parts">Parts</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Edit dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] text-white border-[#333]">
            <DialogHeader>
              <DialogTitle>Edit Service or Part</DialogTitle>
            </DialogHeader>
            {currentService && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="edit-type" className="text-sm font-medium">Type</label>
                  <Select
                    value={currentService.type}
                    onValueChange={(value: "labor" | "parts") => 
                      setCurrentService({ ...currentService, type: value })
                    }
                  >
                    <SelectTrigger className="bg-[#131313] border-[#333] focus:ring-0">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#131313] border-[#333] text-white">
                      <SelectItem value="labor">Labor</SelectItem>
                      <SelectItem value="parts">Parts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-name" className="text-sm font-medium">Service/Part Name</label>
                  <Input 
                    id="edit-name"
                    value={currentService.service_name}
                    onChange={(e) => setCurrentService({ ...currentService, service_name: e.target.value })}
                    className="bg-[#131313] border-[#333] focus:ring-0"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="edit-description" className="text-sm font-medium">Description</label>
                  <Textarea
                    id="edit-description"
                    value={currentService.description}
                    onChange={(e) => setCurrentService({ ...currentService, description: e.target.value })}
                    className="bg-[#131313] border-[#333] focus:ring-0 min-h-24"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="edit-price" className="text-sm font-medium">Price ($)</label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={currentService.price.toString()}
                      onChange={(e) => setCurrentService({ ...currentService, price: parseFloat(e.target.value) || 0 })}
                      className="bg-[#131313] border-[#333] focus:ring-0"
                    />
                  </div>
                  {currentService.type === "parts" && (
                    <div className="space-y-2">
                      <label htmlFor="edit-quantity" className="text-sm font-medium">Quantity</label>
                      <Input
                        id="edit-quantity"
                        type="number"
                        value={currentService.quantity.toString()}
                        onChange={(e) => setCurrentService({ ...currentService, quantity: parseInt(e.target.value) || 1 })}
                        className="bg-[#131313] border-[#333] focus:ring-0"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-[#333] text-white">
                Cancel
              </Button>
              <Button onClick={handleUpdateService} className="bg-blue-600 hover:bg-blue-700 text-white">
                Update
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="rounded-md border border-[#333] overflow-hidden">
            <Table>
              <TableHeader className="bg-[#1A1A1A]">
                <TableRow className="border-b border-[#333] hover:bg-transparent">
                  <TableHead className="text-white">Name</TableHead>
                  <TableHead className="text-white">Type</TableHead>
                  <TableHead className="text-white">Description</TableHead>
                  <TableHead className="text-white text-right">Price</TableHead>
                  <TableHead className="text-white text-right">Quantity</TableHead>
                  <TableHead className="text-white text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id} className="border-b border-[#333] bg-[#131313] hover:bg-[#1A1A1A]">
                    <TableCell className="font-medium text-white">{service.service_name}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        service.type === "labor" 
                          ? "bg-blue-500/20 text-blue-400" 
                          : "bg-purple-500/20 text-purple-400"
                      }`}>
                        {service.type}
                      </span>
                    </TableCell>
                    <TableCell className="text-gray-400 max-w-xs truncate">
                      {service.description || "No description"}
                    </TableCell>
                    <TableCell className="text-right">${service.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      {service.type === "parts" ? service.quantity : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditClick(service)}
                          className="h-8 w-8 p-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteService(service.id)}
                          className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12 bg-[#131313] border border-[#333] rounded-md">
            <p className="text-gray-400">
              {searchQuery 
                ? "No services or parts match your search criteria." 
                : "No services or parts found. Add some to get started!"}
            </p>
          </div>
        )}
            </div>
        </div>
    )
}
