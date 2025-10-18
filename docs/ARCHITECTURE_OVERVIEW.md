# MotorMinds - Architecture Overview
## System Architecture Visualization

### Current Architecture (As-Is)

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (React + TypeScript)                           │
│  ├─ Dashboard                                               │
│  ├─ Work Orders                                             │
│  ├─ Customers                                               │
│  ├─ Invoices                                                │
│  ├─ Parts Ordering                                          │
│  └─ MIA AI Chat                                             │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes (Serverless)                            │
│  ├─ /api/work-orders                                        │
│  ├─ /api/customers                                          │
│  ├─ /api/invoices                                           │
│  ├─ /api/parts-requests                                     │
│  ├─ /api/mia (AI)                                           │
│  └─ /api/webhooks                                           │
│                                                              │
│  Middleware:                                                │
│  ├─ Authentication (Supabase Auth)                          │
│  ├─ Shop Context (RLS)                                      │
│  └─ Rate Limiting (Basic)                                   │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
├─────────────────────────────────────────────────────────────┤
│  Supabase (PostgreSQL)                                      │
│  ├─ Tables: shops, users, customers, work_orders,          │
│  │   invoices, parts_requests, messages, etc.              │
│  ├─ Row-Level Security (RLS) by shop_id                    │
│  ├─ Real-time subscriptions                                │
│  └─ File Storage                                            │
└─────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                            │
├─────────────────────────────────────────────────────────────┤
│  AI Services:                                               │
│  ├─ OpenAI (GPT-4, GPT-3.5)                                │
│  ├─ Perplexity AI                                           │
│  └─ Vapi AI (Voice)                                         │
│                                                              │
│  Communications:                                             │
│  ├─ Twilio (SMS/Voice)                                      │
│  └─ Resend (Email)                                          │
│                                                              │
│  Documents:                                                  │
│  └─ DocuSeal (Contract signing)                             │
└─────────────────────────────────────────────────────────────┘
```

**Issues with Current Architecture:**
- ❌ Monolithic API routes (hard to scale independently)
- ❌ No caching layer (hitting DB on every request)
- ❌ Single point of failure (one Supabase instance)
- ❌ Limited observability (no distributed tracing)
- ❌ Vendor lock-in (Supabase specific code throughout)

---

### Target Architecture (To-Be - Year 2)

```
┌──────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                            │
├──────────────────────────────────────────────────────────────────┤
│  Web App (Next.js)  │  Mobile Apps  │  Widget (Embeddable)      │
│  React + TypeScript │  iOS + Android │  Standalone JS           │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                          CDN / EDGE                              │
├──────────────────────────────────────────────────────────────────┤
│  Vercel Edge / Cloudflare                                        │
│  ├─ Static asset caching                                         │
│  ├─ Edge functions (Auth, routing)                               │
│  └─ DDoS protection                                              │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                       API GATEWAY                                │
├──────────────────────────────────────────────────────────────────┤
│  Kong / AWS API Gateway                                          │
│  ├─ Authentication / Authorization                               │
│  ├─ Rate Limiting (per shop / tier)                              │
│  ├─ Request/Response transformation                              │
│  ├─ API Versioning (v1, v2)                                      │
│  ├─ Observability (logging, tracing)                             │
│  └─ WAF (Web Application Firewall)                               │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                      SERVICE LAYER                               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ Shop           │  │ Invoice        │  │ Parts          │    │
│  │ Management     │  │ Service        │  │ Ordering       │    │
│  │ Service        │  │                │  │ Service        │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐    │
│  │ AI             │  │ Notification   │  │ Analytics      │    │
│  │ Orchestrator   │  │ Service        │  │ Engine         │    │
│  │                │  │                │  │                │    │
│  └────────────────┘  └────────────────┘  └────────────────┘    │
│                                                                  │
│  Each service:                                                   │
│  ├─ Independent deployment                                       │
│  ├─ Own database schema                                          │
│  ├─ REST + GraphQL APIs                                          │
│  └─ Event-driven communication                                   │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                       EVENT BUS                                  │
├──────────────────────────────────────────────────────────────────┤
│  RabbitMQ / Kafka / AWS EventBridge                              │
│  Events:                                                         │
│  ├─ work_order.created                                           │
│  ├─ invoice.paid                                                 │
│  ├─ parts_request.submitted                                      │
│  ├─ customer.updated                                             │
│  └─ ai.prediction_made                                           │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Primary Database (Supabase / AWS RDS PostgreSQL)        │    │
│  │ - Transactional data                                     │    │
│  │ - Multi-tenant (shop_id isolation)                       │    │
│  │ - Point-in-time recovery                                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│                          ↓ ↑                                     │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Read Replicas (PostgreSQL)                              │    │
│  │ - Analytics queries                                      │    │
│  │ - Reporting                                              │    │
│  │ - ML data extraction                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Cache Layer (Redis / Upstash)                           │    │
│  │ - Session management                                     │    │
│  │ - Rate limiting state                                    │    │
│  │ - Frequently accessed data                               │    │
│  │ - AI response caching                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Data Warehouse (ClickHouse / BigQuery)                  │    │
│  │ - Historical analytics                                   │    │
│  │ - ML training datasets                                   │    │
│  │ - Business intelligence                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Vector Database (Pinecone / Weaviate)                   │    │
│  │ - Embeddings for RAG                                     │    │
│  │ - Semantic search                                        │    │
│  │ - Similar case lookup                                    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Time-Series DB (TimescaleDB / InfluxDB)                 │    │
│  │ - OBD sensor data                                        │    │
│  │ - Performance metrics                                    │    │
│  │ - Real-time monitoring                                   │    │
│  └─────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
                          ↓ ↑
