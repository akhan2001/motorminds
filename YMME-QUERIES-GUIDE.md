# YMME (Year/Make/Model/Engine) Queries Guide

## Overview

The MOTOR DaaS client now supports cascading vehicle selection using Year, Make, Model, and Engine instead of requiring VIN entry. This allows users to select vehicles step-by-step and obtain the `baseVehicleId` needed for diagnostic queries.

---

## API Methods

### 1. Get Available Years
```typescript
const yearResponse = await motorClient.getYears();
// Returns: { years: [2024, 2023, 2022, ...] }
```

### 2. Get Makes for a Year
```typescript
const makeResponse = await motorClient.getMakes(2024);
// Returns: {
//   makes: [
//     { makeId: 1, makeName: 'Toyota' },
//     { makeId: 2, makeName: 'Ford' },
//     ...
//   ]
// }
```

### 3. Get Models for Year + Make
```typescript
const modelResponse = await motorClient.getModels(2024, makeId);
// Returns: {
//   models: [
//     { modelId: 100, modelName: 'Camry' },
//     { modelId: 101, modelName: 'Corolla' },
//     ...
//   ]
// }
```

### 4. Get Engines for Year + Make + Model
```typescript
const engineResponse = await motorClient.getEngines(2024, makeId, modelId);
// Returns: {
//   engines: [
//     {
//       engineId: 5001,
//       engineName: '2.5L 4-Cyl',
//       baseVehicleId: 123456,  // ← Use this for diagnostics!
//       liter: '2.5',
//       cylinders: '4',
//       blockType: 'Inline',
//       fuelType: 'Gasoline',
//       displacement: '2494cc',
//       engineVin: 'A'
//     },
//     ...
//   ]
// }
```

### 5. Get Submodels (Optional)
```typescript
const submodelResponse = await motorClient.getSubmodels(2024, makeId, modelId);
// Returns: {
//   submodels: [
//     { submodelId: 1001, submodelName: 'LE' },
//     { submodelId: 1002, submodelName: 'XLE' },
//     ...
//   ]
// }
```

---

## Complete Flow Example

```typescript
import { MotorDaasClient } from '@/lib/integrations/motor-daas';

const motorClient = new MotorDaasClient({
  publicKey: process.env.MOTOR_DAAS_PUBLIC_KEY!,
  privateKey: process.env.MOTOR_DAAS_PRIVATE_KEY!,
  baseUrl: 'https://api.motor.com/v1'
});

// Step 1: Get years
const years = await motorClient.getYears();
console.log('Available years:', years.years);

// Step 2: User selects year -> get makes
const selectedYear = 2024;
const makes = await motorClient.getMakes(selectedYear);
console.log('Available makes:', makes.makes);

// Step 3: User selects make -> get models
const selectedMakeId = makes.makes[0].makeId; // e.g., Toyota
const models = await motorClient.getModels(selectedYear, selectedMakeId);
console.log('Available models:', models.models);

// Step 4: User selects model -> get engines
const selectedModelId = models.models[0].modelId; // e.g., Camry
const engines = await motorClient.getEngines(selectedYear, selectedMakeId, selectedModelId);
console.log('Available engines:', engines.engines);

// Step 5: User selects engine -> use baseVehicleId for diagnostics
const selectedEngine = engines.engines[0];
const baseVehicleId = selectedEngine.baseVehicleId;

// Now use baseVehicleId for all diagnostic queries!
const dtcResponse = await motorClient.getDiagnosticTroubleCodes(baseVehicleId, {
  dtcCode: 'P0420'
});
```

---

## Response Structures

### YearResponse
```typescript
interface YearResponse {
  years: number[];
}
```

### MakeResponse
```typescript
interface MakeResponse {
  makes: Array<{
    makeId: number;
    makeName: string;
  }>;
}
```

### ModelResponse
```typescript
interface ModelResponse {
  models: Array<{
    modelId: number;
    modelName: string;
  }>;
}
```

### EngineResponse
```typescript
interface EngineResponse {
  engines: Array<{
    engineId: number;
    engineName: string;
    baseVehicleId: number;  // ← Critical for subsequent queries
    liter?: string;
    cylinders?: string;
    blockType?: string;
    fuelType?: string;
    displacement?: string;
    engineVin?: string;
  }>;
}
```

