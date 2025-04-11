import { Card } from "@/components/ui/card";
import { CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MoreVertical, Gauge, Clock, Car, Plus } from "lucide-react";
import { CustomerVehicleDialog } from "../../components/customer-vehicle-dialog";
import { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
interface CustomerVehicleCardProps {
    customerVehicles: any[];
}

export function CustomerVehicleCard({ customerVehicles }: CustomerVehicleCardProps) {
    const [isAddingVehicle, setIsAddingVehicle] = useState(false);
    const [isDeletingVehicle, setIsDeletingVehicle] = useState<string | null>(null);

    const handleAddVehicle = () => {
        setIsAddingVehicle(true);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customerVehicles.length > 0 ? (
                customerVehicles.map((vehicle: any) => (
                    <Card key={vehicle.id} className="bg-[#1A1A1A] border-[#333] text-white">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">
                                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.engine_type && <span className="text-gray-400 text-sm">({vehicle.engine_type})</span>}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-[#0d0d0d] text-white border-[#1f1f1f]">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {vehicle.color && (
                                <CardDescription className="text-gray-400">
                                    Color: {vehicle.color}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 py-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-gray-400 text-sm">VIN</p>
                                    <p>{vehicle.vin || 'Not recorded'}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">License Plate</p>
                                    <p>{vehicle.license_plate || vehicle.license_plate === null || vehicle.license_plate === undefined || vehicle.license_plate === '' ? 'Not recorded' : vehicle.license_plate}</p>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Mileage</p>
                                    <div className="flex items-center">
                                        <Gauge className="h-4 w-4 mr-1 text-gray-400" />
                                        <p>{vehicle.mileage ? `${vehicle.mileage} mi` : 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-gray-400 text-sm">Next Service</p>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                        <p>{vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'Not scheduled'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-[#333] pt-3">
                            <Button 
                                variant="outline" 
                                className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full"
                            >
                                Service History
                            </Button>
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-[#1A1A1A] rounded-lg border border-[#333] md:col-span-2">
                    <Car className="h-12 w-12 text-gray-500 mb-3" />
                    <h3 className="text-xl font-semibold mb-2">No Vehicles</h3>
                    <p className="text-gray-400 text-center mb-4">This customer doesn't have any vehicles on record.</p>
                    <Button
                        variant="outline"
                        className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white"
                        onClick={() => setIsAddingVehicle(true)}
                    >
                        Add Vehicle <Plus className="w-4 h-4 ml-2" />
                    </Button>

                    <CustomerVehicleDialog
                        isOpen={isAddingVehicle}
                        onOpenChange={setIsAddingVehicle}
                        onAddVehicle={handleAddVehicle}
                    />
                </div>
            )}
        </div>
    );
}