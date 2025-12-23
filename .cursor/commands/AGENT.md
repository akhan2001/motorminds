# MotorMinds Development Agent Guide

This document provides essential context for AI agents working on the MotorMinds codebase, combining engineering standards, architecture, and business roadmap information.

## 📋 Quick Reference

### Project Overview
MotorMinds is an AI-powered automotive shop management platform built on Next.js, TypeScript, and Supabase. The platform serves as the "Operating System for Automotive Repair" with a vision to become the software layer powering autonomous repair infrastructure by 2045.

### Key Technologies
- **Frontend**: Next.js (App Router), TypeScript, Tailwind, shadcn/ui, TanStack Query
- **Backend**: Next.js API Routes, Supabase (PostgreSQL), NextAuth.js
- **AI**: LangChain, OpenAI GPT-4, Perplexity AI, Vapi AI, Vercel AI SDK
- **Infrastructure**: Vercel (hosting), Supabase (database/auth), Cloudflare

---

## 🏗️ Architecture Guidelines

### Directory Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (features)/        # Feature-based routing
│   ├── (auth)/           # Authentication routes
│   ├── (public)/         # Public routes
│   └── api/              # API routes
├── components/           # Shared UI components
│   ├── ui/               # Base UI components
│   ├── common/           # Common business components
│   └── layout/           # Layout components
├── lib/                  # Core libraries
│   ├── core/             # Core functionality
│   ├── integrations/     # External integrations
│   ├── utils/            # Utility functions
│   └── database/         # Database utilities
├── hooks/                # Custom React hooks
├── contexts/             # React contexts
├── types/                # TypeScript type definitions
└── data/                 # Static data and configurations
```

### Key Architecture Components
- **Multi-tenant Architecture**: Shop-based data isolation
- **API Layer**: Next.js API Routes with authentication
- **Database**: Supabase PostgreSQL with Row-Level Security (RLS)
- **External Services**: OpenAI, Vapi AI, Twilio, DocuSeal, Resend

---

## 📝 Coding Standards

### Naming Conventions
- **Files**: kebab-case (e.g., `user-profile.tsx`)
- **Components**: PascalCase (e.g., `UserProfile`)
- **Functions**: camelCase (e.g., `getUserProfile`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Types**: PascalCase (e.g., `UserProfile`)

### TypeScript Configuration
- Strict mode enabled
- `noImplicitAny`, `noImplicitReturns`, `noImplicitThis`
- `noUnusedLocals`, `noUnusedParameters`

### React Standards
- Use functional components with hooks
- Extract reusable logic into custom hooks
- Define explicit props interfaces
- Use React.memo, useMemo, useCallback for optimization
- Implement error boundaries for error handling

### API Standards
- Follow RESTful design conventions
- Use appropriate HTTP status codes
- Consistent error response format
- Validate all input data
- Implement rate limiting for all endpoints

### Database Standards
- Normalized database schema
- Proper database indexing
- Version-controlled database migrations
- Row-level security (RLS) enabled
- Regular automated backups

---

## 🧪 Testing Requirements

### Unit Testing
- **Coverage**: Minimum 80% code coverage
- **Framework**: Jest + React Testing Library
- **Pattern**: Arrange, Act, Assert
- **Isolation**: Tests should be independent

### Test Structure
```typescript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Arrange
    const props = { ... };
    
    // Act
    render(<Component {...props} />);
    
    // Assert
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

---

## 🔒 Security Standards

### Authentication & Authorization
- JWT tokens for authentication
- Role-based access control (RBAC): Admin, Shop Manager, Mechanic
- Secure session handling
- Multi-tenant data isolation

### Data Protection
- Encrypt sensitive data
- Validate all user input
- Use parameterized queries (prevent SQL injection)
- Sanitize user input (prevent XSS)
- Implement CSRF tokens

### API Security
- Rate limiting on all endpoints
- Proper CORS configuration
- Security headers
- Force HTTPS in production
- Secure API key management

---

## 📊 Performance Standards

### Frontend Performance
- Bundle size under 500KB
- First contentful paint under 2s
- Lazy loading for routes
- Proper caching strategies
- Optimize images (WebP format)

### Backend Performance
- API responses under 200ms
- Optimize database queries
- Implement Redis caching
- Use connection pooling
- Monitor performance metrics

### Database Performance
- Proper database indexing
- Optimize slow queries
- Efficient connection management
- Regular automated backups
- Database performance monitoring

---

## 🚀 Current Development Focus (2025)

### Key Features
- ✅ Appointment Scheduling
- ✅ Work Orders Management
- ✅ Invoice Generation
- ✅ Email & SMS Communication (Twilio + Resend)
- ✅ AI Diagnostics Assistant (Mia)
- ✅ AI Parts Sourcing (Vapi AI Voice Integration)
- ✅ Financial Analytics Dashboard
- ⚙️ Supplier API Integrations (Nexpart, AutoParts, etc.)

### Technical Priorities
- Optimize database structure (Supabase, Postgres multi-tenant)
- Enhance API efficiency with caching and parallelized fetching
- Implement CI/CD pipelines for rapid iteration
- Add business telemetry for customer success insights

---

## 🧭 Development Guidelines

### When Adding New Features
1. Follow the directory structure conventions
2. Use TypeScript with strict typing
3. Implement proper error handling
4. Add unit tests (80% coverage minimum)
5. Document complex logic
6. Follow RESTful API design
7. Implement rate limiting
8. Add proper database indexing
9. Ensure multi-tenant data isolation
10. Optimize for performance targets

### When Modifying Existing Code
1. Maintain existing code style and patterns
2. Update tests if behavior changes
3. Preserve backward compatibility when possible
4. Update documentation if needed
5. Check for security implications
6. Verify performance impact

### Code Review Checklist
- [ ] TypeScript types are properly defined
- [ ] Tests are included and passing
- [ ] Error handling is implemented
- [ ] Security best practices followed
- [ ] Performance considerations addressed
- [ ] Documentation updated if needed
- [ ] Follows naming conventions
- [ ] Multi-tenant isolation maintained

---

## 📚 Additional Resources

- **Engineering Standards**: `docs/engineering/standards.md`
- **Architecture Details**: `docs/engineering/architecture.md`
- **Product Roadmap**: `docs/business/roadmap.md`

---

## 🎯 Vision Context

MotorMinds is building toward becoming the **Operating System for Automotive Repair** by 2045. Current development (2025) focuses on foundation and stability, with future phases including:
- **2026**: Enterprise readiness (MSOs, multi-shop support)
- **2027-2029**: Intelligence layer (predictive AI, fleet management)
- **2030-2035**: Robotics integration (IoT, automated tools)
- **2035-2040**: Global network (connected AI cloud)
- **2040-2045**: Full autonomy (autonomous repair ecosystems)

Keep this long-term vision in mind when making architectural decisions.

---

*Last updated: [Current Date]*

