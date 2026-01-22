import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Check, CreditCard, Calendar, AlertCircle, ExternalLink } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { format } from "date-fns";
import { useState } from "react";

/**
 * Subscription Management Page
 * Allows tenants to view and manage their subscription
 */
export default function SubscriptionSettings() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  // Fetch current subscription
  const { data: subscriptionData, isLoading: isLoadingSubscription } =
    trpc.subscriptions.getCurrentSubscription.useQuery();

  // Fetch all plans for upgrade/downgrade
  const { data: plans, isLoading: isLoadingPlans } =
    trpc.subscriptions.getPlans.useQuery();

  // Create billing portal session
  const portalMutation = trpc.subscriptions.createPortalSession.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe billing portal
      window.location.href = data.url;
    },
    onError: (error) => {
      toast.error(error.message || t("subscription.errors.portalFailed"));
    },
  });

  // Cancel subscription
  const cancelMutation = trpc.subscriptions.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success(t("subscription.cancelSuccess"));
      // Refetch subscription data
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || t("subscription.errors.cancelFailed"));
    },
  });

  // Change plan
  const changePlanMutation = trpc.subscriptions.changePlan.useMutation({
    onSuccess: () => {
      toast.success(t("subscription.changePlanSuccess"));
      setIsUpgradeDialogOpen(false);
      // Refetch subscription data
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message || t("subscription.errors.changePlanFailed"));
    },
  });

  const getPlanDisplayName = (plan: any) => {
    if (currentLang === "en" && plan.displayNameEn) return plan.displayNameEn;
    if (currentLang === "ar" && plan.displayNameAr) return plan.displayNameAr;
    return plan.displayNameNo || plan.name;
  };

  const handleOpenBillingPortal = () => {
    const returnUrl = window.location.origin + window.location.pathname;
    portalMutation.mutate({ returnUrl });
  };

  const handleCancelSubscription = () => {
    cancelMutation.mutate();
  };

  const handleChangePlan = () => {
    if (selectedPlanId) {
      changePlanMutation.mutate({ newPlanId: selectedPlanId });
    }
  };

  if (isLoadingSubscription || isLoadingPlans) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-slate-600">{t("common.loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const { subscription, plan, isActive, daysUntilRenewal } =
    subscriptionData || {};
  const isPastDue = subscription?.status === "past_due";
  const isCanceled = subscription?.status === "canceled";
  const willCancelAtPeriodEnd = subscription?.cancelAtPeriodEnd;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {t("subscription.title")}
          </h1>
          <p className="text-slate-600 mt-2">{t("subscription.subtitle")}</p>
        </div>

        {/* Payment Warning Banner */}
        {isPastDue && (
          <Card className="border-red-300 bg-red-50">
            <CardContent className="flex items-start gap-4 pt-6">
              <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-1">
                  {t("subscription.pastDue.title")}
                </h3>
                <p className="text-red-800 mb-3">
                  {t("subscription.pastDue.message")}
                </p>
                <Button
                  variant="destructive"
                  onClick={handleOpenBillingPortal}
                  disabled={portalMutation.isPending}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {t("subscription.updatePaymentMethod")}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cancellation Warning */}
        {willCancelAtPeriodEnd && !isCanceled && (
          <Card className="border-orange-300 bg-orange-50">
            <CardContent className="flex items-start gap-4 pt-6">
              <AlertCircle className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 mb-1">
                  {t("subscription.cancelScheduled.title")}
                </h3>
                <p className="text-orange-800">
                  {t("subscription.cancelScheduled.message", {
                    date: subscription?.currentPeriodEnd
                      ? format(new Date(subscription.currentPeriodEnd), "dd.MM.yyyy")
                      : "",
                  })}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Subscription Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t("subscription.current.title")}</span>
              {isActive && (
                <Badge className="bg-green-600">
                  {t("subscription.status.active")}
                </Badge>
              )}
              {isPastDue && (
                <Badge variant="destructive">
                  {t("subscription.status.pastDue")}
                </Badge>
              )}
              {isCanceled && (
                <Badge variant="secondary">
                  {t("subscription.status.canceled")}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {t("subscription.current.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {plan ? (
              <>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    {getPlanDisplayName(plan)}
                  </h3>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {plan.priceMonthly} kr
                    <span className="text-lg text-slate-600 font-normal">
                      /{t("pricing.month")}
                    </span>
                  </p>
                </div>

                {/* Plan Features */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-slate-900">
                    {t("subscription.features.title")}
                  </h4>
                  <div className="grid gap-2">
                    {plan.maxEmployees && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-600" />
                        {t("subscription.features.employees", {
                          count: plan.maxEmployees === 999 ? "∞" : plan.maxEmployees,
                        })}
                      </div>
                    )}
                    {plan.smsQuota && (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="h-4 w-4 text-green-600" />
                        {t("subscription.features.sms", { count: plan.smsQuota })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Renewal Information */}
                {subscription?.currentPeriodEnd && (
                  <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-slate-600" />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {t("subscription.renewalDate")}
                      </p>
                      <p className="text-sm text-slate-600">
                        {format(
                          new Date(subscription.currentPeriodEnd),
                          "dd.MM.yyyy"
                        )}{" "}
                        ({daysUntilRenewal}{" "}
                        {t("subscription.daysRemaining")})
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handleOpenBillingPortal}
                    disabled={portalMutation.isPending}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {t("subscription.managePayment")}
                    <ExternalLink className="h-4 w-4 ml-2" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setIsUpgradeDialogOpen(true)}
                  >
                    {t("subscription.changePlan")}
                  </Button>

                  {!willCancelAtPeriodEnd && !isCanceled && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="ml-auto">
                          {t("subscription.cancel")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {t("subscription.cancelConfirm.title")}
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("subscription.cancelConfirm.message")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>
                            {t("common.cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleCancelSubscription}
                            disabled={cancelMutation.isPending}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {t("subscription.cancelConfirm.confirm")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-600 mb-4">
                  {t("subscription.noSubscription")}
                </p>
                <Button onClick={() => (window.location.href = "/pricing")}>
                  {t("subscription.viewPlans")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans Dialog */}
        <AlertDialog
          open={isUpgradeDialogOpen}
          onOpenChange={setIsUpgradeDialogOpen}
        >
          <AlertDialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("subscription.changePlanDialog.title")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("subscription.changePlanDialog.description")}
              </AlertDialogDescription>
            </AlertDialogHeader>

            <div className="grid md:grid-cols-3 gap-4 py-4">
              {plans?.map((availablePlan) => {
                const isCurrent = availablePlan.id === plan?.id;
                return (
                  <Card
                    key={availablePlan.id}
                    className={`cursor-pointer transition-all ${
                      selectedPlanId === availablePlan.id
                        ? "border-blue-500 border-2"
                        : isCurrent
                        ? "border-green-500"
                        : ""
                    }`}
                    onClick={() => !isCurrent && setSelectedPlanId(availablePlan.id)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getPlanDisplayName(availablePlan)}
                        {isCurrent && (
                          <Badge className="ml-2 bg-green-600">
                            {t("subscription.currentPlan")}
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-2xl font-bold text-blue-600">
                        {availablePlan.priceMonthly} kr
                        <span className="text-sm text-slate-600 font-normal">
                          /{t("pricing.month")}
                        </span>
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {availablePlan.maxEmployees && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>
                              {t("subscription.features.employees", {
                                count:
                                  availablePlan.maxEmployees === 999
                                    ? "∞"
                                    : availablePlan.maxEmployees,
                              })}
                            </span>
                          </div>
                        )}
                        {availablePlan.smsQuota && (
                          <div className="flex items-center gap-2">
                            <Check className="h-4 w-4 text-green-600" />
                            <span>
                              {t("subscription.features.sms", {
                                count: availablePlan.smsQuota,
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleChangePlan}
                disabled={
                  !selectedPlanId ||
                  selectedPlanId === plan?.id ||
                  changePlanMutation.isPending
                }
              >
                {changePlanMutation.isPending
                  ? t("common.processing")
                  : t("subscription.confirmChange")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}
