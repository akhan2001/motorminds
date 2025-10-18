# MotorMinds - Immediate Action Items
## 30-60-90 Day Technical Roadmap

This document outlines concrete, actionable tasks for the next 90 days based on the comprehensive CTO Strategic Plan.

---

## 🔴 WEEK 1-2: CRITICAL FIXES & AUDIT

### Day 1-3: Technical Debt Assessment

**Priority 1: Security Audit**
```bash
# Tasks:
1. Review all API routes for authentication
2. Audit RLS policies in Supabase
3. Check for exposed secrets in code
4. Verify rate limiting on sensitive endpoints
5. Test CORS configurations

# Deliverables:
- security-audit-report.md
- List of critical vulnerabilities (if any)
- Remediation plan
```

**Priority 2: Performance Baseline**
```bash
# Set up monitoring:
1. Install Datadog or New Relic APM
2. Set up error tracking (Sentry if not already)
3. Configure uptime monitoring (Pingdom)
4. Database query performance audit

# Metrics to capture:
- API response times (p50, p95, p99)
- Database query times
- Error rates by endpoint
- User session metrics
```

**Priority 3: Code Quality Assessment**
```bash
# Run analysis:
1. ESLint full codebase scan
2. TypeScript strict mode check
3. Identify unused dependencies
4. Find duplicate code (SonarQube or CodeClimate)

# Action items:
- Fix critical TypeScript errors
- Remove unused dependencies
- Upgrade typescript to 5.3.x
```

### Day 4-7: Clean Up & Standardization

**Remove Test/Debug Code**
```bash
# Delete these directories/files:
rm -rf src/app/auth-test
rm -rf src/app/financials-test
rm -rf src/app/service-role-test
rm -rf src/app/widget-test
rm -rf src/app/email-test
rm -rf src/app/widget-debug
rm -rf src/app/widget-live-test
rm test-perplexity.js
rm test-widget.html
rm test-widget-updated.html

# Move to /tests if they're actually useful:
mkdir -p tests/manual
mv widget-test.html tests/manual/
```

**Consolidate Duplicate Services**
```bash
# Audit these areas:
src/app/(features)/financials/lib/
  - invoice-service.ts
  - invoice-temp-service.ts
  - invoice-temp-service-example.ts
  ❌ PICK ONE, delete others

src/lib/supabase.ts vs src/utils/supabase/client.ts
  ❌ Consolidate to one pattern

# Create unified service layer pattern:
src/services/
  ├── invoice-service.ts (ONE source of truth)
  ├── work-order-service.ts
  ├── customer-service.ts
  └── parts-service.ts
```

### Day 8-14: Foundation Setup

**Environment Configuration**
```typescript
// Create: src/config/index.ts
import { z } from 'zod';

const envSchema = z.object({
  // Database
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string(),
  SUPABASE_SERVICE_ROLE_KEY: z.string(),
  
  // AI Services
  OPENAI_API_KEY: z.string().min(1),
  PERPLEXITY_API_KEY: z.string().min(1),
  VAPI_API_KEY: z.string().min(1),
  
  // Communications
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  
  // Payments (NEW)
  STRIPE_PUBLIC_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  
  // App Config
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'staging', 'production']),
});

export const config = envSchema.parse(process.env);

// Add to src/app/layout.tsx to validate on startup
```

**API Response Standardization**
```typescript
// Create: src/lib/api/response.ts
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export function successResponse<T>(data: T, meta?: any): APIResponse<T> {
  return {
    success: true,
    data,
    meta: {
      ...meta,
      timestamp: new Date().toISOString(),
    },
  };
}

export function errorResponse(
  code: string,
  message: string,
  details?: any
): APIResponse {
  return {
    success: false,
    error: { code, message, details },
    meta: { timestamp: new Date().toISOString() },
  };
}

// Usage in API routes:
return NextResponse.json(successResponse(workOrders), { status: 200 });
return NextResponse.json(errorResponse('NOT_FOUND', 'Work order not found'), { status: 404 });
```

**Set Up CI/CD Pipeline**
```yaml
# Create: .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Lint
        run: npm run lint
      
      - name: Type check
        run: npx tsc --noEmit
  
  test:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
  
  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
```

