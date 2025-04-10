import Stripe from 'stripe';
import { stripe } from '@/utils/stripe/config';
import {
  upsertProductRecord,
  upsertPriceRecord,
  manageSubscriptionStatusChange,
  deleteProductRecord,
  deletePriceRecord,
} from '@/utils/supabase/admin';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return new Response('Webhook secret not found.', { status: 400 });
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.log(`🔔  Webhook received: ${event.type}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`❌ Error message: ${errorMessage}`);
    return new Response(`Webhook Error: ${errorMessage}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated': {
          const product = event.data.object as Stripe.Product;
          await upsertProductRecord(product);
          break;
        }
        case 'price.created':
        case 'price.updated': {
          const price = event.data.object as Stripe.Price;
          await upsertPriceRecord(price);
          break;
        }
        case 'price.deleted': {
          const price = event.data.object as Stripe.Price;
          await deletePriceRecord(price);
          break;
        }
        case 'product.deleted': {
          const product = event.data.object as Stripe.Product;
          await deleteProductRecord(product);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          await manageSubscriptionStatusChange(
            subscription.id,
            subscription.customer as string,
            event.type === 'customer.subscription.created',
          );
          break;
        }
        case 'checkout.session.completed': {
          const checkoutSession = event.data.object as Stripe.Checkout.Session;
          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await manageSubscriptionStatusChange(
              subscriptionId as string,
              checkoutSession.customer as string,
              true,
            );
          }
          break;
        }
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.log(errorMessage);
      return new Response('Webhook handler failed. View your Next.js function logs.', {
        status: 400,
      });
    }
  } else {
    return new Response(`Unsupported event type: ${event.type}`);
  }
  return new Response(JSON.stringify({ received: true }));
}
