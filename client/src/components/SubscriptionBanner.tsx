import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";

interface SubscriptionBannerProps {
  status: "past_due" | "canceled" | "trial_ending";
  daysRemaining?: number;
}

/**
 * Subscription Banner Component
 * Displays warning banners for subscription issues
 */
export function SubscriptionBanner({
  status,
  daysRemaining,
}: SubscriptionBannerProps) {
  const { t } = useTranslation();

  if (status === "past_due") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("subscription.banner.pastDue.title")}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t("subscription.banner.pastDue.message")}</span>
          <Link href="/subscription">
            <Button variant="outline" size="sm" className="ml-4">
              <CreditCard className="h-4 w-4 mr-2" />
              {t("subscription.updatePaymentMethod")}
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "canceled") {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("subscription.banner.canceled.title")}</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{t("subscription.banner.canceled.message")}</span>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="ml-4">
              {t("subscription.viewPlans")}
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  if (status === "trial_ending" && daysRemaining !== undefined) {
    return (
      <Alert className="mb-6 bg-orange-50 border-orange-300">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertTitle className="text-orange-900">
          {t("subscription.banner.trialEnding.title")}
        </AlertTitle>
        <AlertDescription className="flex items-center justify-between text-orange-800">
          <span>
            {t("subscription.banner.trialEnding.message", {
              days: daysRemaining,
            })}
          </span>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="ml-4">
              {t("subscription.choosePlan")}
            </Button>
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
