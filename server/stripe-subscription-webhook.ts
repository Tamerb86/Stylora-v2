import type { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "./stripe";
import { ENV } from "./_core/env";
import {
  handleSubscriptionUpdate,
  handleSubscriptionDeleted,
} from "./services/subscriptionService";

/**
 * Stripe Subscription Webhook Handler
 * Processes subscription lifecycle events from Stripe
 * 
 * Supported events:
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.paid
 * - invoice.payment_failed
 */

export async function handleStripeSubscriptionWebhook(
  req: Request,
  res: Response
): Promise<void> {
  if (!stripe) {
    console.error("[Stripe Subscription Webhook] Stripe not configured");
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig) {
    console.error("[Stripe Subscription Webhook] Missing signature");
    res.status(400).json({ error: "Missing signature" });
    return;
  }

  if (!ENV.stripeWebhookSecret) {
    console.error("[Stripe Subscription Webhook] Webhook secret not configured");
    res.status(500).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      ENV.stripeWebhookSecret
    );
  } catch (err) {
    const error = err as Error;
    console.error("[Stripe Subscription Webhook] Signature verification failed:", error.message);
    res.status(400).json({ error: `Webhook signature verification failed: ${error.message}` });
    return;
  }

  console.log(`[Stripe Subscription Webhook] Event received: ${event.type}`);

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe Subscription Webhook] Processing subscription ${event.type}:`,
          subscription.id
        );
        
        await handleSubscriptionUpdate(subscription);
        console.log(
          `[Stripe Subscription Webhook] Successfully processed ${event.type}`
        );
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(
          `[Stripe Subscription Webhook] Processing subscription deleted:`,
          subscription.id
        );
        
        await handleSubscriptionDeleted(subscription);
        console.log(
          `[Stripe Subscription Webhook] Successfully processed subscription.deleted`
        );
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(
          `[Stripe Subscription Webhook] Invoice paid:`,
          invoice.id,
          `for subscription:`,
          invoice.subscription
        );
        
        // If this is a subscription invoice, fetch and update the subscription
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionUpdate(subscription);
          console.log(
            `[Stripe Subscription Webhook] Updated subscription after invoice payment`
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(
          `[Stripe Subscription Webhook] Invoice payment failed:`,
          invoice.id,
          `for subscription:`,
          invoice.subscription
        );
        
        // If this is a subscription invoice, fetch and update the subscription
        // The subscription status will be automatically updated to 'past_due'
        if (invoice.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription as string
          );
          await handleSubscriptionUpdate(subscription);
          console.log(
            `[Stripe Subscription Webhook] Updated subscription after payment failure`
          );
        }
        
        // TODO: Send email notification about payment failure
        break;
      }

      default:
        console.log(
          `[Stripe Subscription Webhook] Unhandled event type: ${event.type}`
        );
    }

    res.json({ received: true });
  } catch (error) {
    const err = error as Error;
    console.error(
      `[Stripe Subscription Webhook] Error processing ${event.type}:`,
      err.message
    );
    res.status(500).json({ error: "Webhook processing failed" });
  }
}
