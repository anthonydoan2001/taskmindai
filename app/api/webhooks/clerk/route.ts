import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    },
  },
);

async function syncUserWithSupabase(event: WebhookEvent) {
  console.log('Processing webhook event:', event.type);
  console.log('Event data:', JSON.stringify(event.data, null, 2));

  // Handle user creation
  if (event.type === 'user.created') {
    console.log('Creating new user profile in Supabase');
    const { id } = event.data;

    // Check if profile already exists
    const { data: existingProfile, error: lookupError } = await supabase
      .from('user_profiles')
      .select()
      .eq('clerk_id', id)
      .single();

    if (lookupError && lookupError.code !== 'PGRST116') {
      // PGRST116 means no rows returned
      console.error('Error looking up existing profile:', lookupError);
      return new Response(JSON.stringify({ error: lookupError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If profile exists, just return success
    if (existingProfile) {
      console.log('User profile already exists in Supabase, skipping creation');
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Create user profile with default settings and working days
    const { error: profileError } = await supabase.from('user_profiles').insert({
      id: randomUUID(),
      clerk_id: id,
      settings: {
        militaryTime: false,
        workType: 'full-time',
        categories: [],
      },
      working_days: [
        { dayOfWeek: '0', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
        { dayOfWeek: '1', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: '2', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: '3', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: '4', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: '5', startTime: '09:00', endTime: '17:00', isWorkingDay: true },
        { dayOfWeek: '6', startTime: '09:00', endTime: '17:00', isWorkingDay: false },
      ],
    });

    if (profileError) {
      console.error('Error creating user profile in Supabase:', profileError);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully created user profile in Supabase');
  }

  // Handle user deletion
  if (event.type === 'user.deleted') {
    const { id } = event.data;

    // Delete user profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('clerk_id', id);

    if (profileError) {
      console.error('Error deleting user profile in Supabase:', profileError);
      console.error('Failed deletion for clerk_id:', id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Successfully deleted user profile from Supabase');
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new SVIX instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400,
    });
  }

  return syncUserWithSupabase(evt);
}
