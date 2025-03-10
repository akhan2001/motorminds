export function CustomerVehicleCard({ vehicle }: { vehicle: any }) {
    return (
        <div>
            <h3>{vehicle.customer_year} {vehicle.customer_make} {vehicle.customer_model}</h3>
        </div>
    )
}
