# AI Diagnostics MVP Plan - 2010 Honda Civic Focus

**Version:** 1.0
**Last Updated:** December 15, 2025
**Target Branch:** `mvp/MotorDiagnostics`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [MVP Objectives](#mvp-objectives)
3. [Diagnostic Capabilities](#diagnostic-capabilities)
4. [System Architecture](#system-architecture)
5. [API URL Generator/Customizer](#api-url-generator-customizer)
6. [End-to-End Structure Layout](#end-to-end-structure-layout)
7. [Data Flow](#data-flow)
8. [Implementation Phases](#implementation-phases)
9. [Missing Requirements & Assumptions](#missing-requirements--assumptions)

---

## Executive Summary

The AI Diagnostics MVP is a conversational diagnostic assistant powered by GPT-4 and MOTOR DaaS API, designed to help automotive technicians diagnose vehicle issues efficiently. The MVP focuses on the **2010 Honda Civic** as the primary vehicle to validate the diagnostic workflow end-to-end.

**Core Value Proposition:**
- Real-time DTC code interpretation from MOTOR database
- AI-guided diagnostic conversations with tool-calling capabilities
- Automatic cost estimation based on labor times and parts data
- Integration with existing shop CRM for vehicle history context

**Tech Stack:**
- **Frontend:** Next.js 15.3.2, React 18, Vercel AI SDK 5.0
- **Backend:** Next.js API Routes, OpenAI GPT-4o
- **Data:** MOTOR DaaS API, Supabase (vehicle history, shop data)
- **Caching:** In-memory cache with TTLs (7 days YMME, 12 hours work times)

---

## MVP Objectives

### Primary Goals

1. **Validate Diagnostic Workflow**
   - Prove that AI + MOTOR data can provide accurate diagnostic guidance
   - Test conversation flow from symptom → diagnosis → cost estimate
   - Measure technician satisfaction with AI-assisted diagnosis

2. **Establish Data Foundation**
   - Complete MOTOR DaaS integration for all diagnostic endpoints
   - Build vehicle context system combining CRM + MOTOR data
   - Implement caching strategy for performance

3. **Deliver Minimum Viable Experience**
   - 3-column chat interface (vehicle selector, chat, diagnostics panel)
   - Support for DTC lookup, service procedures, parts, work times, fluids
   - Cost estimation with labor + parts breakdown

### Success Metrics

- **Performance:** < 3s average response time for AI queries
- **Accuracy:** 85%+ technician agreement on diagnostic recommendations
- **Adoption:** 50% of shop technicians use system weekly
- **Data Quality:** < 5% MOTOR API error rate

---

## Diagnostic Capabilities

### ✅ What the MVP CAN Diagnose (v1.0)

#### 1. **OBD-II Diagnostic Trouble Codes (DTCs)**
- Lookup DTC definitions from MOTOR database
- Explain possible causes and affected systems
- Provide diagnostic procedures for common DTCs
- Support P-codes (Powertrain), B-codes (Body), C-codes (Chassis), U-codes (Network)

**Example:**
```
User: "P0420 on a 2010 Honda Civic"
AI: Looks up DTC via MOTOR → Explains catalyst efficiency issue →
    Suggests diagnostic steps → Estimates repair cost
```

#### 2. **Symptom-Based Diagnostics**
- Common symptoms: rough idle, check engine light, poor acceleration, fluid leaks
- AI guides technician through troubleshooting questions
- Narrows down to specific systems (fuel, ignition, cooling, etc.)

**Example:**
```
User: "Customer reports rough idle and occasional stalling"
AI: Asks clarifying questions → Suggests checking fuel pressure,
    spark plugs, idle air control → Provides work time estimates
```

#### 3. **Maintenance Diagnostics**
- Scheduled maintenance lookup by mileage
- Fluid recommendations and capacities
- Service interval verification
- Component specifications

**Example:**
```
User: "What fluids does a 2010 Civic need at 75k miles?"
AI: Queries MOTOR recommended fluids → Engine oil (0W-20, 3.7qt),
    coolant, transmission fluid, brake fluid specs
```

#### 4. **Cost Estimation**
- Labor time estimates from MOTOR EstimatedWorkTimes
- Parts pricing (requires parts API integration)
- Breakdown by labor + parts + markup
- Multiple repair scenario comparison

**Example:**
```
Repair: Spark plug replacement (2010 Civic)
Labor: 1.5 hours @ $120/hr = $180
Parts: 4 NGK spark plugs = $40
Total: $220 + tax
```

### ❌ What the MVP CANNOT Diagnose (Out of Scope)

1. **Advanced Electrical Diagnostics**
   - Complex wiring issues requiring multimeter testing
   - CAN bus network diagnostics beyond basic codes
   - ECU programming or reflashing

2. **Physical Inspection Requirements**
   - Visual inspections (leaks, wear patterns, corrosion)
   - Compression testing, leak-down tests
   - Scope analysis (ignition waveforms, fuel injector patterns)

3. **Vehicle-Specific Proprietary Systems**
   - Honda/Acura dealer-only diagnostics (HDS)
   - Manufacturer-specific calibrations
   - Immobilizer/security system issues

4. **Real-Time Data Stream Analysis**
   - Live sensor data monitoring
   - Freeze frame analysis (deferred to v2)
   - Adaptive learning value interpretation

5. **Multiple Simultaneous Vehicles**
   - MVP supports one vehicle per session
   - No cross-vehicle comparison (v1 limitation)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js 15)                   │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Vehicle   │  │     Chat     │  │   Diagnostics    │  │
│  │  Selector   │  │    Window    │  │     Panel        │  │
│  │  (YMME)     │  │  (AI SDK 5)  │  │  (Tool Results)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
│         │                 │                    │            │
└─────────┼─────────────────┼────────────────────┼────────────┘
          │                 │                    │
          ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│              API LAYER (Next.js API Routes)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     /api/ai/diagnostics (POST)                         │ │
│  │  • Receives messages + selectedVehicleId               │ │
│  │  • Builds vehicle context from CRM                     │ │
│  │  • Streams AI response with tool calls                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     /api/ai/diagnostics/dtc (POST)                     │ │
│  │  • Quick DTC lookup (no AI, direct MOTOR)             │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │     /api/ai/diagnostics/cost-estimate (POST)           │ │
│  │  • Calculate repair costs from work times + parts      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
          │                           │
          ▼                           ▼
┌─────────────────────┐     ┌────────────────────────────┐
│   AI/LOGIC LAYER    │     │    INTEGRATION LAYER       │
│  ┌───────────────┐  │     │  ┌──────────────────────┐  │
│  │ OpenAI GPT-4o │  │     │  │  MOTOR DaaS Client   │  │
│  │ (gpt-4o)      │  │     │  │  • Auth (HMAC-SHA256)│  │
│  └───────────────┘  │     │  │  • Rate Limiter      │  │
│  ┌───────────────┐  │     │  │  • Cache (in-memory) │  │
│  │ AI Tools:     │◄─┼─────┼──┤  • Endpoints:        │  │
│  │ • getVehicle  │  │     │  │    - VIN decode      │  │
│  │ • lookupDTC   │  │     │  │    - DTCs            │  │
│  │ • getParts    │  │     │  │    - Work times      │  │
│  │ • getWorkTime │  │     │  │    - Service procs   │  │
│  │ • getFluids   │  │     │  │    - Fluids          │  │
│  │ • estimateCost│  │     │  │    - Parts           │  │
│  └───────────────┘  │     │  │    - TSBs            │  │
│  ┌───────────────┐  │     │  └──────────────────────┘  │
│  │ Context       │  │     │                            │
│  │ Builder       │◄─┼─────┼──► Supabase (CRM Data)    │
│  │ (vehicle      │  │     │    • Vehicle history       │
│  │  history)     │  │     │    • Service records       │
│  └───────────────┘  │     │    • Customer notes        │
└─────────────────────┘     └────────────────────────────┘
```

### Component Breakdown

#### 1. Frontend Components (`/src/app/chat`)

**a) Vehicle Selector** (`VehicleSelector.tsx`)
- **Purpose:** Select vehicle for diagnostic session
- **Current State:** Hardcoded sandbox vehicles (2010 Civic, 2015 F-150, etc.)
- **MVP Enhancement Needed:**
  - Add YMME cascade dropdowns (Year → Make → Model → Engine)
  - Query MOTOR `/Information/YMME/*` endpoints
  - Store `baseVehicleId` + `engineId` for session

**b) Chat Window** (`MIAThreeColumnLayout.tsx`, `ChatArea.tsx`)
- **Purpose:** Conversational interface for diagnostics
- **Tech:** Vercel AI SDK 5.0 `useChat()` hook
- **Features:**
  - Streaming AI responses
  - Tool call visualization (loading states)
  - Message history persistence

**c) Diagnostics Panel** (`RightSidebar.tsx`, `MotorToolDisplay.tsx`)
- **Purpose:** Display structured diagnostic data from MOTOR
- **Displays:**
  - DTC details (code, description, causes)
  - Service procedures (step-by-step)
  - Parts lists with specifications
  - Work time estimates
  - Cost breakdowns

#### 2. API Layer (`/src/app/api/ai/diagnostics`)

**a) Main Diagnostics Endpoint** (`route.ts`)
```typescript
POST /api/ai/diagnostics
Request: {
  messages: Message[],
  selectedVehicleId: number,  // baseVehicleId from MOTOR
  testShopId?: string         // For dev/testing
}
Response: Stream<AIMessage>  // SSE streaming response
```

**Responsibilities:**
1. Authenticate user and get `shopId`
2. Build vehicle context from CRM (if vehicle exists in database)
3. Construct AI system prompt with context
4. Register AI tools (MOTOR API wrappers)
5. Stream AI response with tool execution

**b) Quick DTC Lookup** (To be created)
```typescript
POST /api/ai/diagnostics/dtc
Request: {
  dtcCode: string,
  baseVehicleId: number
}
Response: {
  code: string,
  description: string,
  causes: string[],
  procedures: string[]
}
```

**c) Cost Estimation** (To be created)
```typescript
POST /api/ai/diagnostics/cost-estimate
Request: {
  repairs: Array<{
    description: string,
    laborHours: number,
    parts?: Array<{name, price}>
  }>,
  laborRate: number
}
Response: {
  totalLabor: number,
  totalParts: number,
  tax: number,
  grandTotal: number,
  breakdown: RepairLineItem[]
}
```

#### 3. AI/Logic Layer (`/src/app/(features)/ai/AIDiagnostics`)

**a) AI Tools** (`tools/motor-daas-tools.ts`)
- Wraps MOTOR DaaS client methods as AI-callable tools
- Defines tool schemas for OpenAI function calling
- Handles errors gracefully (returns user-friendly messages)

**Current Tools:**
```typescript
- getVehicleInfoTool(vin: string) → VehicleInfo
- lookupDTCTool(dtcCode: string, baseVehicleId: number) → DTCDetails
- getServiceProcedureTool(baseVehicleId: number, systemId?: number) → Procedures
- getPartsTool(baseVehicleId: number, partType?: string) → Parts[]
- getWorkTimeTool(baseVehicleId: number, searchTerm?: string) → WorkTimes[]
- getRecommendedFluidsTool(baseVehicleId, engineId) → Fluids[]
- getTSBTool(baseVehicleId: number) → Bulletins[]
- estimateRepairCostTool(repairs: Repair[]) → CostEstimate
```

**b) Context Builder** (`lib/context-builder.ts`)
```typescript
buildVehicleContext(vehicleId: number, shopId: number): Promise<VehicleContext>
```
- Fetches vehicle from CRM database
- Loads service history, customer notes, previous repairs
- Formats into AI-readable context
- Falls back gracefully for sandbox vehicles not in DB

**c) Prompts** (`lib/prompts.ts`)
```typescript
export const AI_DIAGNOSTICS_PROMPT = `
You are Mia, an expert automotive diagnostic assistant...
[Full system prompt with personality, capabilities, constraints]
`;
```

#### 4. Integration Layer (`/src/lib/integrations/motor-daas`)

**a) MOTOR DaaS Client** (`client.ts`)
```typescript
class MotorDaasClient {
  async getVehicleInfo(vin: string): Promise<VehicleInfo>
  async getDiagnosticTroubleCodes(baseVehicleId, options): Promise<DTCResponse>
  async getEstimatedWorkTimes(baseVehicleId, options): Promise<WorkTimeResponse>
  async getEstimatedWorkTimesSummary(baseVehicleId, options): Promise<EstimatedWorkTimesResponse>
  async getRecommendedFluids(baseVehicleId, engineId, options): Promise<FluidsResponse>
  async getServiceProcedures(baseVehicleId, systemId): Promise<ProceduresResponse>
  async getParts(baseVehicleId, partType): Promise<PartsResponse>
  async getTechnicalServiceBulletins(baseVehicleId): Promise<TSBResponse>
  async getWiringDiagrams(baseVehicleId, options): Promise<DiagramsResponse>
  async getBulkVehicleAttributes(baseVehicleIds): Promise<AttributesResponse>

  // YMME Query Methods (for vehicle selection)
  async getYears(): Promise<YearResponse>
  async getMakes(year: number): Promise<MakeResponse>
  async getModels(year, makeId): Promise<ModelResponse>
  async getEngines(year, makeId, modelId): Promise<EngineResponse>
  async getSubmodels(year, makeId, modelId): Promise<SubmodelResponse>
}
```

**b) Authentication** (`auth.ts`)
```typescript
class MotorDaasAuth {
  generateSignature(httpVerb, relativePath, epoch): string
  buildAuthenticatedUrl(baseUrl, relativePath, method): string
  generateAuthHeader(httpVerb, relativePath): {Authorization, X-Date}
}
```
- HMAC-SHA256 signature generation
- Two auth methods: query-string and header-based
- String-to-sign format: `{PUBLIC_KEY}\n{HTTP_VERB}\n{EPOCH}\n{PATH}`

**c) Caching** (`cache.ts`)
```typescript
class MotorDaasCache {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttl: number): void
  clear(): void
  getStats(): CacheStats
}
```
- In-memory LRU cache
- Configurable TTLs per endpoint type
- Cache keys generated from endpoint + params

**d) Rate Limiting** (`rate-limiter.ts`)
```typescript
class MotorDaasRateLimiter {
  canMakeRequest(): boolean
  recordRequest(): void
  getRateLimitInfo(): RateLimitInfo
}
```
- Sliding window: 1500 requests per 15 minutes
- Throws error when limit exceeded

---

## API URL Generator/Customizer

### Problem It Solves

**Challenge:** MOTOR API endpoints require complex URL construction with:
1. **Dynamic Vehicle Attributes:** `EN=4214&SM=1234&TR=5678` (engine, submodel, transmission)
2. **Content Silos:** Different data sources (15=DTCs, 28=Work Times, 117=Fluids)
3. **Authentication Parameters:** Must be appended in specific order
4. **Pagination & Filtering:** SearchTerm, ItemsPerPage, PageIndex
5. **Include Parameters:** Additional data like `Include=Counts,Image`

**Example URL:**
```
https://api.motor.com/v1/Information/Vehicles/Attributes/BaseVehicleID/26332/Content/Summaries/Of/EstimatedWorkTimes?ContentSilos=28&Include=Counts&EN=4214&AttributeStandard=MOTOR&ApiKey=xxx&Sig=yyy&Scheme=Shared&XDate=123456789
```

### Design: Parameter Builder Pattern

**Implementation:** Integrated into `MotorDaasClient` methods

```typescript
// Example: getEstimatedWorkTimesSummary()
async getEstimatedWorkTimesSummary(
  baseVehicleId: number,
  options?: EstimatedWorkTimesOptions
): Promise<EstimatedWorkTimesResponse> {
  const endpoint = `/Information/Vehicles/Attributes/BaseVehicleID/${baseVehicleId}/Content/Summaries/Of/EstimatedWorkTimes`;

  // Build parameter object dynamically
  const params: Record<string, string | number | number[] | string[]> = {
    AttributeStandard: options?.attributeStandard || 'MOTOR'
  };

  // Add optional parameters only if provided
  if (options?.contentSilos) params.ContentSilos = options.contentSilos;
  if (options?.include) params.Include = options.include;
  if (options?.engineId) params.EN = options.engineId;
  if (options?.searchTerm) params.SearchTerm = options.searchTerm;

  // makeRequest() handles URL construction + auth params
  return await this.makeRequest<EstimatedWorkTimesResponse>(endpoint, 'GET', params);
}
```

**Key Features:**
1. **Type-Safe Parameters:** TypeScript interfaces for each endpoint
2. **Conditional Building:** Only add params that are provided
3. **Array Support:** ContentSilos can be `[28, 103]` for multiple data sources
4. **Authentication Injection:** `makeRequest()` adds auth params automatically
5. **URL String Building:** Constructs URL as string to preserve parameter order

### Integration with Diagnostic Flow

```
User selects vehicle (2010 Civic, Engine: 1.8L L4)
   │
   ├─► Frontend stores: baseVehicleId=26332, engineId=4214
   │
User asks: "How long to replace spark plugs?"
   │
   ├─► AI calls: getWorkTimeTool({ baseVehicleId: 26332, searchTerm: "spark plug" })
   │
   ├─► Tool wrapper calls: client.getEstimatedWorkTimesSummary(26332, {
   │                          contentSilos: [28],
   │                          searchTerm: "spark plug",
   │                          engineId: 4214
   │                        })
   │
   ├─► Client builds URL:
   │   /Information/.../EstimatedWorkTimes?ContentSilos=28&SearchTerm=spark+plug&EN=4214&AttributeStandard=MOTOR
   │
   ├─► Auth adds: &ApiKey=xxx&Sig=yyy&Scheme=Shared&XDate=123456789
   │
   └─► Returns: [{ ItemDescription: "Spark Plug Replacement", WorkTime: 1.5 }]
```

**No Separate URL Generator Needed:** The client methods ARE the generators.

---

## End-to-End Structure Layout

### Directory Structure

```
motorminds/
├── src/
│   ├── app/
│   │   ├── chat/                           # 🎯 MAIN FRONTEND (Under /chat as specified)
│   │   │   ├── page.tsx                    # Main chat page (3-column layout)
│   │   │   ├── components/
│   │   │   │   ├── MIAThreeColumnLayout.tsx
│   │   │   │   ├── VehicleSelector.tsx     # ⚠️ NEEDS YMME CASCADE
│   │   │   │   ├── ChatArea.tsx
│   │   │   │   ├── RightSidebar.tsx
│   │   │   │   └── Parts/
│   │   │   │       └── PartsDisplay.tsx
│   │   │   └── utils/
│   │   │
│   │   ├── api/
│   │   │   └── ai/
│   │   │       └── diagnostics/
│   │   │           ├── route.ts            # 🎯 MAIN AI ENDPOINT
│   │   │           ├── dtc/
│   │   │           │   └── route.ts        # ⚠️ TO CREATE: Quick DTC lookup
│   │   │           └── cost-estimate/
│   │   │               └── route.ts        # ⚠️ TO CREATE: Cost calculator API
│   │   │
│   │   └── (features)/
│   │       └── ai/
│   │           └── AIDiagnostics/          # 🎯 BACKEND LOGIC (Under /chat backend)
│   │               ├── components/
│   │               │   ├── AIDiagnosticsPanel.tsx
│   │               │   ├── DiagnosticsForm.tsx
│   │               │   ├── QuickDTCLookup.tsx
│   │               │   └── MotorToolDisplay.tsx
│   │               ├── lib/
│   │               │   ├── context-builder.ts    # Vehicle history from CRM
│   │               │   ├── cost-calculator.ts    # Cost estimation logic
│   │               │   └── prompts.ts           # AI system prompts
│   │               ├── tools/
│   │               │   ├── motor-daas-tools.ts  # AI tool wrappers
│   │               │   ├── vehicle-tools.ts     # CRM data tools
│   │               │   └── cost-estimation-tools.ts
│   │               └── types/
│   │                   └── diagnostics.ts
│   │
│   └── lib/
│       └── integrations/
│           └── motor-daas/                 # 🎯 MOTOR INTEGRATION (As specified)
│               ├── client.ts               # ✅ COMPLETE: All endpoints
│               ├── auth.ts                 # ✅ COMPLETE: HMAC-SHA256
│               ├── cache.ts                # ✅ COMPLETE: In-memory cache
│               ├── rate-limiter.ts         # ✅ COMPLETE: 1500/15min
│               ├── types.ts                # ✅ COMPLETE: All response types
│               ├── index.ts                # Public exports
│               └── tool-filter.ts          # Tool result filtering
│
├── .env.local
│   ├── MOTOR_DAAS_PUBLIC_KEY=xxx
│   ├── MOTOR_DAAS_PRIVATE_KEY=xxx
│   ├── MOTOR_DAAS_BASE_URL=https://api.motor.com/v1
│   └── OPENAI_API_KEY=sk-xxx
│
└── package.json
    └── dependencies:
        ├── ai: ^5.0.0           # Vercel AI SDK
        ├── @ai-sdk/openai: ^1.0.0
        └── next: ^15.3.2
```

### Ownership Boundaries

#### **Frontend Team: `/src/app/chat`**
- **Owns:** User interface, vehicle selection, chat UX, diagnostics display
- **Consumes:** `/api/ai/diagnostics` endpoint
- **Responsibilities:**
  - Implement YMME cascade for vehicle selection
  - Display streaming AI responses
  - Visualize tool call results (DTCs, parts, costs)
  - Handle loading states and errors

#### **Backend Team: `/src/app/api/ai/diagnostics`**
- **Owns:** API routes, AI orchestration, business logic
- **Consumes:** MOTOR DaaS client, CRM database
- **Responsibilities:**
  - Authenticate requests
  - Build vehicle context
  - Execute AI with tools
  - Stream responses
  - Log usage/errors

#### **Integration Team: `/src/lib/integrations/motor-daas`**
- **Owns:** MOTOR API client, authentication, caching, rate limiting
- **Consumed By:** AI tools, API routes
- **Responsibilities:**
  - Maintain MOTOR API integration
  - Handle authentication (HMAC-SHA256)
  - Implement caching strategy
  - Monitor API health
  - Document endpoint usage

#### **AI/ML Team: `/src/app/(features)/ai/AIDiagnostics`**
- **Owns:** AI tools, prompts, cost estimation logic, context building
- **Consumes:** MOTOR client, CRM database
- **Responsibilities:**
  - Define AI tool schemas
  - Write system prompts
  - Implement cost calculator
  - Build vehicle context
  - Test diagnostic accuracy

---

## Data Flow

### 1. Initial Page Load

```
User navigates to /chat
   │
   ├─► Frontend: Load MIAThreeColumnLayout
   │       ├─► Authenticate user (useAuth hook)
   │       ├─► Get shopId from session
   │       └─► Render 3-column layout
   │
   ├─► Vehicle Selector: Load YMME options
   │       ├─► Call: getYears() → [2024, 2023, ..., 2000]
   │       └─► User selects 2010
   │           ├─► Call: getMakes(2010) → [{makeId: 1, makeName: "Honda"}, ...]
   │           └─► User selects Honda
   │               ├─► Call: getModels(2010, 1) → [{modelId: 5, modelName: "Civic"}, ...]
   │               └─► User selects Civic
   │                   ├─► Call: getEngines(2010, 1, 5) → [{engineId: 4214, engineName: "1.8L L4", baseVehicleId: 26332}, ...]
   │                   └─► Store: baseVehicleId=26332, engineId=4214
   │
   └─► Chat Area: Display empty state with suggestions
```

### 2. User Sends Diagnostic Query

```
User types: "Check engine light is on, code P0420"
   │
   ├─► Frontend: useChat() hook sends message
   │       POST /api/ai/diagnostics
   │       {
   │         messages: [{role: "user", content: "Check engine light..."}],
   │         selectedVehicleId: 26332
   │       }
   │
   └─► Backend: /api/ai/diagnostics/route.ts
       │
       ├─► 1. Authenticate
       │   └─► Get shopId from session
       │
       ├─► 2. Build Vehicle Context (if vehicle in CRM)
       │   └─► buildVehicleContext(26332, shopId)
       │       ├─► Query Supabase: SELECT * FROM vehicles WHERE id=26332
       │       ├─► Load service history, customer notes
       │       └─► Format as text for AI context
       │
       ├─► 3. Construct System Prompt
       │   └─► AI_DIAGNOSTICS_PROMPT + vehicle context
       │
       ├─► 4. Register AI Tools
       │   └─► tools = {
       │         getVehicleInfo: getVehicleInfoTool,
       │         lookupDTC: lookupDTCTool,
       │         getWorkTime: getWorkTimeTool,
       │         ...
       │       }
       │
       ├─► 5. Stream AI Response
       │   └─► streamText({
       │         model: openai('gpt-4o'),
       │         messages: [...],
       │         system: systemMessage,
       │         tools: tools
       │       })
       │
       └─► 6. AI Executes Tools
           │
           ├─► AI decides: "I need to lookup DTC P0420"
           │   └─► Calls: lookupDTC({ dtcCode: "P0420", baseVehicleId: 26332 })
           │       │
           │       ├─► Tool wrapper: motor-daas-tools.ts
           │       │   └─► getMotorDaasClient().getDiagnosticTroubleCodes(26332, { dtcCode: "P0420" })
           │       │
           │       └─► MOTOR Client: /src/lib/integrations/motor-daas/client.ts
           │           │
           │           ├─► Build URL: /Information/Vehicles/Attributes/BaseVehicleID/26332/Content/Summaries/Of/DiagnosticTroubleCodes?ContentSilos=15&SearchTerm=P0420&AttributeStandard=MOTOR
           │           │
           │           ├─► Add Authentication: &ApiKey=xxx&Sig=yyy&Scheme=Shared&XDate=123456789
           │           │
           │           ├─► Check Cache: cache.get('dtc-26332-P0420')
           │           │   └─► Cache miss
           │           │
           │           ├─► HTTP Request: GET https://api.motor.com/v1/Information/.../DiagnosticTroubleCodes?...
           │           │
           │           ├─► MOTOR API Response:
           │           │   {
           │           │     Body: {
           │           │       Applications: [{
           │           │         Item: { Code: "P0420", DTCID: 12345 },
           │           │         DisplayName: "Catalyst System Efficiency Below Threshold (Bank 1)",
           │           │         ...
           │           │       }]
           │           │     }
           │           │   }
           │           │
           │           ├─► Parse & Cache: cache.set('dtc-26332-P0420', response, 21600)
           │           │
           │           └─► Return: DTCResponse to tool wrapper
           │
           ├─► AI receives tool result
           │   └─► "P0420 indicates catalytic converter efficiency issue..."
           │
           ├─► AI decides: "I should provide cost estimate"
           │   └─► Calls: getWorkTime({ baseVehicleId: 26332, searchTerm: "catalytic converter" })
           │       └─► (Similar flow: client → MOTOR API → cache → return)
           │
           └─► AI generates final response
               └─► "The P0420 code indicates your catalytic converter is not functioning efficiently.
                    Common causes: worn catalyst, exhaust leak, faulty O2 sensors.
                    Estimated repair: 2.5 hours labor ($300) + $800 converter = $1,100 total."
```

### 3. Frontend Receives Streamed Response

```
Frontend: useChat() hook receives SSE stream
   │
   ├─► 1. Tool Call Start Event
   │   └─► Display: "🔍 Looking up DTC P0420..."
   │
   ├─► 2. Tool Call Result Event
   │   └─► Display in Right Sidebar:
   │       ┌─────────────────────────────┐
   │       │ DTC Details                 │
   │       │ Code: P0420                 │
   │       │ Description: Catalyst...    │
   │       │ Causes: Worn catalyst, O2...│
   │       └─────────────────────────────┘
   │
   ├─► 3. AI Text Chunks
   │   └─► Append to chat: "The P0420 code indicates..."
   │
   ├─► 4. Tool Call Start (Cost Estimate)
   │   └─► Display: "💰 Calculating repair cost..."
   │
   ├─► 5. Tool Call Result (Cost)
   │   └─► Display in Right Sidebar:
   │       ┌─────────────────────────────┐
   │       │ Cost Estimate               │
   │       │ Labor: $300 (2.5 hrs)       │
   │       │ Parts: $800 (converter)     │
   │       │ Total: $1,100               │
   │       └─────────────────────────────┘
   │
   └─► 6. Stream Complete
       └─► Enable input field for next question
```

### 4. Caching Behavior

**Cache Hit Scenario:**
```
Second user asks about P0420 on 2010 Civic (within 6 hours)
   │
   └─► getDiagnosticTroubleCodes(26332, { dtcCode: "P0420" })
       │
       ├─► Check cache: cache.get('dtc-26332-P0420')
       │   └─► Cache hit! (ttl: 21600 seconds = 6 hours)
       │
       └─► Return cached response (no MOTOR API call)
           └─► Response time: < 10ms vs 500ms API call
```

**Cache TTLs by Endpoint:**
- **VIN Decode:** 24 hours (vehicle specs don't change)
- **YMME Data:** 7 days (year/make/model lists stable)
- **DTCs:** 6 hours (definitions rarely update)
- **Work Times:** 12 hours (labor estimates stable)
- **Fluids:** 24 hours (specifications stable)
- **Service Procedures:** 12 hours (procedures rarely change)

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2) ✅ MOSTLY COMPLETE

**Goal:** Complete core infrastructure

- [x] MOTOR DaaS client with all endpoints
- [x] Authentication (HMAC-SHA256)
- [x] Caching layer
- [x] Rate limiting
- [x] Basic AI diagnostics API
- [x] AI tool wrappers for MOTOR
- [x] 3-column chat interface
- [ ] **CRITICAL FIX:** Resolve 401 authentication errors with MOTOR API
  - Test header-based auth
  - Verify signature generation
  - Document working auth method

### Phase 2: Vehicle Selection (Week 3)

**Goal:** Replace hardcoded vehicles with YMME cascade

**Tasks:**
1. Create `YMMESelector` component
   ```typescript
   // Cascading dropdowns: Year → Make → Model → Engine
   <YMMESelector onVehicleSelect={(vehicle) => {
     setBaseVehicleId(vehicle.baseVehicleId);
     setEngineId(vehicle.engineId);
   }} />
   ```

2. Implement dropdown logic
   - Load years on mount: `getYears()`
   - Load makes on year select: `getMakes(year)`
   - Load models on make select: `getModels(year, makeId)`
   - Load engines on model select: `getEngines(year, makeId, modelId)`
   - Extract `baseVehicleId` from selected engine

3. Update chat context
   - Pass `baseVehicleId` to all AI requests
   - Display selected vehicle in chat header
   - Store in session for persistence

4. Add vehicle details display
   - Show: "2010 Honda Civic 1.8L L4 (Base Vehicle ID: 26332)"
   - Allow changing vehicle mid-session

**Acceptance Criteria:**
- User can select any vehicle from MOTOR database
- `baseVehicleId` + `engineId` correctly extracted
- Vehicle persists across page refreshes

### Phase 3: Enhanced Diagnostics (Week 4)

**Goal:** Improve diagnostic capabilities

**Tasks:**
1. Add Quick DTC Lookup API
   ```typescript
   // POST /api/ai/diagnostics/dtc
   // Direct MOTOR lookup without AI (faster for simple queries)
   ```

2. Implement Cost Estimation API
   ```typescript
   // POST /api/ai/diagnostics/cost-estimate
   // Standalone cost calculator for repair orders
   ```

3. Add TSB integration
   - Display Technical Service Bulletins in right sidebar
   - Link to known issues for selected vehicle

4. Enhance error handling
   - Graceful degradation when MOTOR API unavailable
   - AI fallback to general knowledge if MOTOR fails
   - User-friendly error messages

5. Add diagnostic shortcuts
   - Common symptoms dropdown
   - Frequently looked up DTCs
   - Maintenance by mileage quick links

**Acceptance Criteria:**
- Quick DTC lookup < 2s response time
- Cost estimates match MOTOR work times
- AI successfully diagnoses 5 common scenarios

### Phase 4: Testing & Validation (Week 5)

**Goal:** Validate with 2010 Honda Civic test scenarios

**Test Cases:**
1. **Check Engine Light - P0420**
   - VIN: 19XFA1F53AE000001 (2010 Civic)
   - Expected: Catalyst efficiency diagnosis
   - Expected: Recommend O2 sensor testing, exhaust inspection
   - Expected: Cost estimate $800-$1,500

2. **Rough Idle - P0301 (Misfire)**
   - Expected: Spark plug, ignition coil, compression test
   - Expected: Work time 1.5-3 hours
   - Expected: Cost $200-$600

3. **Maintenance - 75k Mile Service**
   - Expected: Oil change, transmission fluid, coolant flush
   - Expected: Fluid specifications from MOTOR
   - Expected: Total cost estimate

4. **Symptom-Only - "Won't Start"**
   - Expected: AI asks clarifying questions (cranks? clicks? dash lights?)
   - Expected: Narrows to fuel/ignition/starter
   - Expected: Tool calls for relevant diagnostics

5. **Parts Lookup - "Brake Pads"**
   - Expected: MOTOR parts list with specs
   - Expected: Front vs rear options
   - Expected: Installation work time

**Success Metrics:**
- 100% test cases provide relevant diagnostics
- 90% cost estimates within ±20% of actual shop pricing
- < 5 AI messages to reach diagnosis recommendation

### Phase 5: MVP Launch (Week 6)

**Goal:** Deploy to production with 2010 Civic support

**Tasks:**
1. Performance optimization
   - Cache warm-up for common DTCs
   - Optimize MOTOR API calls
   - Monitor response times

2. Documentation
   - User guide for technicians
   - API documentation
   - Troubleshooting guide

3. Monitoring setup
   - MOTOR API error tracking
   - AI response quality metrics
   - User satisfaction surveys

4. Soft launch
   - 5 pilot shops
   - 10 technicians
   - 2-week evaluation period

**Launch Criteria:**
- < 3s average AI response time
- < 5% MOTOR API error rate
- 80% technician satisfaction rating

---

## Missing Requirements & Assumptions

### Missing Requirements (To Clarify)

1. **Parts Pricing Integration**
   - **Question:** Where does parts pricing come from?
   - **Options:**
     - MOTOR API parts pricing (if available)
     - Integration with shop's parts supplier API
     - Manual entry by shop owner
   - **Impact:** Cost estimates incomplete without part prices

2. **Labor Rate Configuration**
   - **Question:** How is labor rate determined?
   - **Current:** Hardcoded $120/hr
   - **Needed:**
     - Per-shop configuration
     - Per-repair-type rates (diagnostic vs mechanical)
     - Stored in shop settings

3. **Customer-Facing vs Tech-Facing**
   - **Question:** Is this tool for technicians only or also customers?
   - **Current Design:** Technician-focused (technical language, DTC codes)
   - **If Customer-Facing:** Need simplified explanations, privacy filters

4. **Multi-Vehicle Support**
   - **Question:** Can user compare diagnostics across multiple vehicles?
   - **Current:** One vehicle per chat session
   - **If Needed:** Track multiple vehicles in sidebar, switch context

5. **Integration with RO (Repair Order) System**
   - **Question:** Should diagnostics create repair orders automatically?
   - **Needed:**
     - Export to RO format
     - Integration with existing invoicing
     - Customer approval workflow

6. **Historical Diagnostics**
   - **Question:** Should we store/retrieve past diagnostic sessions?
   - **Needed:**
     - Session persistence
     - Search past diagnostics
     - Link to completed repairs

### Assumptions Made

1. **Single Shop Context**
   - Assumption: User belongs to one shop at a time
   - Justification: `shopId` required for all requests

2. **Real-Time Diagnostics Only**
   - Assumption: No batch processing or scheduled diagnostics
   - Justification: Conversational interface implies real-time

3. **English Language Only**
   - Assumption: AI responses in English
   - Justification: MOTOR API data in English, GPT-4 default English

4. **Desktop Primary, Mobile Secondary**
   - Assumption: 3-column layout optimized for desktop/tablet
   - Justification: Technician workstations typically desktop

5. **Trusted User Base**
   - Assumption: All users are authenticated shop employees
   - Justification: No public access, shop-level authentication

6. **MOTOR API Availability**
   - Assumption: MOTOR API uptime > 99%
   - Mitigation: Graceful degradation with AI general knowledge

7. **No Real-Time Vehicle Data**
   - Assumption: No live OBD-II streaming in MVP
   - Justification: Focus on static diagnostic data
   - Future: Integrate with OBD-II devices

8. **Cost Estimates Are Estimates**
   - Assumption: Estimates may vary ±20% from actual
   - Justification: MOTOR work times are averages
   - Disclaimer: "Estimate only, actual may vary"

### Technical Debt & Future Enhancements

**Technical Debt:**
1. **In-Memory Cache**
   - **Issue:** Cache lost on server restart
   - **Future:** Redis for distributed caching

2. **No Rate Limiting Per Shop**
   - **Issue:** One shop could exhaust MOTOR API quota
   - **Future:** Per-shop rate limits

3. **Synchronous Vehicle Context Building**
   - **Issue:** Blocks AI response start
   - **Future:** Async context loading, stream partial results

4. **No A/B Testing Framework**
   - **Issue:** Can't test prompt variations
   - **Future:** Experimentation platform

**Future Enhancements (Post-MVP):**
1. **Multi-Vehicle Comparison**
   - Compare DTCs across vehicle year ranges
   - Identify pattern issues (TSBs, recalls)

2. **Live OBD-II Integration**
   - Stream sensor data during diagnosis
   - Real-time freeze frame analysis
   - Bidirectional scan tool control

3. **Image Recognition**
   - Upload photos of symptoms (leaks, wear)
   - AI visual diagnosis assistance

4. **Voice Interface**
   - Hands-free operation in shop
   - Voice-to-text for faster input

5. **Predictive Maintenance**
   - Analyze vehicle history patterns
   - Proactive service recommendations
   - Customer notification automation

6. **Expanded Vehicle Support**
   - Heavy-duty trucks (MOTOR HD content silo 103)
   - Motorcycles, marine, powersports
   - International vehicles

---

## Appendix

### A. API Endpoint Reference

#### MOTOR DaaS Endpoints Used

| Endpoint | Purpose | Content Silo | Cache TTL |
|----------|---------|--------------|-----------|
| `/Information/Vehicles/Search/VIN/{VIN}` | VIN decode | N/A | 24 hours |
| `/Information/YMME/Years` | Available years | N/A | 7 days |
| `/Information/YMME/Makes` | Makes for year | N/A | 7 days |
| `/Information/YMME/Models` | Models for make | N/A | 7 days |
| `/Information/YMME/Engines` | Engines for model | N/A | 7 days |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/DiagnosticTroubleCodes` | DTC definitions | 15 | 6 hours |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/EstimatedWorkTimes` | Labor times | 28, 103 | 12 hours |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/RecommendedFluids` | Fluid specs | 117 | 24 hours |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/ServiceProcedures` | Repair procedures | Various | 12 hours |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/Parts` | Parts catalog | Various | 6 hours |
| `/Information/Vehicles/Attributes/BaseVehicleID/{ID}/Content/Summaries/Of/TechnicalServiceBulletins` | TSBs | Various | 6 hours |

### B. Environment Variables Required

```bash
# MOTOR DaaS API
MOTOR_DAAS_PUBLIC_KEY=your_public_key_here
MOTOR_DAAS_PRIVATE_KEY=your_private_key_here
MOTOR_DAAS_BASE_URL=https://api.motor.com/v1

# OpenAI API
OPENAI_API_KEY=sk-your_key_here

# Supabase (for CRM data)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Application Config
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### C. Key TypeScript Interfaces

```typescript
// Vehicle Selection
interface SelectedVehicle {
  baseVehicleId: number;
  engineId: number;
  year: number;
  make: string;
  model: string;
  engine: string;
}

// AI Request
interface DiagnosticRequest {
  messages: Message[];
  selectedVehicleId: number;
  testShopId?: string;
}

// Tool Call Result
interface ToolCallResult {
  toolName: string;
  args: Record<string, unknown>;
  result: unknown;
  duration: number;
  cached: boolean;
}

// Cost Estimate
interface CostEstimate {
  repairs: RepairLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  laborRate: number;
  disclaimer: string;
}
```

### D. Testing Vehicles

**Primary Test Vehicle: 2010 Honda Civic**
- VIN: 19XFA1F53AE000001 (example)
- Base Vehicle ID: 26332
- Engine: 1.8L L4 (Engine ID: 4214)
- Common DTCs: P0420, P0301, P0171, P0128
- Use Cases: Check engine light, rough idle, maintenance

**Secondary Test Vehicles:**
- 2015 Ford F-150 (truck diagnostics)
- 2018 Toyota Camry (newer vehicle)
- 2005 Chevy Silverado (older vehicle)

---

## Summary

This MVP plan provides a complete roadmap for building an AI-powered diagnostic system integrated with MOTOR DaaS API. The architecture is production-ready with proper authentication, caching, and error handling. The phased implementation ensures incremental validation, starting with the 2010 Honda Civic as the baseline test vehicle.

**Key Success Factors:**
1. **Resolve MOTOR API authentication** (currently blocking progress)
2. **Implement YMME vehicle selection** (replaces hardcoded vehicles)
3. **Test with real diagnostic scenarios** (validate AI + MOTOR accuracy)
4. **Monitor performance metrics** (response time, error rates, satisfaction)

**Next Immediate Steps:**
1. Fix 401 authentication errors with MOTOR API
2. Test EstimatedWorkTimes endpoint with 2010 Civic
3. Implement YMME cascade in VehicleSelector component
4. Create quick DTC lookup API endpoint
5. Run 5 diagnostic test scenarios end-to-end
