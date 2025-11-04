import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { SearchIcon } from "lucide-react";
import { decodeVin } from '@/app/utils/vin-decode';
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

interface CustomerVehicleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAddVehicle: (vehicle: Vehicle) => void;
    initialData?: Vehicle;
    isEditing?: boolean;
}

interface Vehicle {
    year: string;
    make: string;
    model: string;
    color: string;
    vin: string;
    engine: string;
}

export function CustomerVehicleDialog({ isOpen, onOpenChange, onAddVehicle, initialData, isEditing = false }: CustomerVehicleDialogProps) {
    const [newVehicle, setNewVehicle] = useState<Vehicle>(
        initialData || {
            year: "",
            make: "",
            model: "",
            color: "",
            vin: "",
            engine: "",
        }
    );
    const YEARS = Array.from({ length: new Date().getFullYear() - 1960 }, (_, i) => new Date().getFullYear() - i);

    // Reset form when dialog opens/closes or when initialData changes
    useEffect(() => {
        if (isOpen && initialData) {
            setNewVehicle(initialData);
        } else if (!isOpen && !isEditing) {
            setNewVehicle({
                year: "",
                make: "",
                model: "",
                color: "",
                vin: "",
                engine: "",
            });
        }
    }, [isOpen, initialData, isEditing]);

    const handleAddVehicle = () => {
        // Validate required fields
        if (!newVehicle.year) {
            toast.error("Year is required");
            return;
        }
        if (!newVehicle.make) {
            toast.error("Make is required");
            return;
        }
        if (!newVehicle.model) {
            toast.error("Model is required");
            return;
        }

        onAddVehicle(newVehicle);
        if (!isEditing) {
            setNewVehicle({
                year: "",
                make: "",
                model: "",
                color: "",
                vin: "",
                engine: "",
            });
        }
        onOpenChange(false);
    };

    const handleVinLookup = async () => {
        try {
            const vehicleData = await decodeVin(newVehicle.vin);
            if (vehicleData) {
                setNewVehicle({
                    ...newVehicle,
                    year: vehicleData.year,
                    make: vehicleData.make,
                    model: vehicleData.model,
                    engine: vehicleData.engine,
                });
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to decode VIN');
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-slate-50 dark:bg-card text-foreground border border-border">
                    <DialogHeader>
                        <DialogTitle className="text-foreground">{isEditing ? 'Edit Vehicle' : 'Add New Vehicle'}</DialogTitle>
                        <DialogDescription className="text-muted-foreground">
                            {isEditing ? 'Update vehicle information' : 'Add a new vehicle to the customer\'s profile'}
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-left text-foreground">Year</Label>
                            <Select
                                value={newVehicle.year}
                                onValueChange={(value) => setNewVehicle({ ...newVehicle, year: value })}
                            >
                                <SelectTrigger className="w-full bg-white dark:bg-background text-foreground border-border">
                                    <SelectValue placeholder="Select Year" />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border max-h-[200px]">
                                    {YEARS.map((year) => (
                                        <SelectItem 
                                            key={year} 
                                            value={year.toString()}
                                        >
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="make" className="text-left text-foreground">Make</Label>
                            <Input
                                id="make"
                                value={newVehicle.make}
                                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                placeholder="Make"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-left text-foreground">Model</Label>
                            <Input
                                id="model"
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                placeholder="Model"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="engine" className="text-left text-foreground">Engine</Label>
                            <Input
                                id="engine"
                                value={newVehicle.engine}
                                onChange={(e) => setNewVehicle({ ...newVehicle, engine: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                placeholder="Engine"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-left text-foreground">Color</Label>
                            <Input
                                id="color"
                                value={newVehicle.color}
                                onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                className="col-span-3 bg-white dark:bg-background text-foreground border-border"
                                placeholder="Color"
                            />
                        </div>

                        <Separator className="bg-border" />

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vin" className="text-left text-foreground">VIN</Label>
                            <div className="col-span-3 flex items-center gap-2">
                                <Input
                                    id="vin"
                                    value={newVehicle.vin}
                                    onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                                    className="flex-1 bg-white dark:bg-background text-foreground border-border"
                                    placeholder="VIN"
                                />
                                <Button 
                                    variant="outline" 
                                    className="bg-white dark:bg-background text-foreground border-border hover:bg-muted"
                                    onClick={handleVinLookup}
                                >
                                    <SearchIcon className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleAddVehicle}
                        >
                            {isEditing ? 'Save Changes' : 'Add Vehicle'}
                        </Button>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}