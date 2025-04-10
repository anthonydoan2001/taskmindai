import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import type { Database } from '@/types/supabase';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia'
});

// Initialize Supabase admin client
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Creates or retrieves a Stripe customer for the given user.
 */
export const createOrRetrieveCustomer = async ({
  uuid,
  email,
  referral
}: {
  uuid: string;
  email: string;
  referral?: string;
}) => {
  // Check if the customer already exists in our mapping table
  const { data: existingCustomer, error: queryError } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', uuid)
    .single();

  if (queryError) {
    throw queryError;
  }

  if (existingCustomer?.stripe_customer_id) {
    return existingCustomer.stripe_customer_id;
  }

  // If not found, create a new customer in Stripe
  const customerData: Stripe.CustomerCreateParams = {
    email,
    metadata: {
      supabaseUUID: uuid
    } as Stripe.Metadata
  };

  if (referral) {
    customerData.metadata = {
      ...customerData.metadata,
      referral
    };
  }

  const customer = await stripe.customers.create(customerData);

  // Map the Stripe customer to the Supabase user
  const { error: insertError } = await supabaseAdmin
    .from('customers')
    .insert([{ id: uuid, stripe_customer_id: customer.id }]);

  if (insertError) {
    throw insertError;
  }

  return customer.id;
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod
) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  
  //@ts-ignore
  await stripe.customers.update(customer, { name, phone, address });
  await supabaseAdmin.from('users').update({
    billing_address: { ...address },
    payment_method: { ...payment_method[payment_method.type] }
  }).eq('id', uuid);
};

/**
 * Manages the status of a subscription change.
 */
export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false
) => {
  // Get customer's UUID from mapping table
  const { data: customerData } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!customerData?.id) throw new Error('No customer found.');

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method']
  });

  // Update the subscription status in Supabase
  const subscriptionData = {
    id: subscription.id,
    user_id: customerData.id,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    quantity: subscription.items.data[0].quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
    canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    current_period_start: new Date(subscription.current_period_start * 1000),
    current_period_end: new Date(subscription.current_period_end * 1000),
    created: new Date(subscription.created * 1000),
    ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000) : null,
    trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
    trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  };

  if (createAction) {
    await supabaseAdmin.from('subscriptions').upsert([subscriptionData]);
  } else {
    await supabaseAdmin.from('subscriptions').update(subscriptionData)
      .eq('id', subscription.id);
  }

  // If there's a payment method, copy billing details to customer
  if (subscription.default_payment_method && createAction) {
    //@ts-ignore
    await copyBillingDetailsToCustomer(
      customerData.id,
      subscription.default_payment_method as Stripe.PaymentMethod
    );
  }
};

/**
 * Deletes a product record from Supabase.
 */
export const deleteProductRecord = async (product: Stripe.Product) => {
  const { error } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', product.id);
  
  if (error) throw error;
};

/**
 * Deletes a price record from Supabase.
 */
export const deletePriceRecord = async (price: Stripe.Price) => {
  const { error } = await supabaseAdmin
    .from('prices')
    .delete()
    .eq('id', price.id);
  
  if (error) throw error;
};

/**
 * Creates/updates a product record in Supabase.
 */
export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description,
    image: product.images?.[0] ?? null,
    metadata: product.metadata
  };

  const { error } = await supabaseAdmin
    .from('products')
    .upsert([productData]);
  
  if (error) throw error;
  
  return productData;
};

/**
 * Creates/updates a price record in Supabase.
 */
export const upsertPriceRecord = async (price: Stripe.Price) => {
  const priceData = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata
  };

  const { error } = await supabaseAdmin
    .from('prices')
    .upsert([priceData]);
  
  if (error) throw error;
  
  return priceData;
};

export { supabaseAdmin }; 