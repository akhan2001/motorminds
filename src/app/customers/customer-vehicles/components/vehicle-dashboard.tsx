import { VehicleTable } from './VehicleTable'

export function VehicleDashboard({
    shopId,
    user,
    refreshIndex = 0,
}: {
    shopId: string
    user: any
    refreshIndex?: number
}) {
    return (
        <main className="flex flex-col items-center justify-center py-8">
            <div className="container mx-auto max-w-[1300px]">
                <div className="flex flex-col mb-10">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2 text-foreground">
                        Vehicles
                    </h1>
                    <p className="text-muted-foreground">
                        Search and manage vehicles across your customer base. View
                        vehicle history, work orders, and invoices.
                    </p>
                </div>

                <VehicleTable
                    shopId={shopId}
                    user={user}
                    refreshIndex={refreshIndex}
                />
            </div>
        </main>
    )
}
