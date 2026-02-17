# MotorMinds - AI-Powered Automotive Shop Management Platform

MotorMinds is a comprehensive automotive shop management platform that transforms traditional auto repair shops through AI-powered automation, intelligent workflow optimization, and data-driven business insights.

## Features

### Core Platform
- **Work Order Management**: Complete service order lifecycle management
- **Customer CRM**: Comprehensive customer and vehicle management
- **Parts & Inventory**: AI-powered parts sourcing and inventory optimization
- **Financial Analytics**: Revenue tracking, cost analysis, and business intelligence
- **Appointment Scheduling**: Intelligent scheduling and capacity optimization

### AI-Powered Capabilities
- **MIA AI Assistant**: Intelligent shop assistant with diagnostic capabilities
- **Voice Calling Automation**: Automated supplier communication
- **Predictive Maintenance**: AI-powered maintenance recommendations
- **Revenue Optimization**: Intelligent upsell suggestions and pricing
- **Shop Performance Analytics**: Data-driven insights and optimization

### Advanced Integrations
- **Voice AI**: Vapi AI for automated supplier calls
- **Document Management**: DocuSeal for contract automation
- **Communication**: Twilio SMS/Voice integration
- **Email Automation**: Resend for customer communication
- **Real-time Analytics**: Live performance monitoring

## Technology Stack

### Frontend
- **Framework**: Next.js 15.3.2 (App Router)
- **Language**: TypeScript
- **UI**: React 18 with Tailwind CSS
- **Components**: Radix UI + shadcn/ui
- **State Management**: TanStack Query (React Query)

### Backend
- **Runtime**: Node.js with Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js with Supabase
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Realtime subscriptions

### AI & Machine Learning
- **AI Framework**: LangChain
- **AI Providers**: OpenAI GPT-4, Perplexity AI
- **Voice AI**: Vapi AI (voice calling)
- **Text-to-Speech**: Vogent AI
- **AI SDK**: Vercel AI SDK

### Infrastructure
- **Hosting**: Vercel Platform
- **CDN**: Vercel Edge Network
- **Database**: Supabase (managed PostgreSQL)
- **Monitoring**: Built-in Vercel monitoring

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/motorminds.git
   cd motorminds
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure your environment variables:
   ```env
   # Database
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Authentication
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_nextauth_secret
   
   # AI Services
   OPENAI_API_KEY=your_openai_api_key
   PERPLEXITY_API_KEY=your_perplexity_api_key
   VAPI_API_KEY=your_vapi_api_key
   
   # External Services
   TWILIO_ACCOUNT_SID=your_twilio_sid
   TWILIO_AUTH_TOKEN=your_twilio_token
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open Application**
   Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

motorminds/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (features)/        # Feature-based routing
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (public)/         # Public routes
│   │   └── api/              # API routes
│   ├── components/           # Shared UI components
│   ├── lib/                  # Core libraries and utilities
│   ├── hooks/                # Custom React hooks
│   ├── contexts/             # React contexts
│   └── types/                # TypeScript type definitions
├── docs/                     # Private documentation (ignored by Git)
├── supabase/                 # Supabase configuration
└── public/                   # Static assets

## AI Diagnostics 3D Locator MVP

This repository includes a focused proof-of-concept integrated into the diagnostics session chat tool-renderer flow:

`user location request -> AI showComponentLocation tool call -> embedded 3D message block -> part highlight`

### Architecture

- `src/app/(features)/ai/diagnostics/components/ChatArea.tsx`
  - Keeps diagnostics layout stable (header + panel); no out-of-band 3D insertion.
- `src/app/(features)/ai/diagnostics/components/tool-renderers/ComponentLocationToolRenderer.tsx`
  - Embedded expandable/closeable 3D location block rendered inside the conversation stream.
- `src/app/(features)/ai/diagnostics/tools/rendering-tools.ts`
  - Defines `showComponentLocation` tool used by AI to signal in-message 3D location rendering.
- `src/app/(features)/ai/diagnostics/components/locator3d/VehicleDiagnosticsViewer.tsx`
  - React Three Fiber canvas, GLB loading, mesh highlighting, orbit/zoom controls, and camera focus.
- `src/lib/services/diagnostics-3d-locator-service.ts`
  - Deterministic symptom-to-component inference and strict Zod schema enforcement.
- `src/lib/services/diagnostics-3d-component-map.ts`
  - Canonical component IDs mapped to deterministic mesh names and tooltip labels.

### 3D Asset

- `public/models/diagnostics-demo-car.glb`
  - Lightweight generic car model for MVP visualization.
  - Contains named zones:
    - `mesh_battery_zone`
    - `mesh_starter_zone`
    - `mesh_alternator_zone`
    - `mesh_fuse_box_zone`

To regenerate the model:

```bash
node scripts/generate-diagnostics-demo-model.mjs
```