# MVP Plan: AI Diagnostics Chat with MOTOR DaaS Integration

## Executive Summary

Enhance the existing MIA (MotorMinds Intelligence Assistant) diagnostic chat system by integrating MOTOR Data as a Service (DaaS) API to provide professional-grade automotive diagnostics with real VIN decoding, OEM-accurate DTC definitions, repair procedures, and technical service bulletins.

## Current State Analysis

### Existing Assets
- ✅ **MIA Diagnostic Chat**: Production-ready chat interface at `/src/app/mia/`
- ✅ **Perplexity AI Integration**: Powers general automotive diagnostics
- ✅ **OBD Data System**: `vehicle_obd_data` table tracks DTCs and metrics
- ✅ **Session Management**: Persistent conversations with vehicle context
- ✅ **Database Schema**: `mia_sessions`, `mia_messages` tables ready
- ✅ **Vehicle Context**: VIN, year, make, model support in chat

### Gap Analysis
- ❌ No professional-grade DTC definitions (currently web-scraped via Perplexity)
- ❌ No VIN decoding for automatic vehicle identification
- ❌ No OEM Technical Service Bulletins (TSBs)
- ❌ No labor time estimates for repairs
- ❌ No standardized repair procedures

## MOTOR DaaS Value Proposition

MOTOR DaaS provides:
1. **VIN Decoder**: Instant vehicle specs from 17-digit VIN
2. **DTC Library**: 50,000+ OEM-accurate trouble code definitions
3. **Repair Procedures**: Step-by-step OEM repair instructions
4. **TSB Database**: Manufacturer technical service bulletins
5. **Labor Times**: Industry-standard repair time estimates
6. **Parts Diagrams**: OEM parts illustrations and part numbers

---

## MVP Scope

### Phase 1: Core Integration (Week 1-2)

#### 1.1 MOTOR DaaS API Setup
**Files to Create:**
- `src/lib/integrations/motor-daas/client.ts` - API client wrapper
- `src/lib/integrations/motor-daas/types.ts` - TypeScript definitions
- `src/lib/integrations/motor-daas/config.ts` - API configuration

