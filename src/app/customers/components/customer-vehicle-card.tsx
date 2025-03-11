export function CustomerVehicleCard({ vehicle }: { vehicle: any }) {
    return (
        <div>
            <h3>{vehicle.year} {vehicle.make} {vehicle.model}</h3>
        </div>
    )
}
