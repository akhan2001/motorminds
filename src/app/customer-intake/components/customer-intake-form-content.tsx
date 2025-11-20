import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CustomerInformation } from '@/app/(features)/operations/components/work-orders/shared/customer-information'
import { VehicleInformation } from '@/app/(features)/operations/components/work-orders/shared/vehicle-information'

interface CustomerIntakeFormContentProps {
    shopId: string
    serviceDescription: string
    isSubmitting: boolean
    
    // Customer props
    customerId: string
    customerName: string
    customerEmail: string
    customerPhone: string
    customerAddress: string
    vehicleId: string
    vehicleYear: string
    vehicleMake: string
    vehicleModel: string
    vehicleColor: string
    vehicleVin: string
    vehicleLicensePlate: string
    vehicleMileage: string
    
    // Handlers
    onServiceDescriptionChange: (value: string) => void
    onFieldChange: (field: string, value: string) => void
    onCustomerChange: (id: string) => void
    onCustomerSaved: (id: string, data: any) => void
    onVehicleSelect: (id: string, data?: any) => void
    onVehicleSaved: (id: string) => void
    onSubmit: () => void
}

export function CustomerIntakeFormContent({
    shopId,
    serviceDescription,
    isSubmitting,
    customerId,
    customerName,
    customerEmail,
    customerPhone,
    customerAddress,
    vehicleId,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicleColor,
    vehicleVin,
    vehicleLicensePlate,
    vehicleMileage,
    onServiceDescriptionChange,
    onFieldChange,
    onCustomerChange,
    onCustomerSaved,
    onVehicleSelect,
    onVehicleSaved,
    onSubmit
}: CustomerIntakeFormContentProps) {
    return (
        <Card className="w-full max-w-2xl mx-auto bg-card border-border">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-foreground">Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 px-3 sm:px-6">
                {/* Customer Information Component */}
                <div className="space-y-6 mb-6">
                    <CustomerInformation
                        customerId={customerId}
                        customerName={customerName}
                        customerEmail={customerEmail}
                        customerPhone={customerPhone}
                        customerAddress={customerAddress}
                        isEditing={true}
                        isCreating={true}
                        onFieldChange={onFieldChange}
                        onCustomerChange={onCustomerChange}
                        onCustomerSaved={onCustomerSaved}
                    />

                    {/* Vehicle Information Component */}
                    {customerId && customerId !== 'new' && (
                        <VehicleInformation
                            customerId={customerId}
                            selectedVehicleId={vehicleId}
                            vehicleYear={vehicleYear}
                            vehicleMake={vehicleMake}
                            vehicleModel={vehicleModel}
                            vehicleColor={vehicleColor}
                            vehicleVin={vehicleVin}
                            vehicleLicensePlate={vehicleLicensePlate}
                            vehicleMileage={vehicleMileage}
                            isEditing={true}
                            isCreating={true}
                            onFieldChange={onFieldChange}
                            onVehicleSelect={onVehicleSelect}
                            onVehicleSaved={onVehicleSaved}
                            shopId={shopId}
                        />
                    )}
                </div>

                {/* Service Description */}
                <div className="space-y-2 mt-6">
                    <Label htmlFor="serviceDescription" className="text-foreground">
                        Service Description <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                        id="serviceDescription"
                        placeholder="Describe the service needed"
                        value={serviceDescription}
                        onChange={(e) => onServiceDescriptionChange(e.target.value)}
                        className="min-h-[100px]"
                        required
                    />
                </div>

                {/* Helper Text */}
                {(!customerId || customerId === '' || customerId === 'new' || !vehicleId || vehicleId === '' || vehicleId === 'new') && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-sm text-blue-800 dark:text-blue-300">
                            <strong>📝 Important:</strong> Please make sure to save the customer and vehicle information before submitting the form.
                        </p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="pt-6">
                    <Button
                        onClick={onSubmit}
                        className="w-full"
                        size="lg"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

