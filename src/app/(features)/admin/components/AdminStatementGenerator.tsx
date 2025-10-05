import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, FileText, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getDateRangePresets } from "@/app/invoices/utils/statement-utils";
import { StatementDateRange } from "@/app/invoices/types/statement";
import { cn } from "@/lib/utils";
import { CustomerList } from "./CustomerList";
import { downloadStatementPDF } from "@/app/invoices/utils/statement-generator";
import { fetchShopBusinessDetails } from "@/app/invoices/utils/invoice-utils";

interface AdminStatementGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Shop {
    id: string;
    shop_name: string;
    shop_email: string;
    customer_count: number;
}

interface Customer {
    id: string;
    customer_name: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    shop_id: string;
    shops?: {
        shop_name: string;
        shop_email: string;
    };
    invoice_count: number;
    outstanding_balance: number;
}

export function AdminStatementGenerator({ isOpen, onClose }: AdminStatementGeneratorProps) {
    const [shops, setShops] = useState<Shop[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [selectedShopId, setSelectedShopId] = useState<string>("all");
    const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
    const [datePreset, setDatePreset] = useState<string>("last_90_days");
    const [dateRange, setDateRange] = useState<StatementDateRange>({
        start: new Date(new Date().setDate(new Date().getDate() - 90)),
        end: new Date()
    });
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [loadingShops, setLoadingShops] = useState(false);
    const [loadingCustomers, setLoadingCustomers] = useState(false);

    const datePresets = getDateRangePresets();

    // Load shops
    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoadingShops(true);
                const response = await fetch('/api/admin/shops');
                const data = await response.json();
                
                if (response.ok) {
                    setShops(data.shops || []);
                } else {
                    toast.error("Failed to load shops");
                }
            } catch (error) {
                console.error("Error fetching shops:", error);
                toast.error("Failed to load shops");
            } finally {
                setLoadingShops(false);
            }
        };

        if (isOpen) {
            fetchShops();
        }
    }, [isOpen]);

    // Load customers when shop changes
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                setLoadingCustomers(true);
                const url = selectedShopId === 'all' 
                    ? '/api/admin/customers'
                    : `/api/admin/customers?shopId=${selectedShopId}`;
                
                const response = await fetch(url);
                const data = await response.json();
                
                if (response.ok) {
                    setCustomers(data.customers || []);
                } else {
                    toast.error("Failed to load customers");
                }
            } catch (error) {
                console.error("Error fetching customers:", error);
                toast.error("Failed to load customers");
            } finally {
                setLoadingCustomers(false);
            }
        };

        if (isOpen && selectedShopId) {
            fetchCustomers();
        }
    }, [isOpen, selectedShopId]);

    // Handle date preset change
    const handleDatePresetChange = (value: string) => {
        setDatePreset(value);
        
        if (value === "custom") {
            return;
        }

        const preset = datePresets.find(p => p.label.toLowerCase().replace(/\s+/g, '_') === value);
        if (preset) {
            const range = preset.getValue();
            setDateRange(range);
        }
    };

    // Handle custom date changes
    useEffect(() => {
        if (datePreset === "custom" && customStartDate && customEndDate) {
            setDateRange({
                start: customStartDate,
                end: customEndDate
            });
        }
    }, [customStartDate, customEndDate, datePreset]);

    const handleGenerate = async () => {
        if (selectedCustomers.length === 0) {
            toast.error("Please select at least one customer");
            return;
        }

        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select a valid date range");
            return;
        }

        setIsGenerating(true);

        try {
            let successCount = 0;
            let failCount = 0;

            // Generate statements for each selected customer
            for (const customerId of selectedCustomers) {
                try {
                    const customer = customers.find(c => c.id === customerId);
                    if (!customer) continue;

                    // Get shop info for this customer
                    const businessDetails = await fetchShopBusinessDetails(customer.shop_id);
                    
                    const shopInfo = {
                        shop_name: customer.shops?.shop_name || 'Unknown Shop',
                        shop_address: '',
                        shop_phone: '',
                        shop_email: customer.shops?.shop_email || '',
                        hst_number: businessDetails.hst_number,
                        business_number: businessDetails.business_number,
                        shop_tagline: businessDetails.shop_tagline
                    };

                    // Generate and download statement
                    await downloadStatementPDF(
                        {
                            id: customer.id,
                            customer_name: customer.customer_name,
                            customer_address: customer.customer_address || '',
                            customer_phone: customer.customer_phone || '',
                            customer_email: customer.customer_email || ''
                        },
                        shopInfo,
                        customer.shop_id,
                        dateRange
                    );

                    successCount++;
                    
                    // Small delay between downloads to avoid browser blocking
                    await new Promise(resolve => setTimeout(resolve, 500));
                } catch (error) {
                    console.error(`Error generating statement for customer ${customerId}:`, error);
                    failCount++;
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully generated ${successCount} statement${successCount > 1 ? 's' : ''}!`);
            }
            if (failCount > 0) {
                toast.error(`Failed to generate ${failCount} statement${failCount > 1 ? 's' : ''}`);
            }
            
            if (successCount > 0) {
                onClose();
            }
        } catch (error) {
            console.error("Error generating statements:", error);
            toast.error("Failed to generate statements");
        } finally {
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setSelectedShopId("all");
        setSelectedCustomers([]);
        setDatePreset("last_90_days");
        setDateRange({
            start: new Date(new Date().setDate(new Date().getDate() - 90)),
            end: new Date()
        });
        setCustomStartDate(undefined);
        setCustomEndDate(undefined);
    };

    useEffect(() => {
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader className="p-6 border-b border-[#222222]">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-500" />
                        <div>
                            <DialogTitle className="text-white text-xl">Generate Customer Statements (Admin)</DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm">
                                Select customers and generate statements across all shops
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Shop Selection */}
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Shop</label>
                        <Select value={selectedShopId} onValueChange={setSelectedShopId} disabled={loadingShops}>
                            <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500">
                                <SelectValue placeholder="Select shop" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                <SelectItem value="all">All Shops ({shops.reduce((sum, s) => sum + s.customer_count, 0)} customers)</SelectItem>
                                {shops.map((shop) => (
                                    <SelectItem key={shop.id} value={shop.id}>
                                        {shop.shop_name} ({shop.customer_count} customers)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Date Range Preset */}
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Date Range</label>
                        <Select value={datePreset} onValueChange={handleDatePresetChange}>
                            <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500">
                                <SelectValue placeholder="Select date range" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                {datePresets.map((preset) => (
                                    <SelectItem 
                                        key={preset.label} 
                                        value={preset.label.toLowerCase().replace(/\s+/g, '_')}
                                    >
                                        {preset.label}
                                    </SelectItem>
                                ))}
                                <SelectItem value="custom">Custom Range</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Date Range Pickers */}
                    {datePreset === "custom" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm font-medium">Start Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-[#292929] text-white border-[#626262]",
                                                !customStartDate && "text-gray-400"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {customStartDate ? format(customStartDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333]">
                                        <Calendar
                                            mode="single"
                                            selected={customStartDate}
                                            onSelect={setCustomStartDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm font-medium">End Date</label>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "w-full justify-start text-left font-normal bg-[#292929] text-white border-[#626262]",
                                                !customEndDate && "text-gray-400"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {customEndDate ? format(customEndDate, "PPP") : "Pick a date"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-[#1a1a1a] border-[#333]">
                                        <Calendar
                                            mode="single"
                                            selected={customEndDate}
                                            onSelect={setCustomEndDate}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>
                    )}

                    {/* Customer List */}
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Select Customers</label>
                        <CustomerList
                            customers={customers}
                            selectedCustomers={selectedCustomers}
                            onSelectionChange={setSelectedCustomers}
                            loading={loadingCustomers}
                        />
                    </div>

                    {/* Preview Info */}
                    {selectedCustomers.length > 0 && (
                        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#333]">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Generation Summary</h4>
                            <div className="text-xs text-gray-400 space-y-1">
                                <p><span className="font-medium">Customers:</span> {selectedCustomers.length}</p>
                                <p><span className="font-medium">Period:</span> {format(dateRange.start, "PPP")} to {format(dateRange.end, "PPP")}</p>
                                <p className="text-yellow-400 mt-2">
                                    ⚠️ This will generate {selectedCustomers.length} statement PDF{selectedCustomers.length > 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex flex-row justify-between p-6 border-t border-[#222222]">
                    <Button 
                        variant="outline" 
                        onClick={onClose}
                        className="border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        disabled={isGenerating}
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleGenerate}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                        disabled={isGenerating || selectedCustomers.length === 0}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="mr-2 h-4 w-4" />
                                Generate {selectedCustomers.length} Statement{selectedCustomers.length > 1 ? 's' : ''}
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
