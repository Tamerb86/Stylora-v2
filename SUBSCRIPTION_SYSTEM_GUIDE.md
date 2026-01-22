# Stripe Billing Subscription System - Implementation Guide

## 📋 Overview

This document provides comprehensive documentation for the Stripe Billing subscription system implemented in Stylora v2. The system enables SaaS-style subscriptions with three pricing tiers: Start, Pro, and Premium.

## 🏗️ Architecture

### Backend Components

#### 1. Database Schema (`drizzle/schema.ts`)
- **subscriptionPlans**: Stores available subscription plans
  - `stripePriceId`: Stripe Price ID for billing
  - `displayNameNo/En/Ar`: Localized plan names
  - `priceMonthly/Yearly`: Pricing tiers
  - `maxEmployees`: Employee limit per plan
  - `smsQuota`: SMS message quota
  - `features`: JSON array of enabled features

- **tenantSubscriptions**: Tracks tenant subscription status
  - `stripeSubscriptionId`: Stripe subscription ID
  - `stripeCustomerId`: Stripe customer ID
  - `status`: active | past_due | canceled | paused
  - `currentPeriodStart/End`: Billing cycle dates
  - `cancelAtPeriodEnd`: Scheduled cancellation flag
  - `canceledAt`: Cancellation timestamp

#### 2. Services (`server/services/subscriptionService.ts`)
Core functions for subscription management:
- `createStripeCustomer()` - Create/retrieve Stripe customer
- `createCheckoutSession()` - Initialize subscription payment
- `createBillingPortalSession()` - Manage payment methods
- `getSubscriptionStatus()` - Fetch subscription details
- `cancelSubscription()` - Cancel at period end
- `changePlan()` - Upgrade/downgrade with proration
- `handleSubscriptionUpdate()` - Webhook handler for updates
- `handleSubscriptionDeleted()` - Webhook handler for deletions

#### 3. tRPC Router (`server/routers/subscriptions.ts`)
API endpoints:
- `getPlans` (public) - List available plans
- `getCurrentSubscription` (protected) - Get tenant subscription
- `createCheckoutSession` (protected) - Start subscription
- `createPortalSession` (protected) - Access billing portal
- `cancelSubscription` (admin-only) - Cancel subscription
- `changePlan` (admin-only) - Change subscription tier

#### 4. Webhook Handler (`server/stripe-subscription-webhook.ts`)
Processes Stripe events:
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

#### 5. Plan Limits Middleware (`server/middleware/planLimits.ts`)
Enforces subscription limits:
- `getSubscriptionLimits()` - Fetch plan limits
- `canAddEmployee()` - Check employee count
- `hasFeatureAccess()` - Validate feature access
- `enforceEmployeeLimit()` - Throw error if limit exceeded
- `enforceFeatureAccess()` - Throw error if feature unavailable
- `enforceActiveSubscription()` - Require active subscription

### Frontend Components

#### 1. Pricing Page (`client/src/pages/Pricing.tsx`)
Public page displaying:
- Three subscription tiers with pricing
- Feature comparison
- FAQ section
- Call-to-action buttons
- Multi-language support (NO, EN, AR)

#### 2. Subscription Settings (`client/src/pages/SubscriptionSettings.tsx`)
Tenant dashboard for:
- Current plan details
- Billing cycle information
- Upgrade/downgrade options
- Payment method management (via Stripe Portal)
- Subscription cancellation
- Past due payment warnings

#### 3. Subscription Banner (`client/src/components/SubscriptionBanner.tsx`)
Warning banners for:
- Past due payments
- Canceled subscriptions
- Trial expiration (3 days before)

## 🔧 Setup Instructions

### 1. Environment Variables

Add to `.env` file:
```env
# Stripe Secret Key (existing)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (new)
STRIPE_PRICE_ID_START=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_PREMIUM=price_...
```

### 2. Database Migration

Run the migration to add new columns:
```bash
mysql -u username -p database_name < drizzle/migrations/add_subscription_billing_fields.sql
```

Or manually run:
```sql
ALTER TABLE subscriptionPlans 
  ADD COLUMN displayNameEn VARCHAR(100),
  ADD COLUMN displayNameAr VARCHAR(100),
  ADD COLUMN priceYearly DECIMAL(10, 2),
  ADD COLUMN stripePriceId VARCHAR(255);

ALTER TABLE tenantSubscriptions
  ADD COLUMN stripeCustomerId VARCHAR(255),
  ADD COLUMN cancelAtPeriodEnd BOOLEAN DEFAULT FALSE,
  ADD COLUMN canceledAt TIMESTAMP NULL;
```

### 3. Configure Stripe

#### Create Products & Prices in Stripe Dashboard
1. Go to Stripe Dashboard → Products
2. Create three products:
   - **Start Plan**: 299 kr/month
   - **Pro Plan**: 799 kr/month
   - **Premium Plan**: 1499 kr/month
3. Copy the Price IDs (e.g., `price_1ABC...`) to `.env`

#### Update Database with Price IDs
```sql
UPDATE subscriptionPlans 
SET stripePriceId = 'price_1ABC...' 
WHERE name = 'Start';

UPDATE subscriptionPlans 
SET stripePriceId = 'price_1DEF...' 
WHERE name = 'Pro';

UPDATE subscriptionPlans 
SET stripePriceId = 'price_1GHI...' 
WHERE name = 'Premium';
```

#### Configure Webhook
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/stripe/subscription-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
4. Copy webhook secret to `STRIPE_WEBHOOK_SECRET` in `.env`