┌──────────────────────────────────────────────────────────────────┐
│                   EXTERNAL INTEGRATIONS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AI Services:              Payments:             Accounting:    │
│  ├─ OpenAI                 ├─ Stripe             ├─ QuickBooks  │
│  ├─ Anthropic (Claude)     ├─ Square             ├─ Xero        │
│  ├─ Cohere                 └─ PayPal             └─ FreshBooks  │
│  ├─ Perplexity                                                   │
│  └─ Self-hosted (Llama)    Parts Suppliers:      OEM Data:      │
│                            ├─ NAPA Canada        ├─ NHTSA API   │
│  Communications:           ├─ Canadian Tire      ├─ Mitchell1   │
│  ├─ Twilio                 ├─ Chase Auto         └─ AllData     │
│  ├─ SendGrid               └─ PartSource                         │
│  └─ Resend                                                       │
│                            Documents:            CRM:            │
│  Voice AI:                 └─ DocuSeal           ├─ HubSpot     │
│  └─ Vapi AI                                      └─ Salesforce  │
└──────────────────────────────────────────────────────────────────┘
```

**Benefits of Target Architecture:**
- ✅ Independent service scaling
- ✅ Better fault isolation
- ✅ Technology flexibility per service
- ✅ Improved observability
- ✅ Easier to test and deploy
- ✅ Team autonomy (service ownership)

---

## Data Flow Examples

### Example 1: Work Order Creation

```
User creates work order in web app
    ↓
API Gateway (auth, rate limit)
    ↓
Shop Management Service
    ├─ Validate customer exists
    ├─ Create work order in DB
    └─ Publish event: "work_order.created"
    ↓
Event Bus distributes to:
    ├─ Notification Service → Send SMS to customer
    ├─ AI Orchestrator → Generate upsell suggestions
    └─ Analytics Engine → Update metrics
    ↓
User sees confirmation + AI suggestions
```

### Example 2: Invoice Payment (Stripe)

```
Customer pays invoice via Stripe
    ↓
Stripe sends webhook to API Gateway
    ↓
Webhook handler validates signature
    ↓
Invoice Service
    ├─ Update invoice status to "PAID"
    ├─ Record payment details
    └─ Publish event: "invoice.paid"
    ↓
Event Bus distributes to:
    ├─ QuickBooks Integration → Sync invoice
    ├─ Notification Service → Send receipt
    ├─ Analytics Engine → Update revenue metrics
    └─ Financial Service → Create revenue entry
    ↓
Shop owner sees updated dashboard
```

### Example 3: AI-Powered Parts Recommendation

```
Technician views work order details
    ↓