---

## 🟡 WEEK 3-4: IMMEDIATE IMPROVEMENTS

### Testing Infrastructure

**Set Up Vitest**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom happy-dom
```

```typescript
// Create: vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.*',
        '**/types/*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

**Write First Tests**
```typescript
// tests/services/work-order-service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WorkOrderService } from '@/app/(features)/operations/lib/work-order-service';

describe('WorkOrderService', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('getWorkOrders', () => {
    it('should return work orders for a shop', async () => {
      // Arrange
      const shopId = 'test-shop-id';
      const mockWorkOrders = [
        { id: '1', shop_id: shopId, status: 'pending' },
        { id: '2', shop_id: shopId, status: 'in_progress' },
      ];
      
      // Mock Supabase
      vi.spyOn(WorkOrderService, 'getWorkOrders').mockResolvedValue(mockWorkOrders);
      
      // Act
      const result = await WorkOrderService.getWorkOrders(shopId);
      
      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].shop_id).toBe(shopId);
    });
    
    it('should filter by status', async () => {
      // Test filtering logic
    });
  });
});
```

**Target: 50% coverage by end of Week 4**

### Database Optimizations

**Add Missing Indexes**
```sql
-- Create: supabase/migrations/20251018000000_add_performance_indexes.sql

-- Work Orders
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_shop_status 
  ON work_orders(shop_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_work_orders_customer 
  ON work_orders(shop_id, customer_id, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Invoices
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_shop_status 
  ON invoices(shop_id, status, due_date) 
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_invoices_customer 
  ON invoices(shop_id, customer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_unpaid_invoices 
  ON invoices(shop_id, due_date) 
  WHERE status = 'UNPAID' AND deleted_at IS NULL;

-- Customers
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_search 
  ON customers USING GIN(
    to_tsvector('english', customer_name || ' ' || COALESCE(customer_email, '') || ' ' || COALESCE(customer_phone, ''))
  ) WHERE deleted_at IS NULL;

-- Parts Requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_parts_requests_status 
  ON parts_requests(shop_id, status, priority, created_at DESC);

-- Messages (for conversation retrieval)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation 
  ON messages(shop_id, conversation_id, created_at DESC);

-- Analyze tables after index creation
ANALYZE work_orders;
ANALYZE invoices;
ANALYZE customers;
ANALYZE parts_requests;
ANALYZE messages;
```

**Add Soft Delete Pattern**
```sql
-- Create: supabase/migrations/20251018000001_add_soft_deletes.sql

-- Add deleted_at columns where missing
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customer_vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE parts_requests ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Update RLS policies to exclude soft-deleted records
DROP POLICY IF EXISTS "Users can view their shop's customers" ON customers;
CREATE POLICY "Users can view their shop's customers"
  ON customers FOR SELECT
  USING (
    shop_id = (SELECT shop_id FROM users WHERE id = auth.uid())
    AND deleted_at IS NULL
  );

-- Repeat for other tables...
```

### Rate Limiting Enhancement

**Upgrade Rate Limiter**
```typescript
// Update: src/lib/rate-limiter.ts
import { RateLimiterMemory, RateLimiterRes } from 'rate-limiter-flexible';

interface RateLimitConfig {
  points: number;
  duration: number; // seconds
  blockDuration?: number; // seconds to block after exceeding
}

const configs: Record<string, RateLimitConfig> = {
  'api': { points: 100, duration: 60 }, // 100 requests per minute
  'api:ai': { points: 20, duration: 60, blockDuration: 120 }, // AI endpoints
  'api:auth': { points: 5, duration: 60, blockDuration: 300 }, // Auth attempts
  'api:public': { points: 50, duration: 60 }, // Public endpoints
};

const limiters = new Map<string, RateLimiterMemory>();

export function getRateLimiter(key: string): RateLimiterMemory {
  if (!limiters.has(key)) {
    const config = configs[key] || configs['api'];
    limiters.set(key, new RateLimiterMemory(config));
  }
  return limiters.get(key)!;
}

export async function checkRateLimit(
  identifier: string,
  limitKey: string = 'api'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const limiter = getRateLimiter(limitKey);
  
  try {
    await limiter.consume(identifier);
    return { allowed: true };
  } catch (error) {
    if (error instanceof RateLimiterRes) {
      return {
        allowed: false,
        retryAfter: Math.ceil(error.msBeforeNext / 1000),
      };
    }
    throw error;
  }
}

// Usage in API routes:
const identifier = request.headers.get('x-user-id') || request.ip || 'anonymous';
const { allowed, retryAfter } = await checkRateLimit(identifier, 'api:ai');

if (!allowed) {
  return NextResponse.json(
    errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests'),
    {
      status: 429,
      headers: { 'Retry-After': retryAfter?.toString() || '60' },
    }
  );
}
```

