import { useState, useEffect } from "react";
import { Dialog, DialogHeader, DialogContent, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCustomers } from "@/app/customers/api/customer-utils";
import { fetchShopBusinessDetails } from "../utils/invoice-utils";
import { downloadStatementPDF } from "../utils/statement-generator";
import { getDateRangePresets } from "../utils/statement-utils";
import { StatementDateRange, StatementCustomer, StatementShopInfo } from "../types/statement";

interface StatementGeneratorDialogProps {
    isOpen: boolean;
    onClose: () => void;
    shopId: string;
}

export function StatementGeneratorDialog({ isOpen, onClose, shopId }: StatementGeneratorDialogProps) {
    const [customers, setCustomers] = useState<any[]>([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
    const [selectedCustomer, setSelectedCustomer] = useState<StatementCustomer | null>(null);
    const [datePreset, setDatePreset] = useState<string>("last_90_days");
    const [dateRange, setDateRange] = useState<StatementDateRange>({
        start: new Date(new Date().setDate(new Date().getDate() - 90)),
        end: new Date()
    });
    const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
    const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
    const [isGenerating, setIsGenerating] = useState(false);
    const [shopInfo, setShopInfo] = useState<StatementShopInfo | null>(null);

    const datePresets = getDateRangePresets();

    // Load customers
    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const customersData = await getCustomers(shopId);
                setCustomers(customersData);
            } catch (error) {
                console.error("Error fetching customers:", error);
                toast.error("Failed to load customers");
            }
        };

        if (shopId && isOpen) {
            fetchCustomers();
        }
    }, [shopId, isOpen]);

    // Load shop info
    useEffect(() => {
        const fetchShopInfo = async () => {
            try {
                const info = await fetchShopBusinessDetails(shopId);
                setShopInfo(info as StatementShopInfo);
            } catch (error) {
                console.error("Error fetching shop info:", error);
                toast.error("Failed to load shop information");
            }
        };

        if (shopId && isOpen) {
            fetchShopInfo();
        }
    }, [shopId, isOpen]);

    // Update selected customer details
    useEffect(() => {
        if (selectedCustomerId) {
            const customer = customers.find(c => c.id === selectedCustomerId);
            if (customer) {
                setSelectedCustomer({
                    id: customer.id,
                    customer_name: customer.customer_name,
                    customer_address: customer.customer_address,
                    customer_phone: customer.customer_phone,
                    customer_email: customer.customer_email
                });
            }
        }
    }, [selectedCustomerId, customers]);

    // Handle date preset change
    const handleDatePresetChange = (value: string) => {
        setDatePreset(value);
        
        if (value === "custom") {
            // Don't update date range for custom
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
        if (!selectedCustomer) {
            toast.error("Please select a customer");
            return;
        }

        if (!shopInfo) {
            toast.error("Shop information not loaded");
            return;
        }

        if (!dateRange.start || !dateRange.end) {
            toast.error("Please select a valid date range");
            return;
        }

        setIsGenerating(true);

        try {
            await downloadStatementPDF(
                selectedCustomer,
                shopInfo,
                shopId,
                dateRange
            );

            toast.success("Statement generated successfully!");
            onClose();
        } catch (error) {
            console.error("Error generating statement:", error);
            toast.error("Failed to generate statement");
        } finally {
            setIsGenerating(false);
        }
    };

    const resetForm = () => {
        setSelectedCustomerId("");
        setSelectedCustomer(null);
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
            <DialogContent className="bg-[#131313] text-white border-none rounded-lg shadow-lg p-0 max-w-2xl">
                <DialogHeader className="p-6 border-b border-[#222222]">
                    <div className="flex items-center gap-3">
                        <FileText className="h-6 w-6 text-blue-500" />
                        <div>
                            <DialogTitle className="text-white text-xl">Generate Customer Statement</DialogTitle>
                            <DialogDescription className="text-gray-400 text-sm">
                                Create an account statement for bank purposes
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                        <label className="text-gray-300 text-sm font-medium">Customer</label>
                        <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                            <SelectTrigger className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500">
                                <SelectValue placeholder="Select a customer" />
                            </SelectTrigger>
                            <SelectContent className="bg-[#292929] text-white border-[#626262]">
                                {customers.map((customer) => (
                                    <SelectItem key={customer.id} value={customer.id}>
                                        {customer.customer_name}
                                        <span className="text-gray-400 text-xs ml-2">
                                            ({customer.customer_phone})
                                        </span>
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
                                        onClick={() => {
                                            if (preset.label === 'Custom') {
                                                setDatePreset('custom');
                                            }
                                            else {
                                                setDatePreset(preset.label.toLowerCase().replace(/\s+/g, '_'));
                                            }
                                            setCustomStartDate(preset.getValue()?.start ?? undefined);
                                            setCustomEndDate(preset.getValue()?.end ?? undefined);
                                        }}
                                    >
                                        {preset.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Custom Date Range Pickers */}
                    {datePreset === 'custom' && (
                        <div className="grid grid-cols-2 gap-4">
                            {/* Start Date */}
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm font-medium">Start Date</label>
                                <Input
                                    type="date"
                                    value={customStartDate ? format(customStartDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => setCustomStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                                />
                            </div>

                            {/* End Date */}
                            <div className="space-y-2">
                                <label className="text-gray-300 text-sm font-medium">End Date</label>
                                <Input
                                    type="date"
                                    value={customEndDate ? format(customEndDate, "yyyy-MM-dd") : ""}
                                    onChange={(e) => setCustomEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                                    className="bg-[#292929] text-white border-[#626262] focus:ring-gray-500 [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:brightness-0 [&::-webkit-calendar-picker-indicator]:contrast-100"
                                />
                            </div>
                        </div>
                    )}

                    {/* Preview Info */}
                    {selectedCustomer && (
                        <div className="bg-[#1A1A1A] p-4 rounded-lg border border-[#333]">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Statement Preview</h4>
                            <div className="text-xs text-gray-400 space-y-1">
                                <p><span className="font-medium">Customer:</span> {selectedCustomer.customer_name}</p>
                                <p><span className="font-medium">Period:</span> {format(dateRange.start, "PPP")} to {format(dateRange.end, "PPP")}</p>
                                <p className="text-yellow-400 mt-2">
                                    ⚠️ This statement will include all invoices within the selected date range
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
                        disabled={isGenerating || !selectedCustomer}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <FileText className="mr-2 h-4 w-4" />
                                Generate Statement
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