Frontend requests parts recommendations
    ↓
AI Orchestrator Service
    ├─ Load work order context from cache/DB
    ├─ Load vehicle history
    ├─ Query Vector DB for similar cases
    └─ Call LLM with enriched context
    ↓
LLM generates parts recommendations
    ↓
Parts Ordering Service
    ├─ Query suppliers for real-time pricing
    ├─ Compare prices across suppliers
    └─ Return ranked recommendations
    ↓
Technician sees parts with pricing from multiple suppliers
```

---

## Security Architecture

### Authentication & Authorization Flow

```
┌─────────────────────────────────────────────────────────┐
│                    USER LOGIN                           │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Supabase Auth                              │
│  ├─ Email/Password                                      │
│  ├─ OAuth (Google, Apple)                               │
│  └─ Magic Link                                          │
└─────────────────────────────────────────────────────────┘
                      ↓
                  JWT Token
                      ↓
┌─────────────────────────────────────────────────────────┐
│              Middleware (Next.js)                       │
│  1. Verify JWT signature                                │
│  2. Check expiration                                    │
│  3. Load user from DB                                   │
│  4. Inject shop_id into request context                 │
│  5. Check user role & permissions                       │
└─────────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────┐
│           Row-Level Security (RLS)                      │
│  Every query automatically filtered by shop_id:         │
│  WHERE shop_id = current_user.shop_id                   │
│                                                          │
│  User can ONLY see/edit data from their shop            │
└─────────────────────────────────────────────────────────┘
```

### Data Encryption

```
┌────────────────────────────────────────────────────────┐
│                  DATA AT REST                          │
├────────────────────────────────────────────────────────┤
│  Database: AES-256 encryption                          │
│  Files: Encrypted in Supabase Storage                  │
│  Backups: Encrypted before upload to S3                │
│  Secrets: AWS Secrets Manager / Vault                  │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│                DATA IN TRANSIT                         │
├────────────────────────────────────────────────────────┤
│  All connections: TLS 1.3                              │
│  API: HTTPS only (redirect HTTP → HTTPS)               │
│  Database: SSL required for connections                │
│  Internal services: mTLS (mutual TLS)                  │
└────────────────────────────────────────────────────────┘
                      ↓
┌────────────────────────────────────────────────────────┐
│             FIELD-LEVEL ENCRYPTION                     │
├────────────────────────────────────────────────────────┤
│  PII fields (SSN, credit cards): Encrypted separately  │
│  Key rotation: Quarterly                               │
│  Encryption at application layer before DB write       │
└────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Observability Stack

```
┌──────────────────────────────────────────────────────────┐
│                    APPLICATION                           │
│  Instrumented with OpenTelemetry                         │
│  ├─ Automatic trace propagation                          │
│  ├─ Custom metrics                                       │
│  └─ Structured logging                                   │
└──────────────────────────────────────────────────────────┘
                      ↓ ↓ ↓
        ┌─────────────┼─────────────┐
        ↓             ↓             ↓
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   LOGGING    │ │   METRICS    │ │   TRACING    │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ Datadog      │ │ Prometheus   │ │ Jaeger       │
│ Logs         │ │ + Grafana    │ │              │
│              │ │              │ │              │
│ - Structured │ │ - API p95    │ │ - Request    │
│ - Searchable │ │ - Error rate │ │   flow       │
│ - Alerting   │ │ - DB queries │ │ - Bottleneck │
│ - Retention  │ │ - AI costs   │ │   detection  │
└──────────────┘ └──────────────┘ └──────────────┘
        ↓             ↓             ↓
┌──────────────────────────────────────────────────────────┐
│                    DASHBOARDS                            │
│  ├─ Real-time system health                              │
│  ├─ Business metrics (revenue, usage)                    │
│  ├─ Performance (latency, throughput)                    │
│  ├─ Error tracking and alerting                          │
│  └─ Cost monitoring (per service)                        │
└──────────────────────────────────────────────────────────┘
```

### Alerting Hierarchy