---

## 🟢 WEEK 5-8: STRATEGIC ENHANCEMENTS

### Stripe Payment Integration

**Install Stripe**
```bash
npm install stripe @stripe/stripe-js
```

**Backend Setup**
```typescript
// Create: src/lib/payments/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function createPaymentIntent(
  invoiceId: string,
  amount: number,
  shopId: string,
  customerId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: 'cad',
    automatic_payment_methods: { enabled: true },
    metadata: {
      invoice_id: invoiceId,
      shop_id: shopId,
      customer_id: customerId,
    },
  });
}

export async function handleWebhook(
  payload: string,
  signature: string
): Promise<void> {
  const event = stripe.webhooks.constructEvent(
    payload,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
  
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { invoice_id } = paymentIntent.metadata;
  
  // Update invoice status
  const { error } = await supabase
    .from('invoices')
    .update({
      status: 'PAID',
      paid_at: new Date().toISOString(),
      payment_method: 'stripe',
      stripe_payment_intent_id: paymentIntent.id,
    })
    .eq('id', invoice_id);
  
  if (error) {
    console.error('Failed to update invoice:', error);
    throw error;
  }
  
  // Trigger financial integration
  await triggerFinancialIntegration(invoice_id);
}
```

**API Endpoints**
```typescript
// Create: src/app/api/payments/create-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createPaymentIntent } from '@/lib/payments/stripe';
import { errorResponse, successResponse } from '@/lib/api/response';

export async function POST(request: NextRequest) {
  try {
    const { invoiceId } = await request.json();
    
    // Validate user has access to this invoice
    const invoice = await validateInvoiceAccess(invoiceId, userId, shopId);
    
    const paymentIntent = await createPaymentIntent(
      invoiceId,
      invoice.total_amount,
      invoice.shop_id,
      invoice.customer_id
    );
    
    return NextResponse.json(
      successResponse({
        clientSecret: paymentIntent.client_secret,
        amount: invoice.total_amount,
      })
    );
  } catch (error) {
    return NextResponse.json(
      errorResponse('PAYMENT_ERROR', error.message),
      { status: 500 }
    );
  }
}

// Create: src/app/api/webhooks/stripe/route.ts
export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  try {
    await handleWebhook(payload, signature);
    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json(
      errorResponse('WEBHOOK_ERROR', error.message),
      { status: 400 }
    );
  }
}
```

### Parts Supplier Integration - Phase 1 (NAPA)

**Research & Setup**
```bash
# Tasks:
1. Contact NAPA Canada API team
2. Get API credentials (sandbox first)
3. Review API documentation
4. Map NAPA API to our data model
5. Build adapter layer
```