### SubmodelResponse
```typescript
interface SubmodelResponse {
  submodels: Array<{
    submodelId: number;
    submodelName: string;
  }>;
}
```

---

## Caching

All YMME responses are cached for **7 days** (604,800 seconds):

- **Years**: Rarely change
- **Makes**: Rarely change
- **Models**: Rarely change
- **Engines**: Rarely change
- **Submodels**: Rarely change

This reduces API costs and improves performance for repeated queries.

---

## Building a Vehicle Selector UI

### React Example

```tsx
'use client';

import { useState, useEffect } from 'react';
import { MotorDaasClient } from '@/lib/integrations/motor-daas';

export function YMMEVehicleSelector() {
  const [years, setYears] = useState<number[]>([]);
  const [makes, setMakes] = useState<Array<{ makeId: number; makeName: string }>>([]);
  const [models, setModels] = useState<Array<{ modelId: number; modelName: string }>>([]);
  const [engines, setEngines] = useState<Array<{ engineId: number; engineName: string; baseVehicleId: number }>>([]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [selectedMakeId, setSelectedMakeId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedEngine, setSelectedEngine] = useState<any | null>(null);

  const motorClient = new MotorDaasClient({
    publicKey: process.env.NEXT_PUBLIC_MOTOR_DAAS_PUBLIC_KEY!,
    privateKey: process.env.NEXT_PUBLIC_MOTOR_DAAS_PRIVATE_KEY!,
    baseUrl: 'https://api.motor.com/v1'
  });

  // Load years on mount
  useEffect(() => {
    motorClient.getYears().then(res => setYears(res.years));
  }, []);

  // Load makes when year selected
  useEffect(() => {
    if (selectedYear) {
      motorClient.getMakes(selectedYear).then(res => setMakes(res.makes));
    }
  }, [selectedYear]);

  // Load models when make selected
  useEffect(() => {
    if (selectedYear && selectedMakeId) {
      motorClient.getModels(selectedYear, selectedMakeId).then(res => setModels(res.models));
    }
  }, [selectedYear, selectedMakeId]);

  // Load engines when model selected
  useEffect(() => {
    if (selectedYear && selectedMakeId && selectedModelId) {
      motorClient.getEngines(selectedYear, selectedMakeId, selectedModelId).then(res => setEngines(res.engines));
    }
  }, [selectedYear, selectedMakeId, selectedModelId]);

  return (
    <div className="space-y-4">
      {/* Year Selector */}
      <select onChange={(e) => setSelectedYear(Number(e.target.value))}>
        <option>Select Year</option>
        {years.map(year => (
          <option key={year} value={year}>{year}</option>
        ))}
      </select>

      {/* Make Selector */}
      {selectedYear && (
        <select onChange={(e) => setSelectedMakeId(Number(e.target.value))}>
          <option>Select Make</option>
          {makes.map(make => (
            <option key={make.makeId} value={make.makeId}>{make.makeName}</option>
          ))}
        </select>
      )}

      {/* Model Selector */}
      {selectedMakeId && (
        <select onChange={(e) => setSelectedModelId(Number(e.target.value))}>
          <option>Select Model</option>
          {models.map(model => (
            <option key={model.modelId} value={model.modelId}>{model.modelName}</option>
          ))}
        </select>
      )}

      {/* Engine Selector */}
      {selectedModelId && (
        <select onChange={(e) => {
          const engine = engines.find(eng => eng.engineId === Number(e.target.value));
          setSelectedEngine(engine);
        }}>
          <option>Select Engine</option>
          {engines.map(engine => (
            <option key={engine.engineId} value={engine.engineId}>
              {engine.engineName}
            </option>
          ))}
        </select>
      )}

      {/* Selected Vehicle Info */}
      {selectedEngine && (
        <div className="p-4 bg-gray-100 rounded">
          <h3>Selected Vehicle</h3>
          <p>Year: {selectedYear}</p>
          <p>Make: {makes.find(m => m.makeId === selectedMakeId)?.makeName}</p>
          <p>Model: {models.find(m => m.modelId === selectedModelId)?.modelName}</p>
          <p>Engine: {selectedEngine.engineName}</p>
          <p className="font-bold">Base Vehicle ID: {selectedEngine.baseVehicleId}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Using baseVehicleId for Diagnostics

Once you have the `baseVehicleId` from the engine selection, you can use it for all diagnostic queries:

```typescript
// After user selects engine
const baseVehicleId = selectedEngine.baseVehicleId;