```
CRITICAL (Page on-call engineer immediately)
├─ API error rate > 5%
├─ Database connection failures
├─ Payment processing failures
└─ Data breach detection

HIGH (Alert in Slack, requires action within 1 hour)
├─ API p95 latency > 1 second
├─ Disk space > 80%
├─ AI costs spike > 200% of baseline
└─ Failed background jobs > 10

MEDIUM (Daily digest)
├─ Increased error rates (non-critical)
├─ Slow queries detected
├─ Cache hit rate degradation
└─ Feature flag rollout issues

LOW (Weekly report)
├─ Deprecated API usage
├─ Unused features
└─ Performance optimization opportunities
```

---

## Deployment Architecture

### Multi-Region Setup (Year 2+)

```
┌──────────────────────────────────────────────────────────────┐
│                     GLOBAL CDN                               │
│                  (Cloudflare / CloudFront)                   │
│  ├─ Static assets cached globally                            │
│  ├─ Edge functions for auth/routing                          │
│  └─ Intelligent routing to nearest region                    │
└──────────────────────────────────────────────────────────────┘
                      ↓               ↓
        ┌─────────────────────────────────────────┐
        ↓                                         ↓
┌────────────────────┐                  ┌────────────────────┐
│   PRIMARY REGION   │                  │  SECONDARY REGION  │
│   (US/Canada)      │                  │  (EU)              │
├────────────────────┤                  ├────────────────────┤
│ - Full deployment  │ ← Replication → │ - Full deployment  │
│ - Read + Write     │                  │ - Read + Write     │
│ - Active-Active    │                  │ - Active-Active    │
└────────────────────┘                  └────────────────────┘
        ↓                                         ↓
┌────────────────────┐                  ┌────────────────────┐
│ DB: Primary        │ ← Async Sync  → │ DB: Replica        │
│ Redis: Primary     │                  │ Redis: Replica     │
└────────────────────┘                  └────────────────────┘

Data Residency:
- EU customer data → Stored in EU region only (GDPR)
- US/CA customer data → Stored in US region
- Global data → Replicated to both regions
```

### Disaster Recovery

```
RTO (Recovery Time Objective): < 4 hours
RPO (Recovery Point Objective): < 15 minutes

Backup Strategy:
├─ Database:
│  ├─ Continuous WAL archiving (Point-in-time recovery)
│  ├─ Daily full backups (retained 30 days)
│  └─ Weekly backups to cold storage (retained 1 year)
│
├─ File Storage:
│  ├─ Cross-region replication (S3/GCS)
│  └─ Versioning enabled
│
└─ Configuration:
   ├─ Infrastructure as Code (Terraform in Git)
   ├─ Environment configs in Secrets Manager
   └─ Database schema in version control (migrations)

Recovery Procedures:
1. Automated health checks every 60 seconds
2. Auto-failover to secondary region if primary fails
3. Manual intervention for complex failures
4. Post-mortem required for all incidents
```

---

## Cost Optimization Architecture

### Current vs. Target Costs (per 100 shops)

```
CURRENT (Estimated Monthly):
├─ Vercel hosting:        $150
├─ Supabase:              $300
├─ OpenAI API:            $1,500 ← EXPENSIVE
├─ Twilio:                $200
├─ Other services:        $150
└─ Total:                 ~$2,300/month = $23/shop

TARGET (Year 2):
├─ AWS infrastructure:    $500
├─ Database (RDS):        $400
├─ Cache (Redis):         $100
├─ AI (mix of models):    $600 ← OPTIMIZED
├─ Monitoring:            $200
├─ Communications:        $200
├─ Other services:        $200
└─ Total:                 ~$2,200/month = $22/shop

Savings from:
- Fine-tuned models (70% cheaper than GPT-4)
- Aggressive caching (50% fewer AI calls)
- Multi-tenant efficiency (shared infrastructure)
```

### AI Cost Optimization

```
Query Type            | Old Cost | New Cost | Strategy
----------------------|----------|----------|------------------------
Simple classification | $0.02    | $0.003   | Use GPT-3.5 instead of GPT-4
Customer chat         | $0.01    | $0.002   | Cache common responses
Complex diagnostics   | $0.05    | $0.03    | Fine-tuned model
SQL generation        | $0.01    | $0.005   | Cache + fine-tuned
Embeddings            | $0.001   | $0.0001  | Use smaller model
```