**Adapter Pattern**
```typescript
// Create: src/lib/integrations/suppliers/base.ts
export interface PartsSupplier {
  name: string;
  searchParts(query: PartSearchQuery): Promise<PartSearchResult[]>;
  getPricing(partNumbers: string[]): Promise<PartPrice[]>;
  checkAvailability(partNumber: string): Promise<AvailabilityStatus>;
  placeOrder(order: PartsOrder): Promise<OrderConfirmation>;
}

export interface PartSearchQuery {
  year?: number;
  make?: string;
  model?: string;
  partNumber?: string;
  keyword?: string;
  category?: string;
}

export interface PartSearchResult {
  partNumber: string;
  partName: string;
  description: string;
  manufacturer: string;
  price: number;
  availability: 'in-stock' | 'special-order' | 'unavailable';
  estimatedDelivery?: string;
  supplier: string;
}

// Create: src/lib/integrations/suppliers/napa.ts
export class NAPASupplier implements PartsSupplier {
  name = 'NAPA Canada';
  private apiKey: string;
  private baseURL: string;
  
  constructor() {
    this.apiKey = process.env.NAPA_API_KEY!;
    this.baseURL = process.env.NAPA_API_URL || 'https://api.napacanada.com';
  }
  
  async searchParts(query: PartSearchQuery): Promise<PartSearchResult[]> {
    // Map our query to NAPA's API format
    const napaQuery = this.mapToNAPAQuery(query);
    
    const response = await fetch(`${this.baseURL}/parts/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(napaQuery),
    });
    
    const data = await response.json();
    
    // Map NAPA response to our format
    return data.results.map(this.mapFromNAPAResult);
  }
  
  private mapToNAPAQuery(query: PartSearchQuery): any {
    // NAPA-specific mapping
  }
  
  private mapFromNAPAResult(napaResult: any): PartSearchResult {
    return {
      partNumber: napaResult.part_number,
      partName: napaResult.description,
      description: napaResult.long_description,
      manufacturer: napaResult.brand,
      price: parseFloat(napaResult.list_price),
      availability: this.mapAvailability(napaResult.stock_status),
      estimatedDelivery: napaResult.expected_delivery_date,
      supplier: 'NAPA Canada',
    };
  }
}

// Create: src/lib/integrations/suppliers/aggregator.ts
export class PartsAggregator {
  private suppliers: PartsSupplier[] = [];
  
  constructor() {
    // Initialize suppliers
    if (process.env.NAPA_API_KEY) {
      this.suppliers.push(new NAPASupplier());
    }
    // Add more suppliers as we integrate them
  }
  
  async searchAllSuppliers(query: PartSearchQuery): Promise<PartSearchResult[]> {
    const results = await Promise.allSettled(
      this.suppliers.map(supplier => supplier.searchParts(query))
    );
    
    // Combine results
    const allParts: PartSearchResult[] = [];
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        allParts.push(...result.value);
      } else {
        console.error('Supplier search failed:', result.reason);
      }
    });
    
    // Deduplicate and rank
    return this.deduplicateAndRank(allParts);
  }
  
  private deduplicateAndRank(parts: PartSearchResult[]): PartSearchResult[] {
    // Group by part number
    const grouped = new Map<string, PartSearchResult[]>();
    
    parts.forEach(part => {
      const key = part.partNumber.toUpperCase();
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(part);
    });
    
    // For each part number, keep the best option (lowest price, best availability)
    return Array.from(grouped.values()).map(options => {
      return options.reduce((best, current) => {
        if (current.availability === 'in-stock' && best.availability !== 'in-stock') {
          return current;
        }
        if (current.price < best.price) {
          return current;
        }
        return best;
      });
    });
  }
}
```

### Feature Flags System

```typescript
// Create: src/lib/feature-flags/index.ts
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage?: number;
  enabledShops?: string[];
  enabledPlans?: string[];
}

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  
  async initialize() {
    // Load from database
    const { data } = await supabase.from('feature_flags').select('*');
    
    data?.forEach(flag => {
      this.flags.set(flag.flag_key, flag);
    });
  }
  
  async isEnabled(
    flagKey: string,
    context: { shopId?: string; plan?: string }
  ): Promise<boolean> {
    const flag = this.flags.get(flagKey);
    
    if (!flag) return false;
    if (!flag.enabled) return false;
    
    // Check shop-specific override
    if (context.shopId) {
      const override = await this.getShopOverride(context.shopId, flagKey);
      if (override !== null) return override;
    }
    
    // Check plan restriction
    if (flag.enabledPlans && context.plan) {
      if (!flag.enabledPlans.includes(context.plan)) return false;
    }
    
    // Check rollout percentage
    if (flag.rolloutPercentage && context.shopId) {
      const hash = this.hashShopId(context.shopId);
      return hash < flag.rolloutPercentage;
    }
    
    return flag.enabled;
  }
  
  private async getShopOverride(
    shopId: string,
    flagKey: string
  ): Promise<boolean | null> {
    const { data } = await supabase
      .from('shop_feature_overrides')
      .select('enabled')
      .eq('shop_id', shopId)
      .eq('flag_key', flagKey)
      .single();
    
    return data?.enabled ?? null;
  }
  
  private hashShopId(shopId: string): number {
    // Simple hash to percentage (0-100)
    let hash = 0;
    for (let i = 0; i < shopId.length; i++) {
      hash = ((hash << 5) - hash) + shopId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }
}

