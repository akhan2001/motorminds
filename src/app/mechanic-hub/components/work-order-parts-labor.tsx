"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Wrench, PackageOpen } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import { getShopId } from "@/utils/supabase/supabase-shop"
import { checkUser } from "@/utils/supabase/supabase-auth"
import { useRouter } from "next/navigation"
import { Separator } from "@/components/ui/separator"

interface Item {
  id: string
  type: "labor" | "parts"
  name: string
  description: string
  cost: number
  quantity?: number
}

interface Service {
  id: string
  shop_id: string
  service_name: string
  description: string
  price: number
  quantity: number | null
  type: "labor" | "parts"
  created_at: string
}

interface WorkOrderPartsLaborProps {
  onUpdateTotal: (total: number) => void
  onSelectLabor?: (description: string, cost: number, id: string) => void
  onSelectParts?: (description: string, cost: number, id: string) => void
  onDeselectLabor?: () => void
  onDeselectParts?: () => void
  selectedLaborId?: string
  selectedPartsId?: string
}

export function WorkOrderPartsLabor({ 
  onUpdateTotal, 
  onSelectLabor, 
  onSelectParts,
  onDeselectLabor,
  onDeselectParts,
  selectedLaborId,
  selectedPartsId
}: WorkOrderPartsLaborProps) {
  const router = useRouter()
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [shopId, setShopId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    const fetchShopServices = async () => {
      try {
        const user = await checkUser()
        if (user) {
          const id = await getShopId(user.id)
          setShopId(id)
          
          const { data, error } = await supabase
            .from("shop_services")
            .select("*")
            .eq("shop_id", id)
            .order("service_name", { ascending: true })

          if (error) throw error

          // Convert services to items format
          const formattedItems: Item[] = (data || []).map((service: Service) => ({
            id: service.id,
            type: service.type,
            name: service.service_name,
            description: service.description || "",
            cost: service.price,
            ...(service.type === "parts" && { quantity: service.quantity || 1 })
          }))

          setItems(formattedItems)
        }
      } catch (error) {
        console.error("Error fetching services:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchShopServices()
  }, [])

  const handleItemClick = (item: Item) => {
    if (item.type === "labor") {
      if (selectedLaborId === item.id && onDeselectLabor) {
        onDeselectLabor()
      } else if (onSelectLabor) {
        onSelectLabor(item.name, item.cost, item.id)
      }
    } else if (item.type === "parts") {
      if (selectedPartsId === item.id && onDeselectParts) {
        onDeselectParts()
      } else if (onSelectParts) {
        onSelectParts(item.name, item.cost, item.id)
      }
    }
  }

  const updateTotal = (currentItems: Item[]) => {
    const total = currentItems.reduce((sum, item) => sum + item.cost, 0)
    onUpdateTotal(total)
  }

  const navigateToServicesParts = () => {
    router.push("/mechanic-hub/service-parts")
  }

  // Filter items based on search query
  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description.toLowerCase().includes(searchQuery.toLowerCase())
  )
  
  const filteredLaborItems = filteredItems.filter(item => item.type === "labor")
  const filteredPartsItems = filteredItems.filter(item => item.type === "parts")

  return (
    <div className="w-[350px] bg-[#131313] border-l border-[#222222] flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-[#222222]">
        <h3 className="text-lg font-medium text-white">Labor & Parts</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1 p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 p-4 space-y-4">
          <p className="text-gray-400 text-center">No services or parts found.</p>
          <div className="flex flex-col space-y-3 w-full">
            <Button 
              onClick={navigateToServicesParts}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full"
            >
              Go to Services & Parts
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Items list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {/* Search bar */}
              <div className="mb-4">
                <Input
                  className="bg-[#131313] border-[#333] focus:ring-0 placeholder-gray-500"
                  placeholder="Search for parts or labor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Separator className="my-4 bg-[#333]" />
              
              {/* Labor section */}
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                  <Wrench className="h-3.5 w-3.5 mr-1.5" /> LABOR
                </h4>
                {filteredLaborItems.length > 0 ? (
                  filteredLaborItems.map((item) => {
                    const isSelected = item.id === selectedLaborId;
                    const borderStyle = isSelected 
                      ? "border-2 border-blue-500" 
                      : "border border-[#333333]";
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group p-3 rounded bg-[#1A1A1A] hover:bg-[#222222] transition-colors cursor-pointer mb-2",
                          borderStyle
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-1 mb-1">{item.description}</p>
                            )}
                            <p className="text-sm text-blue-400">${item.cost.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 italic">No labor items available</p>
                )}
              </div>

              {/* Parts section */}
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center">
                  <PackageOpen className="h-3.5 w-3.5 mr-1.5" /> PARTS
                </h4>
                {filteredPartsItems.length > 0 ? (
                  filteredPartsItems.map((item) => {
                    const isSelected = item.id === selectedPartsId;
                    const borderStyle = isSelected 
                      ? "border-2 border-purple-500" 
                      : "border border-[#333333]";
                    
                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "group p-3 rounded bg-[#1A1A1A] hover:bg-[#222222] transition-colors cursor-pointer mb-2",
                          borderStyle
                        )}
                        onClick={() => handleItemClick(item)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-white font-medium">{item.name}</p>
                            {item.description && (
                              <p className="text-xs text-gray-400 mt-1 mb-1">{item.description}</p>
                            )}
                            <div className="flex justify-between items-center">
                              <p className="text-sm text-purple-400">${item.cost.toFixed(2)}</p>
                              {item.quantity && (
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-gray-500 italic">No parts items available</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