**Tasks:**
- [ ] Sign up for MOTOR DaaS API account (https://www.motor.com/)
- [ ] Add `MOTOR_DAAS_API_KEY` to environment variables
- [ ] Implement API client with methods:
  - `decodeVIN(vin: string)`
  - `getDTCDefinition(code: string, vin?: string)`
  - `getRepairProcedures(dtc: string, vin: string)`
  - `getTSBs(vin: string)`
  - `getLaborTimes(operation: string, vin: string)`

**Example Implementation:**
```typescript
// src/lib/integrations/motor-daas/client.ts
export class MotorDaasClient {
  async decodeVIN(vin: string) {
    const response = await fetch(`${MOTOR_API_BASE}/vin/${vin}`, {
      headers: { 'Authorization': `Bearer ${process.env.MOTOR_DAAS_API_KEY}` }
    });
    return response.json();
  }

  async getDTCDefinition(code: string, vin?: string) {
    const params = new URLSearchParams({ code, ...(vin && { vin }) });
    return fetch(`${MOTOR_API_BASE}/dtc?${params}`).then(r => r.json());
  }
}
```

#### 1.2 Database Schema Enhancements
**Migration File:** `migrations/add_motor_daas_fields.sql`

**Tables to Modify:**
```sql
-- Add VIN decoding cache
ALTER TABLE customer_vehicles
ADD COLUMN motor_vehicle_data JSONB,
ADD COLUMN vin_decoded_at TIMESTAMPTZ,
ADD COLUMN engine_code VARCHAR(50),
ADD COLUMN transmission_type VARCHAR(100);

-- Enhance OBD data with MOTOR definitions
ALTER TABLE vehicle_obd_data
ADD COLUMN motor_dtc_definition JSONB,
ADD COLUMN motor_repair_procedures JSONB,
ADD COLUMN motor_tsbs JSONB[];

-- Create cache table for MOTOR API responses
CREATE TABLE motor_daas_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type VARCHAR(50) NOT NULL, -- 'vin', 'dtc', 'tsb', 'labor'
  request_key VARCHAR(255) NOT NULL, -- VIN or DTC code
  response_data JSONB NOT NULL,
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  UNIQUE(request_type, request_key)
);

CREATE INDEX idx_motor_cache_expiry ON motor_daas_cache(expires_at);
```

**Tasks:**
- [ ] Create migration file
- [ ] Test migration on local database
- [ ] Document new fields in schema docs

#### 1.3 Enhanced Diagnostic API Endpoint
**File:** `src/app/api/mia-diagnostics/route.ts`

**Enhancements:**
1. **VIN Auto-Decode**: When VIN provided, fetch MOTOR data before diagnosis
2. **DTC Enrichment**: Add MOTOR definitions to any DTC codes in conversation
3. **Hybrid AI**: Combine Perplexity reasoning + MOTOR data

**Updated Flow:**
```typescript
export async function POST(request: Request) {
  const { messages, sessionId, vehicleContext } = await request.json();

  // NEW: VIN decode if available
  let motorVehicleData = null;
  if (vehicleContext?.vin) {
    motorVehicleData = await motorDaasClient.decodeVIN(vehicleContext.vin);
  }

  // NEW: Extract DTCs from OBD data
  const dtcDefinitions = await enrichDTCsWithMotor(vehicleContext?.dtcCodes);

  // Enhanced context for Perplexity
  const enrichedContext = {
    ...vehicleContext,
    motorSpecs: motorVehicleData,
    dtcDefinitions,
  };

  // Send to Perplexity with enriched context
  const diagnosticResponse = await perplexityClient.chat({
    model: 'sonar-pro',
    messages: buildDiagnosticPrompt(messages, enrichedContext),
  });

  return Response.json(diagnosticResponse);
}
```

**Tasks:**
- [ ] Modify `/api/mia-diagnostics/route.ts` to call MOTOR DaaS
- [ ] Add VIN validation before API calls
- [ ] Implement DTC enrichment function
- [ ] Update system prompt with MOTOR data formatting

---

### Phase 2: UI Enhancements (Week 2-3)

#### 2.1 VIN Decoder Widget
**Component:** `src/components/diagnostics/VINDecoderCard.tsx`

**Features:**
- Input field for 17-character VIN
- Real-time validation
- "Decode" button triggers MOTOR API
- Display decoded specs: Year, Make, Model, Engine, Transmission
- Auto-populate vehicle context in chat

**Location in UI:**
- Add to `/src/app/mia/page.tsx` above chat interface
- Collapsible card design using shadcn Accordion

**Tasks:**
- [ ] Create VINDecoderCard component
- [ ] Add VIN validation regex
- [ ] Wire up to MOTOR DaaS API
- [ ] Store decoded data in session context
- [ ] Add loading states and error handling

#### 2.2 Enhanced DTC Display
**Component:** `src/components/diagnostics/DTCDetailsPanel.tsx`

**Features:**
- Show DTC code with MOTOR definition
- Display severity level (Critical, Warning, Info)
- Link to repair procedures
- Show related TSBs if available
- Estimated labor time for repair

**Design:**
```tsx
<Card className="border-l-4 border-l-red-500">
  <CardHeader>
    <Badge variant="destructive">P0301</Badge>
    <CardTitle>Cylinder 1 Misfire Detected</CardTitle>
  </CardHeader>
  <CardContent>
    <p className="text-sm text-muted-foreground">
      {motorDefinition.description}
    </p>
    <div className="mt-4 space-y-2">
      <Button variant="outline" size="sm">
        View Repair Procedure
      </Button>
      <Button variant="outline" size="sm">
        Related TSBs (3)
      </Button>
    </div>
    <p className="mt-2 text-xs">Est. Labor: 2.5 hours</p>
  </CardContent>
</Card>
```

**Tasks:**
- [ ] Create DTCDetailsPanel component
- [ ] Integrate with chat message rendering
- [ ] Add expandable repair procedure viewer
- [ ] Style severity levels with color coding

#### 2.3 Chat Message Enrichment
**File:** `src/app/mia/components/DiagnosticMessageCard.tsx`

**Enhancements:**
- Detect DTC codes in messages (regex: `/P[0-3][0-9A-F]{3}/g`)
- Render inline DTC cards with MOTOR data
- Add "Powered by MOTOR" badge
- Show confidence indicators for AI+MOTOR hybrid responses

**Tasks:**
- [ ] Update message parser to detect DTCs
- [ ] Render DTCDetailsPanel for each code
- [ ] Add data source attribution (AI vs MOTOR)

---

### Phase 3: Advanced Features (Week 3-4)

#### 3.1 OBD Integration Enhancement
**File:** `src/app/api/obd/route.ts`

**Auto-Diagnosis Flow:**
1. Receive OBD data with DTC codes
2. Automatically enrich with MOTOR definitions
3. Trigger MIA chat suggestion: "New DTC detected - P0301. Start diagnosis?"
4. Pre-populate chat with vehicle context + DTC data

**Database Update:**
```typescript
// When saving OBD data
const motorDTC = await motorDaasClient.getDTCDefinition(dtcCode, vin);

await supabase.from('vehicle_obd_data').insert({
  vehicle_id,
  dtc_code: dtcCode,
  motor_dtc_definition: motorDTC,
  status: motorDTC.severity === 'critical' ? 'critical' : 'warning',
});
```

**Tasks:**
- [ ] Modify OBD save endpoint
- [ ] Add automatic MOTOR enrichment
- [ ] Create notification system for new DTCs
- [ ] Link OBD dashboard to MIA chat

#### 3.2 TSB Browser
**Page:** `src/app/(features)/diagnostics/tsbs/page.tsx`

**Features:**
- Search TSBs by VIN or vehicle specs
- Filter by category (engine, transmission, electrical)
- Display TSB summary and full text
- Link to related work orders

**Tasks:**
- [ ] Create TSB list page
- [ ] Implement search and filtering
- [ ] Add TSB detail modal
- [ ] Create work order template from TSB

#### 3.3 Repair Procedure Viewer
**Component:** `src/components/diagnostics/RepairProcedureViewer.tsx`

**Features:**
- Step-by-step instructions from MOTOR
- Embedded diagrams and images
- Required tools list
- Safety warnings highlighted
- Print-friendly format for technicians

**Tasks:**
- [ ] Create procedure viewer component
- [ ] Handle MOTOR API image URLs
- [ ] Add step completion checkboxes
- [ ] Generate PDF for technician printouts

---

## Technical Architecture

### Data Flow Diagram
```
User Input (VIN/DTCs)
    ↓
MIA Diagnostic Chat
    ↓
API Route: /api/mia-diagnostics
    ↓
┌─────────────────┬─────────────────┐
│  MOTOR DaaS     │  Perplexity AI  │
│  (Facts)        │  (Reasoning)    │
└─────────────────┴─────────────────┘
    ↓
Hybrid Response
    ↓
Database Cache (motor_daas_cache)
    ↓
UI Rendering (Chat + DTC Cards)
```

### API Rate Limiting Strategy
- **Cache Duration**: 30 days for VIN decodes, 7 days for DTCs
- **Request Batching**: Group multiple DTC lookups
- **Fallback**: If MOTOR API fails, use Perplexity alone
- **Cost Control**: Limit to 1000 API calls/month initially

### Error Handling
```typescript
try {
  const motorData = await motorDaasClient.decodeVIN(vin);
} catch (error) {
  // Log error but don't block diagnosis
  console.error('MOTOR API failed:', error);
  // Fall back to Perplexity-only mode
  return perplexityDiagnosis(messages);
}
```

---

## Implementation Checklist

### Environment Setup
- [ ] Obtain MOTOR DaaS API credentials
- [ ] Add `MOTOR_DAAS_API_KEY` to environment
- [ ] Add `MOTOR_DAAS_API_URL` to config
- [ ] Update `src/lib/config.ts` with MOTOR settings

### Backend Development
- [ ] Create MOTOR client (`src/lib/integrations/motor-daas/`)
- [ ] Write TypeScript types for MOTOR responses
- [ ] Run database migration for new fields
- [ ] Update `/api/mia-diagnostics` endpoint
- [ ] Create caching layer for API responses
- [ ] Write unit tests for MOTOR integration

### Frontend Development
- [ ] Build VIN decoder component
- [ ] Create DTC details panel
- [ ] Update chat message rendering
- [ ] Add TSB browser page
- [ ] Build repair procedure viewer
- [ ] Implement loading states

### Testing
- [ ] Test VIN decoding with various vehicles
- [ ] Verify DTC enrichment accuracy
- [ ] Test API failure fallbacks
- [ ] Validate cache expiration logic
- [ ] End-to-end diagnostic flow testing
- [ ] Performance testing with rate limits

### Documentation
- [ ] API integration guide for developers
- [ ] User guide for VIN decoder feature
- [ ] Technician guide for DTC diagnostics
- [ ] Admin guide for MOTOR API monitoring

---

## Success Metrics

### Technical KPIs
- **API Response Time**: < 2 seconds for VIN decode
- **Cache Hit Rate**: > 70% for DTC lookups
- **System Uptime**: 99.5% with MOTOR fallback
- **Cost Per Diagnosis**: < $0.10 (MOTOR + Perplexity combined)

### Business KPIs
- **Diagnostic Accuracy**: > 90% (validated by technicians)
- **Time Saved**: 15 minutes per diagnostic session
- **User Adoption**: 80% of shops using VIN decoder within 30 days
- **Customer Satisfaction**: 4.5/5 stars for diagnostic quality

---

## Timeline

| Week | Phase | Deliverables |
|------|-------|--------------|
| 1 | Setup & Backend | MOTOR client, API integration, DB migration |
| 2 | Core UI | VIN decoder, DTC cards, chat enrichment |
| 3 | Advanced Features | OBD integration, TSB browser |
| 4 | Polish & Testing | Error handling, performance tuning, docs |

**Total Duration:** 4 weeks (1 developer)

---

## Risks & Mitigation

### Risk 1: MOTOR API Cost Overruns
**Mitigation:**
- Aggressive caching (30-day VIN, 7-day DTC)
- Monthly budget alerts in code
- Fallback to Perplexity if quota exceeded

### Risk 2: API Reliability
**Mitigation:**
- Timeout handling (5-second max)
- Graceful degradation to Perplexity-only mode
- User notification: "Using AI-only mode (MOTOR unavailable)"

### Risk 3: VIN Data Privacy
**Mitigation:**
- Encrypt VIN in database (`pg_crypto`)
- Anonymize in logs
- GDPR-compliant data retention (90 days for cache)

---

## Future Enhancements (Post-MVP)

1. **Predictive Maintenance**: Use MOTOR specs + OBD trends to predict failures
2. **Parts Integration**: Link MOTOR part numbers to supplier APIs
3. **Mobile App**: Scan VIN with camera, instant diagnostics
4. **Multi-Language**: Translate MOTOR procedures for Canadian French shops
5. **AI Training**: Fine-tune GPT on MOTOR procedure corpus

---

## API Cost Estimation

### MOTOR DaaS Pricing (Estimated)
- VIN Decode: $0.05 per call
- DTC Definition: $0.02 per code
- Repair Procedure: $0.10 per retrieval
- TSB Lookup: $0.03 per search

### Monthly Projection (100 active shops)
- 500 VIN decodes/month: $25
- 2,000 DTC lookups/month: $40
- 300 repair procedures/month: $30
- **Total:** ~$95/month + caching reduces to **$50-60/month**

**ROI:** If saves 15 min/diagnosis × $100/hour labor = $25 value per diagnosis
Break-even at 3 diagnoses/month across all shops.

---

## Conclusion

This MVP integrates MOTOR DaaS with the existing MIA diagnostic chat to deliver professional-grade automotive diagnostics. By combining MOTOR's OEM-accurate data with Perplexity's reasoning capabilities, MotorMinds will provide unmatched diagnostic quality in the shop management platform market.

**Next Steps:**
1. Review and approve this plan
2. Obtain MOTOR DaaS API access
3. Assign developer resources
4. Kick off Week 1 implementation

---

**Document Version:** 1.0
**Created:** 2025-11-24
**Owner:** MotorMinds Engineering Team
**Status:** Pending Approval