---

## Technology Stack Summary

### Current Stack
```
Frontend:     Next.js 15, React 18, TypeScript, Tailwind CSS
Backend:      Next.js API Routes (serverless)
Database:     Supabase (PostgreSQL)
Auth:         Supabase Auth
Storage:      Supabase Storage
Hosting:      Vercel
AI:           OpenAI, Perplexity, LangChain
Integrations: Twilio, Resend, DocuSeal, Vapi
```

### Target Stack (Year 2)
```
Frontend:     Next.js 15+, React 18+, TypeScript, Tailwind CSS
Mobile:       React Native or Flutter
Backend:      Node.js/TypeScript services (Express/Fastify)
API Gateway:  Kong or AWS API Gateway
Database:     PostgreSQL (AWS RDS)
Cache:        Redis (Upstash or ElastiCache)
Data WH:      ClickHouse or BigQuery
Vector DB:    Pinecone or Weaviate
Event Bus:    RabbitMQ or AWS EventBridge
Auth:         Supabase Auth + Auth0 (enterprise)
Storage:      S3 or GCS
Hosting:      AWS ECS/EKS or GCP Cloud Run
Monitoring:   Datadog or New Relic
AI Platform:  AWS SageMaker or Vertex AI
CI/CD:        GitHub Actions
IaC:          Terraform
```

---

## Key Architectural Decisions

### ADR-001: Multi-Tenancy via shop_id
**Decision:** Use PostgreSQL Row-Level Security with shop_id column on all tables
**Rationale:** 
- Simple to implement and understand
- Database-enforced isolation (can't accidentally query other shops)
- Good performance with proper indexing
**Alternatives Considered:** Separate database per shop (too expensive), application-level filtering (error-prone)

### ADR-002: Serverless First
**Decision:** Start with Next.js API routes (Vercel serverless)
**Rationale:**
- Fast to develop and deploy
- Pay-per-use pricing (good for early stage)
- Auto-scaling built-in
**Alternatives Considered:** Traditional servers (more complex), microservices from day 1 (premature)
**Future:** Migrate to microservices as scale demands

### ADR-003: AI Model Strategy
**Decision:** Start with OpenAI, plan for model diversity and fine-tuning
**Rationale:**
- OpenAI GPT-4 has best accuracy for cold start
- LangChain provides abstraction layer
- Fine-tuning ROI kicks in at ~10K queries/month
**Alternatives Considered:** Anthropic only (less established), self-hosted only (too early)
**Future:** Hybrid approach with fine-tuned models for common tasks

### ADR-004: Supabase for MVP
**Decision:** Use Supabase for database, auth, and storage
**Rationale:**
- Fastest time to market
- Built-in auth and RLS
- Good developer experience
**Alternatives Considered:** AWS from day 1 (more complex), Firebase (worse for relational data)
**Future:** Abstract to support migration to AWS RDS if needed

---

## Migration Paths

### From Monolith to Microservices

**Phase 1: Prepare (Months 1-3)**
- Identify service boundaries
- Implement repository pattern
- Add comprehensive tests
- Set up monitoring

**Phase 2: Extract First Service (Months 4-6)**
- Start with Parts Ordering (least coupled)
- Keep existing API as facade
- Dual-write to both systems during migration
- Validate data consistency

**Phase 3: Extract Core Services (Months 7-12)**
- Invoice Service
- Shop Management Service
- Notification Service
- Gradually move API routes to services

**Phase 4: Full Migration (Year 2)**
- All services extracted
- Event-driven communication
- API Gateway in place
- Monolith retired

### From Supabase to AWS (if needed)

**Trigger:** Supabase limitations or cost concerns

**Migration Plan:**
1. **Set up AWS RDS PostgreSQL** (identical schema)
2. **Implement database abstraction layer** (Prisma or Drizzle ORM)
3. **Set up replication** (Supabase → AWS)
4. **Gradual cutover** (read traffic first, then writes)
5. **Decommission Supabase** (after validation period)

**Estimated Time:** 6 months
**Cost:** ~$100K engineering time + infrastructure

---

**Document Version:** 1.0
**Last Updated:** October 18, 2025
**Next Review:** January 2026