export const featureFlags = new FeatureFlagService();

// Usage:
const canUseAI = await featureFlags.isEnabled('ai_diagnostics', {
  shopId: user.shop_id,
  plan: shop.plan,
});

if (canUseAI) {
  // Show AI features
}
```

---

## 🔵 WEEK 9-12: SCALE PREPARATION

### Database Audit Trail

```sql
-- Create: supabase/migrations/20251018000002_audit_trail.sql

-- Generic history tracking function
CREATE OR REPLACE FUNCTION record_history()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_log (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by,
    changed_at
  ) VALUES (
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_OP,
    to_jsonb(OLD),
    to_jsonb(NEW),
    COALESCE(current_setting('app.current_user_id', true), 'system'),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to critical tables
CREATE TRIGGER audit_invoices
AFTER INSERT OR UPDATE OR DELETE ON invoices
FOR EACH ROW EXECUTE FUNCTION record_history();

CREATE TRIGGER audit_work_orders
AFTER INSERT OR UPDATE OR DELETE ON work_orders
FOR EACH ROW EXECUTE FUNCTION record_history();

CREATE TRIGGER audit_customers
AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION record_history();
```

### Advanced Analytics Dashboard

**Create Materialized Views**
```sql
-- Create: supabase/migrations/20251018000003_analytics_views.sql

-- Shop performance summary (refresh daily)
CREATE MATERIALIZED VIEW shop_performance_daily AS
SELECT 
  s.id as shop_id,
  s.shop_name,
  DATE(wo.created_at) as date,
  COUNT(DISTINCT wo.id) as work_orders_count,
  COUNT(DISTINCT wo.id) FILTER (WHERE wo.status = 'completed') as completed_count,
  AVG(EXTRACT(EPOCH FROM (wo.completed_at - wo.created_at)) / 3600) as avg_turnaround_hours,
  SUM(inv.total_amount) as revenue,
  COUNT(DISTINCT c.id) as unique_customers,
  AVG(wo.customer_satisfaction_score) as avg_satisfaction
FROM shops s
LEFT JOIN work_orders wo ON s.id = wo.shop_id AND wo.deleted_at IS NULL
LEFT JOIN invoices inv ON wo.id = inv.work_order_id AND inv.status = 'PAID'
LEFT JOIN customers c ON wo.customer_id = c.id AND c.deleted_at IS NULL
WHERE wo.created_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY s.id, s.shop_name, DATE(wo.created_at);

CREATE UNIQUE INDEX ON shop_performance_daily (shop_id, date);

-- Schedule refresh
SELECT cron.schedule(
  'refresh-shop-performance',
  '0 2 * * *', -- 2 AM daily
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY shop_performance_daily$$
);
```

**Analytics API**
```typescript
// Create: src/app/api/analytics/dashboard/route.ts
export async function GET(request: NextRequest) {
  const shopId = request.headers.get('x-shop-id');
  const dateRange = request.nextUrl.searchParams.get('range') || '30d';
  
  const [performance, trends, topServices] = await Promise.all([
    getPerformanceMetrics(shopId, dateRange),
    getTrends(shopId, dateRange),
    getTopServices(shopId, dateRange),
  ]);
  
  return NextResponse.json(
    successResponse({
      performance,
      trends,
      topServices,
      generatedAt: new Date().toISOString(),
    })
  );
}

async function getPerformanceMetrics(shopId: string, range: string) {
  const { data } = await supabase
    .from('shop_performance_daily')
    .select('*')
    .eq('shop_id', shopId)
    .gte('date', getDateFromRange(range))
    .order('date', { ascending: true });
  
  return {
    totalRevenue: data.reduce((sum, d) => sum + d.revenue, 0),
    totalWorkOrders: data.reduce((sum, d) => sum + d.work_orders_count, 0),
    avgTurnaround: data.reduce((sum, d) => sum + d.avg_turnaround_hours, 0) / data.length,
    avgSatisfaction: data.reduce((sum, d) => sum + d.avg_satisfaction, 0) / data.length,
  };
}
```

### Multi-Environment Setup

```bash
# Create environment-specific configs

# .env.development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
# ... dev credentials

# .env.staging
NEXT_PUBLIC_APP_URL=https://staging.motorminds.ca
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
# ... staging credentials

# .env.production
NEXT_PUBLIC_APP_URL=https://app.motorminds.ca
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
# ... production credentials
```

```json
// package.json scripts
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:staging": "dotenv -e .env.staging -- next build",
    "build:production": "dotenv -e .env.production -- next build",
    "deploy:staging": "npm run build:staging && vercel deploy",
    "deploy:production": "npm run build:production && vercel deploy --prod"
  }
}
```

---

## 📊 SUCCESS METRICS

Track these metrics weekly:

**Week 1-2:**
- [ ] Security audit completed (0 critical vulnerabilities)
- [ ] Monitoring tools installed and configured
- [ ] Test/debug code removed (10+ files deleted)

**Week 3-4:**
- [ ] API response standardization (100% of endpoints)
- [ ] Test coverage: 50%+
- [ ] Database indexes added (5+ indexes)
- [ ] Rate limiting implemented on all APIs

**Week 5-8:**
- [ ] Stripe integration live (at least in staging)
- [ ] NAPA API integration (proof of concept)
- [ ] Feature flags system operational
- [ ] Test coverage: 70%+

**Week 9-12:**
- [ ] Audit trail on critical tables
- [ ] Analytics dashboard v1 launched
- [ ] Multi-environment deployment working
- [ ] Test coverage: 80%+
- [ ] All linter errors fixed

**Performance Targets:**
- API p95 latency: < 300ms (Week 4)
- API p95 latency: < 200ms (Week 12)
- Error rate: < 0.5%
- Uptime: 99.5%+

---

## 🚨 BLOCKERS & ESCALATION

If you encounter these, escalate immediately:

1. **Supabase limits reached** → Consider migration plan acceleration
2. **AI costs spike > $5K/month** → Implement aggressive caching
3. **Security vulnerability discovered** → Stop feature work, fix immediately
4. **Key engineer departure** → Activate knowledge transfer protocol
5. **Performance degrades > 50%** → Scale infrastructure, optimize queries

---

## 📝 WEEKLY CHECK-IN TEMPLATE

```markdown
# Week X Check-In

## Completed:
- Task 1
- Task 2

## In Progress:
- Task 3 (50% done, blocked on X)

## Blockers:
- Issue Y needs CTO input

## Metrics:
- Test coverage: X%
- API latency p95: Xms
- Error rate: X%
- New issues: X
- Resolved issues: X

## Next Week Priorities:
1. Priority 1
2. Priority 2
3. Priority 3
```

---

## 🎯 DEFINITION OF DONE

A task is "done" when:
- [ ] Code is written and reviewed (2 reviewers)
- [ ] Tests are written and passing (unit + integration)
- [ ] Documentation is updated
- [ ] Deployed to staging and tested
- [ ] Performance impact measured (< 5% regression)
- [ ] Security implications reviewed
- [ ] Error handling implemented
- [ ] Logging added
- [ ] Merged to main branch

---

**Next Steps:**
1. Print this document
2. Create GitHub Project board with all tasks
3. Assign owners to each task
4. Schedule daily standups (15 min)
5. Weekly progress review with team
6. Monthly review with stakeholders

**Remember:** Perfect is the enemy of good. Ship iteratively, measure, learn, improve.

**Questions?** Refer to the comprehensive CTO Strategic Plan (CTO_STRATEGIC_PLAN.md) for context and long-term vision.

