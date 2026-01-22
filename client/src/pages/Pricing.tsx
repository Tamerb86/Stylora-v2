import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Footer from "@/components/Footer";

/**
 * Pricing Page
 * Public page showing subscription plans for new customers
 * Supports Norwegian, English, and Arabic languages
 */
export default function Pricing() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language;
  
  // Fetch available plans
  const { data: plans, isLoading } = trpc.subscriptions.getPlans.useQuery();

  // Plan feature details by plan name
  const planFeatures: Record<string, { features: string[]; highlight?: boolean }> = {
    Start: {
      features: [
        t("pricing.features.appointments"),
        t("pricing.features.customers"),
        t("pricing.features.onlineBooking"),
        t("pricing.features.smsReminders"),
        t("pricing.features.basicReports"),
      ],
    },
    Pro: {
      features: [
        t("pricing.features.allStart"),
        t("pricing.features.inventory"),
        t("pricing.features.commissions"),
        t("pricing.features.advancedReports"),
        t("pricing.features.prioritySupport"),
      ],
      highlight: true,
    },
    Premium: {
      features: [
        t("pricing.features.allPro"),
        t("pricing.features.apiAccess"),
        t("pricing.features.multiLocation"),
        t("pricing.features.customIntegrations"),
        t("pricing.features.dedicatedSupport"),
      ],
    },
  };

  const getPlanDisplayName = (plan: any) => {
    if (currentLang === "en" && plan.displayNameEn) return plan.displayNameEn;
    if (currentLang === "ar" && plan.displayNameAr) return plan.displayNameAr;
    return plan.displayNameNo || plan.name;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/">
            <a className="text-2xl font-bold text-blue-600">Stylora</a>
          </Link>
          <div className="flex gap-4">
            <Link href="/login">
              <Button variant="ghost">{t("auth.signIn")}</Button>
            </Link>
            <Link href="/signup">
              <Button>{t("auth.signUp")}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          {t("pricing.title")}
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          {t("pricing.subtitle")}
        </p>
        <Badge variant="secondary" className="text-sm py-2 px-4">
          {t("pricing.trial")}
        </Badge>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans?.map((plan) => {
            const features = planFeatures[plan.name] || { features: [] };
            const isHighlight = features.highlight;

            return (
              <Card
                key={plan.id}
                className={`relative ${
                  isHighlight
                    ? "border-blue-500 border-2 shadow-xl scale-105"
                    : "border-slate-200"
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1">
                      {t("pricing.mostPopular")}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="text-2xl mb-2">
                    {getPlanDisplayName(plan)}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">
                      {plan.priceMonthly} kr
                    </span>
                    <span className="text-slate-600">/{t("pricing.month")}</span>
                  </div>
                  {plan.maxEmployees && (
                    <CardDescription className="mt-2">
                      {t("pricing.upToEmployees", {
                        count: plan.maxEmployees === 999 ? "∞" : plan.maxEmployees,
                      })}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {features.features.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {plan.smsQuota && (
                    <div className="pt-4 border-t border-slate-200">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-blue-600" />
                        <span>
                          {t("pricing.smsQuota", { count: plan.smsQuota })}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link href="/signup">
                    <Button
                      className={`w-full mt-6 ${
                        isHighlight
                          ? "bg-blue-600 hover:bg-blue-700"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      {t("pricing.startNow")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-slate-900">
            {t("pricing.faq.title")}
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("pricing.faq.trial.question")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {t("pricing.faq.trial.answer")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("pricing.faq.cancel.question")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {t("pricing.faq.cancel.answer")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {t("pricing.faq.upgrade.question")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">
                  {t("pricing.faq.upgrade.answer")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
