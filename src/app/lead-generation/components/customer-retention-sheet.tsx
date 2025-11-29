import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Phone, Mail, User, Calendar, FileText, Car, Edit, Save, X, MessageSquare, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetClose,
  SheetFooter,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// MiaInsights removed - use newer AI insights components from (features)/ai

interface CustomerRetention {
  id: string;
  shop_id: string;
  work_order_id: string;
  customer_id: string;
  vehicle_id: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  recommended_followup_date: string;
  insights_json: any;
  summary: string;
  notes: string | null;
}

interface CustomerRetentionSheetProps {
  retentionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CustomerRetentionSheet({ 
    retentionId, 
    open, 
    onOpenChange 
}: CustomerRetentionSheetProps) {
    const [retention, setRetention] = useState<CustomerRetention | null>(null);
    const [customer, setCustomer] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [workOrder, setWorkOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        status: "",
        priority: "",
        recommended_followup_date: "",
        notes: ""
    });

    useEffect(() => {
        const fetchData = async () => {
        if (!retentionId || !open) return;
        
        setLoading(true);
        try {
            // Fetch retention record
            const { data, error } = await supabase
            .from("customer_retention")
            .select("*")
            .eq("id", retentionId)
            .single();

            if (error) throw error;
            setRetention(data);
            setFormData({
            status: data.status,
            priority: data.priority,
            recommended_followup_date: data.recommended_followup_date,
            notes: data.notes || ""
            });

            // Fetch customer info
            if (data?.customer_id) {
            const { data: customerData } = await supabase
                .from("customers")
                .select("*")
                .eq("id", data.customer_id)
                .single();
            
            setCustomer(customerData);
            }

            // Fetch vehicle info
            if (data?.vehicle_id) {
            const { data: vehicleData } = await supabase
                .from("customer_vehicles")
                .select("*")
                .eq("id", data.vehicle_id)
                .single();
            
            setVehicle(vehicleData);
            }

            // Fetch work order info
            if (data?.work_order_id) {
            const { data: workOrderData } = await supabase
                .from("repair_orders")
                .select("*")
                .eq("id", data.work_order_id)
                .single();
            
            setWorkOrder(workOrderData);
            }
        } catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Failed to load retention data");
        } finally {
            setLoading(false);
        }
        };

        if (open && retentionId) {
        fetchData();
        } else {
        // Reset states when sheet is closed
        setRetention(null);
        setCustomer(null);
        setVehicle(null);
        setWorkOrder(null);
        setIsEditing(false);
        }
    }, [retentionId, open]);

    const handleSave = async () => {
        if (!retentionId) return;
        
        try {
        const { error } = await supabase
            .from("customer_retention")
            .update({
            status: formData.status,
            priority: formData.priority,
            recommended_followup_date: formData.recommended_followup_date,
            notes: formData.notes,
            updated_at: new Date().toISOString()
            })
            .eq("id", retentionId);

        if (error) throw error;
        
        // Update local state
        if (retention) {
            setRetention({
            ...retention,
            status: formData.status,
            priority: formData.priority,
            recommended_followup_date: formData.recommended_followup_date,
            notes: formData.notes,
            updated_at: new Date().toISOString()
            });
        }
        
        toast.success("Retention record updated successfully");
        setIsEditing(false);
        } catch (error) {
        console.error("Error updating retention record:", error);
        toast.error("Failed to update retention record");
        }
    };

    const recordContact = async (method: string) => {
        if (!retentionId) return;
        toast.success(`${method} contact recorded`);
    };

    const getStatusColor = (status: string) => {
        const colors = {
        "pending": "bg-yellow-500",
        "in_progress": "bg-blue-500",
        "completed": "bg-green-500",
        "converted": "bg-purple-500",
        "lost": "bg-red-500"
        };
        return colors[status as keyof typeof colors] || "bg-gray-500";
    };

    const getPriorityColor = (priority: string) => {
        const colors = {
        "low": "bg-green-500",
        "medium": "bg-blue-500",
        "high": "bg-yellow-500",
        "urgent": "bg-red-500"
        };
        return colors[priority as keyof typeof colors] || "bg-gray-500";
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Show loading or error content inside the sheet
    const renderContent = () => {
        if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
            </div>
        );
        }

        if (!retention) {
        return <div className="text-red-500 p-4">Retention record not found</div>;
        }

        return (
        <div className="space-y-5">
            {/* Status and Actions */}
            <Card className="bg-[#292929] border-none">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-white flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${getStatusColor(retention.status)}`}></div>
                    {retention.status.replace('_', ' ').toUpperCase()}
                </div>
                <div className="flex items-center gap-2">
                    {isEditing ? (
                    <>
                        <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={() => setIsEditing(false)}
                        >
                        <X className="h-4 w-4" />
                        </Button>
                        <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={handleSave}
                        >
                        <Check className="h-4 w-4" />
                        </Button>
                    </>
                    ) : (
                    <Button 
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-transparent"
                        onClick={() => setIsEditing(true)}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    )}
                </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label className="text-gray-400 text-xs">Status</Label>
                    {isEditing ? (
                    <Select 
                        value={formData.status}
                        onValueChange={(value) => setFormData({...formData, status: value})}
                    >
                        <SelectTrigger className="mt-1 bg-[#222] border-[#444] text-white">
                        <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#333] border-[#444] text-white">
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="converted">Converted</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                    </Select>
                    ) : (
                    <p className="text-white text-sm mt-1">{retention.status.replace('_', ' ')}</p>
                    )}
                </div>
                <div>
                    <Label className="text-gray-400 text-xs">Priority</Label>
                    {isEditing ? (
                    <Select 
                        value={formData.priority}
                        onValueChange={(value) => setFormData({...formData, priority: value})}
                    >
                        <SelectTrigger className="mt-1 bg-[#222] border-[#444] text-white">
                        <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#333] border-[#444] text-white">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                    </Select>
                    ) : (
                    <div className="flex items-center mt-1">
                        <div className={`h-2 w-2 rounded-full ${getPriorityColor(retention.priority)} mr-2`}></div>
                        <p className="text-white text-sm">{retention.priority}</p>
                    </div>
                    )}
                </div>
                </div>
                <div>
                <Label className="text-gray-400 text-xs">Follow-up Date</Label>
                {isEditing ? (
                    <Input 
                    type="date" 
                    className="mt-1 bg-[#222] border-[#444] text-white"
                    value={formData.recommended_followup_date.split('T')[0]}
                    onChange={(e) => setFormData({...formData, recommended_followup_date: e.target.value})}
                    />
                ) : (
                    <div className="mt-1 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    <p className="text-white text-sm">{formatDate(retention.recommended_followup_date)}</p>
                    </div>
                )}
                </div>
            </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
            <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent border-[#444] text-white hover:bg-[#333] hover:text-white"
                onClick={() => recordContact("Phone Call")}
            >
                <Phone className="h-4 w-4 mr-2" />
                Log Call
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent border-[#444] text-white hover:bg-[#333] hover:text-white"
                onClick={() => recordContact("Email")}
            >
                <Mail className="h-4 w-4 mr-2" />
                Log Email
            </Button>
            <Button 
                variant="outline" 
                size="sm"
                className="bg-transparent border-[#444] text-white hover:bg-[#333] hover:text-white"
                onClick={() => recordContact("Text Message")}
            >
                <MessageSquare className="h-4 w-4 mr-2" />
                Log Text
            </Button>
            </div>

            {/* Customer Information */}
            {customer && (
            <Card className="bg-[#292929] border-none">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-white">
                    <User className="h-5 w-5 mr-2 text-blue-400" />
                    Customer Information
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                <div className="font-medium text-white">{customer.customer_name}</div>
                {customer.customer_email && (
                    <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`mailto:${customer.customer_email}`} className="text-blue-400 hover:underline">
                        {customer.customer_email}
                    </a>
                    </div>
                )}
                {customer.customer_phone && (
                    <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-gray-400" />
                    <a href={`tel:${customer.customer_phone}`} className="text-blue-400 hover:underline">
                        {customer.customer_phone}
                    </a>
                    </div>
                )}
                </CardContent>
            </Card>
            )}

            {/* Vehicle Information */}
            {vehicle && (
            <Card className="bg-[#292929] border-none">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-white">
                    <Car className="h-5 w-5 mr-2 text-blue-400" />
                    Vehicle Information
                </CardTitle>
                </CardHeader>
                <CardContent>
                <div className="font-medium text-white">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                </div>
                {vehicle.vin && (
                    <div className="text-sm mt-1">
                    <span className="text-gray-400">VIN:</span>{" "}
                    <span className="text-white">{vehicle.vin}</span>
                    </div>
                )}
                </CardContent>
            </Card>
            )}

            {/* Work Order Info */}
            {workOrder && (
            <Card className="bg-[#292929] border-none">
                <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium flex items-center text-white">
                    <FileText className="h-5 w-5 mr-2 text-blue-400" />
                    Work Order Information
                </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                <div>
                    <Label className="text-gray-400 text-xs">Work Order ID</Label>
                    <div className="text-white text-sm">{workOrder.id}</div>
                </div>
                <div>
                    <Label className="text-gray-400 text-xs">Created</Label>
                    <div className="text-white text-sm">
                    {formatDate(workOrder.created_at)}
                    </div>
                </div>
                <div>
                    <Label className="text-gray-400 text-xs">Status</Label>
                    <div className="text-white text-sm">{workOrder.status}</div>
                </div>
                </CardContent>
            </Card>
            )}

            {/* AI Insights */}
            <MiaInsights 
              insights={{
                flags: retention.insights_json?.flags,
                upsellSuggestions: retention.insights_json?.upsellOpportunities,
                customerActions: retention.insights_json?.customerActions,
                summary: retention.summary
              }}
              workOrderStatus={retention.status}
              recommendedFollowupDate={retention.recommended_followup_date}
              hasRetentionRecord={true}
            />

            {/* Notes */}
            <div>
            <div className="flex items-center justify-between mb-2">
                <Label className="text-gray-400 text-xs">Notes</Label>
            </div>
            {isEditing ? (
                <Textarea 
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={4}
                placeholder="Add notes about this retention record..."
                className="bg-[#292929] text-white text-sm border-[#626262] focus:ring-gray-500 resize-none"
                />
            ) : (
                <div className="bg-[#292929] text-white text-sm border-[#626262] p-3 rounded-md min-h-[100px]">
                {retention.notes || "No notes available"}
                </div>
            )}
            </div>
        </div>
        );
    };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="bg-[#131313] text-white border-l border-[#222] w-[400px] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="text-white text-lg">Customer Retention</SheetTitle>
          </div>
          <SheetDescription className="text-gray-400 text-sm">
            View and manage retention information for this customer
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-4">
          {renderContent()}
        </div>
        
        <SheetFooter className="mt-6">
          <Button 
            variant="outline" 
            className="bg-transparent border-[#444] text-gray-300 hover:bg-[#222] hover:text-white"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// Hook to use the retention sheet from other components
export function useRetentionSheet() {
  const [open, setOpen] = useState(false);
  const [retentionId, setRetentionId] = useState<string | null>(null);

  const openRetentionSheet = async (workOrderId: string) => {
    try {
      // First check if retention record exists
      const { data, error } = await supabase
        .from("customer_retention")
        .select("id")
        .eq("work_order_id", workOrderId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Record not found
          toast.error("No retention record found for this work order");
          return;
        } else {
          throw error;
        }
      }
      
      if (data?.id) {
        setRetentionId(data.id);
        setOpen(true);
      }
    } catch (error) {
      console.error("Error checking retention record:", error);
      toast.error("Failed to access retention information");
    }
  };

  return {
    open,
    setOpen,
    retentionId,
    setRetentionId,
    openRetentionSheet
  };
}