// Look up DTCs
const dtcResponse = await motorClient.getDiagnosticTroubleCodes(baseVehicleId, {
  dtcCode: 'P0420'
});

// Get work times
const workTimes = await motorClient.getEstimatedWorkTimes(baseVehicleId, {
  searchTerm: 'spark plug replacement'
});

// Get recommended fluids
const fluids = await motorClient.getRecommendedFluids(
  baseVehicleId,
  selectedEngine.engineId
);

// Get specifications
const specs = await motorClient.getSpecifications(baseVehicleId);

// Get TSBs
const tsbs = await motorClient.getTechnicalServiceBulletins(baseVehicleId);
```

---

## Benefits Over VIN-Based Queries

| Feature | VIN-Based | YMME-Based |
|---------|-----------|------------|
| Requires VIN? | Yes | No |
| User selects vehicle details | No | Yes |
| Works for vehicles without VIN | No | Yes |
| Better UX for known vehicles | No | Yes |
| Cached responses | 24 hours | 7 days |
| Multiple engine options | No | Yes |

---

## API Endpoints

The MOTOR DaaS client uses these endpoints:

- `GET /Information/YMME/Years`
- `GET /Information/YMME/Makes?year={year}`
- `GET /Information/YMME/Models?year={year}&makeId={makeId}`
- `GET /Information/YMME/Engines?year={year}&makeId={makeId}&modelId={modelId}`
- `GET /Information/YMME/Submodels?year={year}&makeId={makeId}&modelId={modelId}`

All requests are authenticated with HMAC-SHA256 signatures.

---

## Error Handling

```typescript
try {
  const engines = await motorClient.getEngines(year, makeId, modelId);
  if (engines.engines.length === 0) {
    console.log('No engines found for this vehicle combination');
  }
} catch (error) {
  if (error.statusCode === 401) {
    console.error('Authentication failed');
  } else if (error.statusCode === 404) {
    console.error('Vehicle data not found');
  } else {
    console.error('API error:', error.message);
  }
}
```

---

## Next Steps

1. **Update Vehicle Selector UI** - Replace hardcoded vehicles with YMME cascade
2. **Add Loading States** - Show spinners during API calls
3. **Add Error Handling** - Display user-friendly error messages
4. **Persist Selection** - Save selected vehicle to local storage or database
5. **Add Search** - Allow users to search makes/models instead of dropdown

---

## Example Integration with Chat

```typescript
// src/app/chat/page.tsx
const [selectedVehicle, setSelectedVehicle] = useState<{
  year: number;
  make: string;
  model: string;
  engine: string;
  baseVehicleId: number;
  engineId: number;
} | null>(null);

// When user completes YMME selection
function handleEngineSelect(engine: any, year: number, makeName: string, modelName: string) {
  setSelectedVehicle({
    year,
    make: makeName,
    model: modelName,
    engine: engine.engineName,
    baseVehicleId: engine.baseVehicleId,
    engineId: engine.engineId
  });
}

// Pass to diagnostic panel
<AIDiagnosticsPanel
  baseVehicleId={selectedVehicle?.baseVehicleId}
  vehicleInfo={{
    year: selectedVehicle?.year,
    make: selectedVehicle?.make,
    model: selectedVehicle?.model,
    engine: selectedVehicle?.engine
  }}
/>
```

---

## Summary

The YMME query support enables:
- ✅ Vehicle selection without VIN
- ✅ Better user experience with cascading dropdowns
- ✅ Multiple engine options for same year/make/model
- ✅ Efficient caching (7 days)
- ✅ Same diagnostic capabilities as VIN-based queries

**Key Takeaway:** Once you have `baseVehicleId` from engine selection, you can use all existing diagnostic methods (DTCs, work times, fluids, specs, TSBs, etc.) exactly as before!
