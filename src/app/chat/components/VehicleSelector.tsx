'use client';

import { useState } from 'react';
import { ChevronDown, Car } from 'lucide-react';

// MOTOR Sandbox Vehicles
export const sandboxVehicles = [
  { motorId: 1872, baseVehicleId: 1939, year: 1997, make: 'Dodge', model: 'Neon', vin: '1B3ES47Y6VD205309' },
  { motorId: 5108, baseVehicleId: 5264, year: 2002, make: 'Ford', model: 'Explorer', vin: '1FMZU74W22UC09718' },
  { motorId: 20680, baseVehicleId: 30027, year: 2009, make: 'Chevrolet', model: 'Silverado 1500', vin: '1GCEK29079E143364' },
  { motorId: 20790, baseVehicleId: 30144, year: 2009, make: 'Dodge', model: 'Ram 1500', vin: '1D3HV13T39S713967' },
  { motorId: 20957, baseVehicleId: 30390, year: 2010, make: 'Toyota', model: 'Camry', vin: '4T4BF3EK8AR074927' },
  { motorId: 20969, baseVehicleId: 30402, year: 2010, make: 'Chevrolet', model: 'Camaro', vin: '2G1FT1EW3A9111145' },
  { motorId: 22055, baseVehicleId: 92758, year: 2010, make: 'Dodge', model: 'Challenger', vin: '2B3CJ7DW1AH173347' },
  { motorId: 22124, baseVehicleId: 95946, year: 2010, make: 'Honda', model: 'Civic', vin: '19XFA1F51AE028415' },
  { motorId: 22147, baseVehicleId: 95971, year: 2010, make: 'Ford', model: 'F-250 Super Duty', vin: '1FTSW2BR0AEB13613' },
  { motorId: 22156, baseVehicleId: 95980, year: 2010, make: 'Nissan', model: 'Altima', vin: '1N4AL2AP6AN555869' },
  { motorId: 22203, baseVehicleId: 96028, year: 2010, make: 'Mercedes-Benz', model: 'C350', vin: 'WDDGF5GBXAR126533' },
  { motorId: 26332, baseVehicleId: 118906, year: 2012, make: 'Ford', model: 'F-150', vin: '1FTFW1ET1CFA84056', engineId: 11302, submodelId: 104 },
  { motorId: 60180, baseVehicleId: 136724, year: 2016, make: 'Freightliner', model: 'Cascadia', vin: '3AKJGLD56GSGJ2574' },
  { motorId: 64112, baseVehicleId: 141113, year: 2015, make: 'Hino', model: '338', vin: '5PVNV8JRXF4S50916' },
  { motorId: 22258, baseVehicleId: 96087, year: 2010, make: 'Acura', model: 'MDX', vin: '2HNYD2H47AH532332' },
];

export interface SandboxVehicle {
  motorId: number;
  baseVehicleId: number;
  year: number;
  make: string;
  model: string;
  vin: string;
  engineId?: number;
  submodelId?: number;
}

interface VehicleSelectorProps {
  selectedVehicle: SandboxVehicle | null;
  onVehicleSelect: (vehicle: SandboxVehicle) => void;
}

export default function VehicleSelector({ selectedVehicle, onVehicleSelect }: VehicleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Car className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <div className="text-left">
          {selectedVehicle ? (
            <>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                VIN: {selectedVehicle.vin.slice(-8)}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Select a vehicle...
            </div>
          )}
        </div>
        <ChevronDown className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-20 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-3 py-2">
                MOTOR Sandbox Vehicles
              </div>
              {sandboxVehicles.map((vehicle) => (
                <button
                  key={vehicle.motorId}
                  onClick={() => {
                    onVehicleSelect(vehicle);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    selectedVehicle?.motorId === vehicle.motorId
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500'
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        VIN: {vehicle.vin}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Base ID: {vehicle.baseVehicleId} • MOTOR ID: {vehicle.motorId}
                      </div>
                    </div>
                    {selectedVehicle?.motorId === vehicle.motorId && (
                      <div className="ml-2">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

