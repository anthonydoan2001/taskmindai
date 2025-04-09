import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      }
    }
  }
)

async function syncUserWithSupabase(event: WebhookEvent) {
  console.log('Processing webhook event:', event.type);
  console.log('Event data:', JSON.stringify(event.data, null, 2));
  
  // Handle user creation
  if (event.type === 'user.created') {
    console.log('Creating new user in Supabase');
    const { id, email_addresses, first_name, last_name, image_url } = event.data

    const primaryEmail = email_addresses?.[0]?.email_address

    // Create user in Supabase
    const { data: userData, error: userError } = await supabase.from('users').insert({
      clerk_id: id, // Use Clerk's ID as clerk_id
      email: primaryEmail
    }).select()

    if (userError) {
      console.error('Error creating user in Supabase:', userError)
      console.error('Failed insert data:', { clerk_id: id, email: primaryEmail })
      return new Response(JSON.stringify({ error: userError.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabase.from('user_profiles').insert({
      id: randomUUID(),
      clerk_id: id,
      bio: null,
      location: null,
      website_url: null,
      timezone: 'UTC', // Default timezone
      preferences: {} // Empty preferences object
    }).select()

    if (profileError) {
      console.error('Error creating user profile in Supabase:', profileError)
      console.error('Failed insert data:', { clerk_id: id, first_name, last_name, avatar_url: image_url })
      return new Response(JSON.stringify({ error: profileError.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully created user and profile in Supabase:', { user: userData, profile: profileData });
  }

  // Handle user updates
  if (event.type === 'user.updated') {
    const { id, email_addresses, first_name, last_name, image_url } = event.data

    const primaryEmail = email_addresses?.[0]?.email_address

    // Update user email
    const { error: userError } = await supabase
      .from('users')
      .update({ email: primaryEmail })
      .eq('clerk_id', id)

    if (userError) {
      console.error('Error updating user in Supabase:', userError)
      console.error('Failed update data:', { clerk_id: id, email: primaryEmail })
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Update user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .update({
        // Only update timezone and preferences if needed in the future
        // For now, we don't update anything from Clerk events
      })
      .eq('clerk_id', id)

    if (profileError) {
      console.error('Error updating user profile in Supabase:', profileError)
      console.error('Failed update data:', { clerk_id: id, first_name, last_name, avatar_url: image_url })
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully updated user and profile in Supabase');
  }

  // Handle user deletion
  if (event.type === 'user.deleted') {
    const { id } = event.data

    // Delete user profile first (due to foreign key constraint)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('clerk_id', id)

    if (profileError) {
      console.error('Error deleting user profile in Supabase:', profileError)
      console.error('Failed deletion for clerk_id:', id)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Delete user
    const { error: userError } = await supabase
      .from('users')
      .delete()
      .eq('clerk_id', id)

    if (userError) {
      console.error('Error deleting user in Supabase:', userError)
      console.error('Failed deletion for clerk_id:', id)
      return new Response(JSON.stringify({ error: userError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Successfully deleted user and profile from Supabase');
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function POST(req: Request) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers:', { svix_id, svix_timestamp, svix_signature });
    return new Response(JSON.stringify({ error: 'Missing svix headers' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Get the body
  const payload = await req.json()
  const body = JSON.stringify(payload);
  
  console.log('Received webhook payload:', {
    type: payload.type,
    data: payload.data,
    svix_id,
    svix_timestamp
  });

  // Create a new Webhook instance with your webhook secret
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('CLERK_WEBHOOK_SECRET is not set');
    return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  console.log('Webhook secret length:', webhookSecret.length);
  
  const wh = new Webhook(webhookSecret)

  let evt: WebhookEvent

  try {
    // Verify the webhook
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
    console.log('Successfully verified webhook signature');
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  return syncUserWithSupabase(evt)
} 