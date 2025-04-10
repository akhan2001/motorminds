import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface CustomerVehicleDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAddVehicle: (vehicle: Vehicle) => void;
}

interface Vehicle {
    year: string;
    make: string;
    model: string;
    color: string;
    vin: string;
}

export function CustomerVehicleDialog({ isOpen, onOpenChange, onAddVehicle }: CustomerVehicleDialogProps) {
    const [newVehicle, setNewVehicle] = useState<Vehicle>({
        year: "",
        make: "",
        model: "",
        color: "",
        vin: "",
    });

    const handleAddVehicle = () => {
        onAddVehicle(newVehicle);
        setNewVehicle({
            year: "",
            make: "",
            model: "",
            color: "",
            vin: "",
        });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#131313] text-white border border-[#222]">
                    <DialogHeader>
                        <DialogTitle>Add New Vehicle</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Add a new vehicle to the customer's profile
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="year" className="text-left text-gray-300">Year</Label>
                            <Input
                                id="year"
                                value={newVehicle.year}
                                onChange={(e) => setNewVehicle({ ...newVehicle, year: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="YYYY"
                                type="number"
                                min="1960"
                                max={new Date().getFullYear()}
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="make" className="text-left text-gray-300">Make</Label>
                            <Input
                                id="make"
                                value={newVehicle.make}
                                onChange={(e) => setNewVehicle({ ...newVehicle, make: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Make"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="model" className="text-left text-gray-300">Model</Label>
                            <Input
                                id="model"
                                value={newVehicle.model}
                                onChange={(e) => setNewVehicle({ ...newVehicle, model: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Model"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="color" className="text-left text-gray-300">Color</Label>
                            <Input
                                id="color"
                                value={newVehicle.color}
                                onChange={(e) => setNewVehicle({ ...newVehicle, color: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="Color"
                            />
                        </div>

                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="vin" className="text-left text-gray-300">VIN</Label>
                            <Input
                                id="vin"
                                value={newVehicle.vin}
                                onChange={(e) => setNewVehicle({ ...newVehicle, vin: e.target.value })}
                                className="col-span-3 bg-[#292929] text-white border-[#626262]"
                                placeholder="VIN"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-[#EF4444] text-white hover:bg-[#EF4444]/80"
                            onClick={handleAddVehicle}
                        >
                            Add Vehicle
                        </Button>
                    </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}