### 4. Stripe Billing Portal Configuration
1. Go to Stripe Dashboard → Settings → Billing → Customer Portal
2. Enable "Customer portal is active"
3. Configure allowed actions:
   - ✅ Update payment methods
   - ✅ Update subscriptions (upgrade/downgrade)
   - ✅ Cancel subscriptions
4. Set cancellation behavior: "Cancel at end of billing period"

## 📊 Subscription Plans

| Plan | Price/Month | Employees | SMS Quota | Features |
|------|-------------|-----------|-----------|----------|
| Start | 299 kr | 1 | 100 | Basic (appointments, customers, online booking) |
| Pro | 799 kr | 5 | 500 | + Inventory, Commissions, Advanced Reports |
| Premium | 1499 kr | Unlimited | 2000 | + API Access, Multi-location, Custom Integrations |

## 🔒 Feature Gating

### Usage in tRPC Procedures
```typescript
import { enforceEmployeeLimit, enforceFeatureAccess } from "../middleware/planLimits";

// Example: Enforce employee limit when creating employee
const createEmployee = tenantProcedure
  .input(/* schema */)
  .mutation(async ({ ctx, input }) => {
    // Check limit before creation
    await enforceEmployeeLimit(ctx.tenantId);
    
    // Create employee...
  });

// Example: Enforce feature access for inventory
const getInventory = tenantProcedure.query(async ({ ctx }) => {
  await enforceFeatureAccess(ctx.tenantId, "inventory");
  
  // Return inventory...
});
```

## 🔄 Subscription Lifecycle

### 1. New Subscription
1. User clicks "Start Now" on `/pricing`
2. Frontend calls `createCheckoutSession` mutation
3. Backend creates Stripe Checkout Session
4. User redirected to Stripe-hosted checkout
5. On success, webhook `customer.subscription.created` fires
6. Backend updates `tenantSubscriptions` table
7. Tenant status changes to "active"

### 2. Upgrade/Downgrade
1. User clicks "Change Plan" in `/subscription`
2. Selects new plan in dialog
3. Frontend calls `changePlan` mutation
4. Backend updates Stripe subscription with proration
5. Webhook `customer.subscription.updated` fires
6. Database updated with new plan

### 3. Payment Failure
1. Stripe attempts to charge card
2. Payment fails → webhook `invoice.payment_failed` fires
3. Backend updates subscription status to "past_due"
4. Banner shows on dashboard with "Update Payment Method" button
5. User clicks button → opens Stripe Billing Portal
6. User updates card → next charge succeeds

### 4. Cancellation
1. User clicks "Cancel Subscription"
2. Confirmation dialog appears
3. Backend calls Stripe to cancel at period end
4. `cancelAtPeriodEnd` flag set to true
5. Orange banner shows: "Your subscription will end on [date]"
6. At period end, webhook `customer.subscription.deleted` fires
7. Tenant status changes to "canceled"

## 🌐 Localization

All subscription UI supports three languages:
- **Norwegian (no)**: Primary language
- **English (en)**: Secondary
- **Arabic (ar)**: RTL support

Translation keys are in:
- `client/src/i18n/locales/no.json`
- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/ar.json`

## 🧪 Testing

### Test Subscription Flow
1. Use Stripe test mode (`sk_test_...`)
2. Test card: `4242 4242 4242 4242` (expires: any future date, CVC: any 3 digits)
3. Create subscription through `/pricing`
4. Verify webhook events in Stripe Dashboard → Developers → Events
5. Check database for subscription record
6. Test upgrade/downgrade
7. Test cancellation

### Test Webhooks Locally
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/stripe/subscription-webhook

# Trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
```

## 🚨 Error Handling

### Common Issues

**Issue**: Webhook signature verification fails
**Solution**: Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret in Stripe Dashboard

**Issue**: Price ID not found
**Solution**: Ensure `stripePriceId` is set in `subscriptionPlans` table and matches Stripe Price ID

**Issue**: "No active subscription" error
**Solution**: Check that webhook events are being received and processed correctly

**Issue**: Plan limits not enforced
**Solution**: Ensure `enforceEmployeeLimit()` and `enforceFeatureAccess()` are called in relevant procedures

## 📈 Monitoring

### Key Metrics to Track
- Active subscriptions by plan
- Monthly Recurring Revenue (MRR)
- Churn rate
- Failed payment rate
- Average subscription lifetime
- Upgrade/downgrade rates

### Stripe Dashboard
Monitor in Stripe Dashboard → Billing:
- Subscription growth
- Failed payments
- Cancellations
- Revenue

## 🔐 Security Considerations

1. **Webhook Signature Verification**: Always verify Stripe webhook signatures
2. **Tenant Isolation**: All DB queries filtered by `tenantId`
3. **Admin-Only Actions**: Cancellation and plan changes require admin role
4. **Rate Limiting**: Webhook endpoint has rate limiting (100 req/min)
5. **HTTPS Only**: Webhooks must use HTTPS in production

## 📝 Future Enhancements

- [ ] Add annual billing with discount
- [ ] Implement SMS usage tracking
- [ ] Add multi-location support for Premium plan
- [ ] Create admin dashboard for subscription analytics
- [ ] Add email notifications for subscription events
- [ ] Implement trial period (14 days)
- [ ] Add coupon/promo code support
- [ ] Create subscription renewal emails
- [ ] Add payment retry logic for failed payments
- [ ] Implement usage-based billing for API access

## 🆘 Support

For issues or questions:
1. Check Stripe Dashboard logs
2. Review server logs for webhook processing
3. Verify database `tenantSubscriptions` records
4. Check browser console for frontend errors
5. Contact support@stylora.no

## 📚 References

- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/integrating-customer-portal)
