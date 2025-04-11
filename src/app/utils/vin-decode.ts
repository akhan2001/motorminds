import axios from 'axios'

interface DecodedVehicle {
	year: string;
	make: string;
	model: string;
	engine: string;
	trim?: string;
	drivetrain?: string;
}

export async function decodeVin(vin: string): Promise<DecodedVehicle | null> {
    if (!vin || vin.length < 11) {
      throw new Error('Please enter a valid VIN (at least 11 characters)');
    }

    try {
		const res = await axios.get(
			`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValuesExtended/${vin}?format=json`
		);
		
		const result = res.data.Results[0];

		if (!result) {
			throw new Error('No vehicle data found');
		}

		return {
			year: result.ModelYear,
			make: result.Make,
			model: result.Model,
			engine: result.EngineModel || `${result.EngineCylinders} Cyl / ${result.DisplacementL}L`,
			trim: result.Trim,
			drivetrain: result.DriveType || result.DriveTrain,
		};
    } catch (error) {
		console.error('VIN decode error:', error);
		throw new Error('Failed to decode VIN');
    }
}