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
                    <Card key={vehicle.id} className="bg-white dark:bg-card border-border text-foreground">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl text-foreground">
                                    {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.engine_type && <span className="text-muted-foreground text-sm">({vehicle.engine_type})</span>}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                                        <DropdownMenuItem>Edit</DropdownMenuItem>
                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            {vehicle.color && (
                                <CardDescription className="text-muted-foreground">
                                    Color: {vehicle.color}
                                </CardDescription>
                            )}
                        </CardHeader>
                        <CardContent className="space-y-3 py-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <p className="text-muted-foreground text-sm">VIN</p>
                                    <p className="text-foreground">{vehicle.vin || 'Not recorded'}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">License Plate</p>
                                    <p className="text-foreground">{vehicle.license_plate || vehicle.license_plate === null || vehicle.license_plate === undefined || vehicle.license_plate === '' ? 'Not recorded' : vehicle.license_plate}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Mileage</p>
                                    <div className="flex items-center">
                                        <Gauge className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <p className="text-foreground">{vehicle.mileage ? `${vehicle.mileage} mi` : 'Not recorded'}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-muted-foreground text-sm">Next Service</p>
                                    <div className="flex items-center">
                                        <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                                        <p className="text-foreground">{vehicle.next_service_date ? new Date(vehicle.next_service_date).toLocaleDateString() : 'Not scheduled'}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="border-t border-border pt-3">
                            {/* <Button 
                                variant="outline" 
                                className="border border-[#626262] text-gray-300 hover:bg-[#626262] hover:text-white w-full"
                            >
                                Service History
                            </Button> */}
                        </CardFooter>
                    </Card>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-card rounded-lg border border-border md:col-span-2">
                    <Car className="h-12 w-12 text-muted-foreground mb-3" />
                    <h3 className="text-xl font-semibold mb-2 text-foreground">No Vehicles</h3>
                    <p className="text-muted-foreground text-center mb-4">This customer doesn't have any vehicles on record.</p>
                    <Button
                        variant="outline"
                        className="border border-border text-muted-foreground hover:bg-muted hover:text-foreground"
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