# MotorMinds Parts Request System

## Overview

The Parts Request System allows shop owners to submit requests for automotive parts through the MotorMinds platform. The system captures vehicle information, parts details, and customer requirements, then routes the requests to admin users for manual fulfillment.

## Workflow

### 1. **Shop Owner Workflow**
1. **Vehicle Selection**: Select year, make, model, and engine type
2. **Parts Discovery**: Browse catalog or use Mia AI to find parts
3. **Cart Management**: Add desired parts to cart
4. **Request Submission**: Add notes and submit parts request
5. **Confirmation**: Receive request ID and confirmation

### 2. **Admin/Backend Workflow** 
1. **Notification**: Receive email/Slack notifications for new requests
2. **Review**: Access admin panel to review request details
3. **Sourcing**: Contact Canadian suppliers (NAPA, Canadian Tire, Chase Auto, etc.)
4. **Status Updates**: Update request status as progress is made
5. **Quoting**: Provide pricing to customer
6. **Fulfillment**: Process orders and update completion status

## Technical Components

### Database Schema

**parts_requests** table:
- `id` - UUID primary key
- `shop_id` - Links to shop making request
- `user_id` - User who submitted request
- `vehicle_info` - JSONB with vehicle details
- `parts_requested` - JSONB array of requested parts
- `total_estimated_price` - Decimal estimate
- `status` - Enum: pending, processing, sourcing, quoted, approved, ordered, fulfilled, cancelled
- `priority` - Enum: low, normal, high, urgent
- `customer_notes` - Additional requirements
- `admin_notes` - Internal notes

**parts_request_messages** table:
- Communication log between users and admins
- Status change tracking
- Notification history

### API Endpoints

**POST /api/parts-requests/submit**
- Submits new parts request
- Validates user authentication and shop association
- Creates request record and initial message
- Triggers notifications to admin users

**GET /api/parts-requests/submit**
- Retrieves user's parts requests (filtered by shop)
- Admin users can see all requests

### Frontend Components

**Parts Ordering Page** (`/parts-ordering`)
- Vehicle selection workflow
- Parts catalog integration
- Mia AI chat assistant
- Cart management
- Request submission form

**Admin Interface** (`/admin/parts-requests`)
- Request list with filtering
- Detailed request view
- Status management
- Admin notes
- Real-time updates

### Notification System

**Email Notifications**
- HTML-formatted emails to admin team
- Includes shop details, vehicle info, parts summary
- Priority indicators and direct links to admin panel

**Slack Integration**
- Rich message blocks with key information
- Action buttons for quick access
- Priority-based color coding

**In-App Notifications**
- Database-stored messages for admin users
- Real-time updates in admin interface

## Configuration

### Environment Variables

**Database:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Email Notifications:**
- `SMTP_HOST` - Email server host
- `SMTP_PORT` - Email server port (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `ADMIN_NOTIFICATION_EMAILS` - Comma-separated admin email list

**Slack Notifications:**
- `SLACK_WEBHOOK_URL` - Slack incoming webhook URL

**General:**
- `NEXT_PUBLIC_APP_URL` - Application base URL for links

### Setup Instructions

1. **Database Migration**
   ```bash
   # Apply the parts request schema
   supabase migration up
   ```

2. **Admin User Setup**
   ```sql
   UPDATE users SET role = 'admin' WHERE id = 'your-admin-user-id';
   ```

3. **Email Configuration**
   - Set up SMTP server credentials
   - Configure admin notification email list
   - Test email delivery

4. **Slack Setup** (Optional)
   - Create Slack app and incoming webhook
   - Configure webhook URL in environment

## Usage Examples

### Shop Owner Submitting Request

1. Navigate to `/parts-ordering`
2. Select vehicle: "2015 Honda Civic"
3. Choose engine: "1.8L SOHC 4-cylinder"
4. Add parts to cart via catalog or Mia AI
5. Add notes: "Need parts urgently for customer pickup Monday"
6. Submit request
7. Receive confirmation with request ID

### Admin Processing Request

1. Receive email/Slack notification
2. Access admin panel at `/admin/parts-requests`
3. Review request details and customer notes
4. Update status to "sourcing"
5. Contact Canadian suppliers for pricing
6. Add admin notes with supplier quotes
7. Update status to "quoted"
8. Customer receives notification of quote availability

## Canadian Supplier Integration

The system is configured to work with major Canadian automotive parts suppliers:

- **NAPA Canada** - Primary OEM and aftermarket parts
- **Canadian Tire** - Consumer and professional auto parts
- **Chase Auto Parts** - Specialized aftermarket parts
- **PartSource** - Professional-grade automotive parts
- **Auto Value** - Independent dealer network
- **Uni-Select Canada** - Professional distribution network

Admin users manually contact these suppliers based on part requirements and provide real-time updates to customers.

## Security Features

- **Row Level Security (RLS)** - Shop data isolation
- **Authentication Required** - All endpoints require valid user session
- **Admin Role Verification** - Admin functions restricted to admin users
- **Data Validation** - Input sanitization and validation
- **Audit Trail** - Complete message history for all requests

## Monitoring and Analytics

The system logs:
- Request submission rates
- Processing times by status
- Supplier response patterns
- Customer satisfaction metrics
- Admin workload distribution

## Future Enhancements

1. **Supplier API Integration** - Direct integration with Canadian suppliers
2. **Automated Pricing** - Real-time price comparison
3. **Customer Portal** - Self-service status tracking
4. **Mobile App** - Native mobile experience
5. **AI Agent Integration** - Automated supplier communication
6. **Analytics Dashboard** - Business intelligence and reporting
