import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface CustomerIntakeFormSuccessProps {
    workOrderNumber: string
    customerName: string
    vehicleInfo: {
        year: string | number
        make: string
        model: string
    }
    serviceDescription: string
    onReset: () => void
}

export function CustomerIntakeFormSuccess({
    workOrderNumber,
    customerName,
    vehicleInfo,
    serviceDescription,
    onReset
}: CustomerIntakeFormSuccessProps) {
    return (
        <Card className="w-full max-w-2xl mx-auto bg-card border-border">
            <CardHeader className="border-b border-border">
                <CardTitle className="text-xl font-semibold text-center text-foreground">Thank You!</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 px-4 sm:px-6 text-center">
                <div className="mb-6">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-medium mb-2 text-foreground">Your Information Was Submitted Successfully</h3>
                    <p className="text-muted-foreground mb-4">Please proceed to the front desk to complete your check-in.</p>

                    <div className="bg-muted rounded-lg p-3 sm:p-4 mb-6 max-w-md mx-auto text-sm sm:text-base">
                        <h4 className="text-green-600 dark:text-green-500 text-base sm:text-lg font-medium mb-2">Work Order Created!</h4>
                        <p className="text-foreground mb-2">
                            <span className="font-semibold">Name:</span> {customerName}
                        </p>
                        <p className="text-foreground mb-2">
                            <span className="font-semibold">Vehicle:</span> {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
                        </p>
                        <p className="text-foreground mb-2">
                            <span className="font-semibold">Service:</span> {serviceDescription}
                        </p>
                        <p className="text-xs text-muted-foreground mt-3 break-all">
                            Work Order: {workOrderNumber}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <Button
                        onClick={onReset}
                        className="px-4 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto max-w-xs"
                        size="lg"
                    >
                        Next Customer
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

