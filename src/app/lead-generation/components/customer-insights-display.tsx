"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Info, Clock, User, Car } from "lucide-react"
import { getCustomerDetails } from "@/app/customers/api/customer-utils"
import { getVehicleInfoById } from "@/app/vehicles/utils/vehicle_utils"

interface CustomerInsightsProps {
  repairOrderId?: string
  insightId?: string
  shopId?: string
}

export default function CustomerInsightsDisplay({ 
  repairOrderId, 
  insightId,
  shopId,
  
}: CustomerInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [customer, setCustomer] = useState<any>(null)
  const [vehicle, setVehicle] = useState<any>(null)

  useEffect(() => {
    
    const fetchInsights = async () => {
      setLoading(true)
      setError(null)
      
      try {
        let query = supabase.from("mia_customer_insights").select("*")
        
        if (insightId) {
          query = query.eq("id", insightId)
        } else if (repairOrderId) {
          query = query.eq("repair_order_id", repairOrderId)
        } else if (shopId) {
          // If no specific insight is requested, get the most recent one for this shop
          query = query.eq("shop_id", shopId).order("created_at", { ascending: false }).limit(1)
        } else {
          throw new Error("Either insightId, repairOrderId, or shopId must be provided")
        }
        
        const { data, error } = await query.single()
        
        if (error) {
          console.error("Error fetching insights:", error)
          setError("Failed to load insights")
        } else if (data) {
          console.log("Fetched insights:", data)
          setInsights(data)
          
          // Fetch customer and vehicle info if available
          if (data.customer_id) {
            try {
              const customerData = await getCustomerDetails(data.customer_id)
              setCustomer(customerData)
            } catch (err) {
              console.error("Error fetching customer:", err)
            }
          }
          
          if (data.vehicle_id) {
            try {
              const vehicleData = await getVehicleInfoById(data.vehicle_id)
              setVehicle(vehicleData)
            } catch (err) {
              console.error("Error fetching vehicle:", err)
            }
          }
        }
      } catch (err) {
        console.error("Error in fetchInsights:", err)
        setError(err instanceof Error ? err.message : "An unknown error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchInsights()
  }, [insightId, repairOrderId, shopId])

  const getStatusBadgeColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'high': return 'bg-red-500 hover:bg-red-600'
      case 'medium': return 'bg-yellow-500 hover:bg-yellow-600'
      case 'low': return 'bg-green-500 hover:bg-green-600'
      default: return 'bg-blue-500 hover:bg-blue-600'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'text-red-500'
      case 'medium': return 'text-yellow-500'
      case 'low': return 'text-green-500'
      default: return 'text-gray-500'
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-pulse text-gray-400">Loading insights...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="rounded-md border border-red-800 bg-red-900/20 p-4 text-red-400">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>Error: {error}</span>
        </div>
      </div>
    )
  }
  
  if (!insights) {
    return (
      <div className="rounded-md border border-[#333] p-4 text-gray-400">
        <div className="flex items-center">
          <Info className="h-5 w-5 mr-2" />
          <span>No insights available</span>
        </div>
      </div>
    )
  }
  
  // Extract analysis data (could be in the analysis field or directly in insights)
  const analysisData = insights.analysis || {}
  
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* Customer & Vehicle Information - Left 35% */}
      <div className="md:w-[35%] space-y-4">
        {(customer || vehicle) && (
          <Card className="bg-[#1A1A1A] border-[#333]">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-white flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-400" />
                Customer & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Info */}
              {customer && (
                <div className="space-y-2">
                  <h4 className="text-xs text-gray-400 uppercase mb-1">Customer</h4>
                  <p className="text-white font-medium">{customer.customer_name}</p>
                  {customer.customer_phone && (
                    <p className="text-white text-sm">{customer.customer_phone}</p>
                  )}
                  {customer.customer_email && (
                    <p className="text-white text-sm">{customer.customer_email}</p>
                  )}
                  {customer.address && (
                    <p className="text-white text-sm">{customer.address}</p>
                  )}
                </div>
              )}
              
              {/* Vehicle Info */}
              {vehicle && (
                <div className="space-y-2">
                  <h4 className="text-xs text-gray-400 uppercase mb-1">Vehicle</h4>
                  <p className="text-white font-medium">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <div className="flex flex-wrap gap-2 text-sm text-white">
                    {vehicle.color && (
                      <span className="bg-[#333] px-2 py-1 rounded-md">{vehicle.color}</span>
                    )}
                    {vehicle.engine_type && (
                      <span className="bg-[#333] px-2 py-1 rounded-md">{vehicle.engine_type}</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Insights Card - Right 65% */}
      <div className="md:w-[65%] space-y-4">
        <Card className="bg-[#1A1A1A] border-[#333]">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-medium text-white">Immediate Insights</CardTitle>
              {insights.priority && (
                <Badge className={getStatusBadgeColor(insights.priority)}>
                  {insights.priority.toUpperCase()} PRIORITY
                </Badge>
              )}
            </div>
            {insights.created_at && (
              <div className="text-xs text-gray-400 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Generated: {new Date(insights.created_at).toLocaleString()}
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary Section */}
            {(insights.summary || analysisData.summary) && (
              <div>
                <h4 className="text-xs text-gray-400 uppercase mb-2">Summary</h4>
                <p className="text-white whitespace-pre-wrap">{insights.summary || analysisData.summary}</p>
              </div>
            )}
            
            {/* Flags Section */}
            {analysisData.flags && analysisData.flags.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-gray-400 uppercase mb-2">Flags</h4>
                <div className="space-y-2">
                  {analysisData.flags.map((flag: any, index: number) => (
                    <div key={index} className="p-3 bg-[#222] border border-[#333] rounded-md">
                      <div className="flex items-center gap-2">
                        <Badge className={`${flag.type === 'urgent' ? 'bg-red-500/20 text-red-400' : 
                                       flag.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                                       'bg-blue-500/20 text-blue-400'}`}>
                          {flag.type || 'info'}
                        </Badge>
                        <p className="text-sm text-white">{flag.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upsell Suggestions */}
            {analysisData.upsell_suggestions && analysisData.upsell_suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs text-gray-400 uppercase mb-2">Recommended Services</h4>
                <div className="space-y-3">
                  {analysisData.upsell_suggestions.map((suggestion: any, index: number) => (
                    <div key={index} className="p-3 bg-[#222] border border-[#333] rounded-md">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-white">{suggestion.title}</p>
                        <Badge className={getPriorityColor(suggestion.priority)}>
                          {suggestion.priority || 'Normal'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{suggestion.description}</p>
                      {suggestion.estimatedValue && (
                        <p className="text-xs text-green-400 mt-1">
                          ${typeof suggestion.estimatedValue === 'number' ? 
                           suggestion.estimatedValue.toFixed(2) : suggestion.estimatedValue}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Display estimated value if available */}
            {insights.estimated_value && (
              <div className="border-t border-[#333] pt-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Estimated Value:</span>
                  <span className="text-lg font-semibold text-green-400">
                    ${parseFloat(insights.estimated_value).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
            
            {/* Display confidence score if available */}
            {insights.confidence_score && (
              <div className="text-right text-xs text-gray-500">
                Confidence Score: {parseFloat(insights.confidence_score).toFixed(1)}%
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 