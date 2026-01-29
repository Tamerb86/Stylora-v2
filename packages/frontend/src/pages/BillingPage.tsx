import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import type { Plan, SubscriptionInfo } from '../types';
import {
  CreditCard,
  Check,
  Loader2,
  ExternalLink,
  AlertCircle,
  Sparkles,
  Zap,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function BillingPage() {
  const { profile, refreshProfile } = useAuthStore();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [managingSubscription, setManagingSubscription] = useState(false);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      try {
        const [plansRes, subRes] = await Promise.all([
          api.getPlans(),
          api.getSubscription(),
        ]);

        if (plansRes.success && plansRes.data) {
          setPlans(plansRes.data.plans);
        }

        if (subRes.success && subRes.data) {
          setSubscription(subRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch billing data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  // Handle upgrade
  const handleUpgrade = async (planCode: 'pro' | 'business') => {
    setUpgrading(planCode);
    try {
      const response = await api.createCheckoutSession(planCode);
      if (response.success && response.data?.checkout_url) {
        window.location.href = response.data.checkout_url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create checkout session');
    } finally {
      setUpgrading(null);
    }
  };

  // Handle manage subscription
  const handleManageSubscription = async () => {
    setManagingSubscription(true);
    try {
      const response = await api.createPortalSession();
      if (response.success && response.data?.portal_url) {
        window.location.href = response.data.portal_url;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to open billing portal');
    } finally {
      setManagingSubscription(false);
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.')) {
      return;
    }

    try {
      await api.cancelSubscription();
      toast.success('Subscription cancelled. You will keep access until the end of your billing period.');
      // Refresh subscription data
      const subRes = await api.getSubscription();
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data);
      }
      refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    }
  };

  // Handle resume
  const handleResume = async () => {
    try {
      await api.resumeSubscription();
      toast.success('Subscription resumed!');
      // Refresh subscription data
      const subRes = await api.getSubscription();
      if (subRes.success && subRes.data) {
        setSubscription(subRes.data);
      }
      refreshProfile();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to resume subscription');
    }
  };

  const getPlanIcon = (code: string) => {
    switch (code) {
      case 'free':
        return Sparkles;
      case 'pro':
        return Zap;
      case 'business':
        return Crown;
      default:
        return Sparkles;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const currentPlan = profile?.planCode || 'free';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="text-gray-600 mt-1">Manage your subscription and billing details</p>
      </div>

      {/* Current Plan & Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Current Plan */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Current Plan</h2>
              <p className="text-sm text-gray-500">Your active subscription</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl font-bold text-gray-900 capitalize">
                {profile?.planName || 'Free'}
              </span>
              <span className={clsx(
                'badge',
                subscription?.subscription?.status === 'active' ? 'badge-success' :
                subscription?.subscription?.status === 'canceled' ? 'badge-warning' :
                'badge-gray'
              )}>
                {subscription?.subscription?.status || 'Active'}
              </span>
            </div>

            {subscription?.subscription && (
              <div className="text-sm text-gray-500 space-y-1">
                {subscription.subscription.currentPeriodEnd && (
                  <p>
                    {subscription.subscription.cancelAtPeriodEnd
                      ? 'Access until: '
                      : 'Renews on: '}
                    {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                )}
              </div>
            )}

            {subscription?.hasSubscription && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleManageSubscription}
                  disabled={managingSubscription}
                  className="btn-outline btn-sm"
                >
                  {managingSubscription ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-1" />
                      Manage
                    </>
                  )}
                </button>
                {subscription.subscription?.cancelAtPeriodEnd ? (
                  <button onClick={handleResume} className="btn-primary btn-sm">
                    Resume
                  </button>
                ) : (
                  <button onClick={handleCancel} className="btn-ghost btn-sm text-red-600">
                    Cancel
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Usage This Month</h2>
              <p className="text-sm text-gray-500">Content generations</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-gray-900">
                {subscription?.usage.currentMonthUsage || 0}
              </span>
              <span className="text-gray-500">
                / {subscription?.usage.monthlyLimit ?? '∞'}
              </span>
            </div>

            {subscription?.usage.monthlyLimit && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(
                      (subscription.usage.currentMonthUsage / subscription.usage.monthlyLimit) * 100,
                      100
                    )}%`,
                  }}
                />
              </div>
            )}

            <p className="text-sm text-gray-500">
              {subscription?.usage.remainingRequests !== null
                ? `${subscription.usage.remainingRequests} generations remaining`
                : 'Unlimited generations'}
            </p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.code);
            const isCurrentPlan = currentPlan === plan.code;
            const canUpgrade = !isCurrentPlan && plan.code !== 'free';

            return (
              <div
                key={plan.code}
                className={clsx(
                  'card p-6 relative',
                  plan.recommended && 'border-2 border-primary-500',
                  isCurrentPlan && 'bg-primary-50'
                )}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Recommended
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute top-4 right-4">
                    <span className="badge-primary">Current</span>
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className={clsx(
                    'w-10 h-10 rounded-lg flex items-center justify-center',
                    isCurrentPlan ? 'bg-primary-200' : 'bg-gray-100'
                  )}>
                    <Icon className={clsx(
                      'w-5 h-5',
                      isCurrentPlan ? 'text-primary-700' : 'text-gray-600'
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                    <p className="text-sm text-gray-500">
                      {plan.isUnlimited
                        ? 'Unlimited'
                        : `${plan.monthlyLimitRequests} generations/mo`}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                {canUpgrade ? (
                  <button
                    onClick={() => handleUpgrade(plan.code as 'pro' | 'business')}
                    disabled={upgrading === plan.code}
                    className={clsx(
                      'w-full',
                      plan.recommended ? 'btn-primary' : 'btn-outline'
                    )}
                  >
                    {upgrading === plan.code ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      `Upgrade to ${plan.name}`
                    )}
                  </button>
                ) : isCurrentPlan ? (
                  <button disabled className="btn-secondary w-full">
                    Current Plan
                  </button>
                ) : (
                  <button disabled className="btn-outline w-full opacity-50">
                    Free Plan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing FAQ</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">How do I cancel my subscription?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Click "Cancel" above or go to the billing portal. Your access will continue until the end of your billing period.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Can I change my plan?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Yes, you can upgrade or downgrade at any time. Changes take effect immediately, and we'll prorate the difference.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">What happens if I exceed my limit?</h3>
            <p className="text-sm text-gray-600 mt-1">
              You won't be able to generate new content until your limit resets at the start of the next billing period, or you can upgrade to a higher plan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
