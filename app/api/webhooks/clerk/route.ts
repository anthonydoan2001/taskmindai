import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// Remove edge runtime to avoid potential issues
export const dynamic = 'force-dynamic';

// Initialize Supabase client with more detailed error handling
function initSupabaseClient() {
  console.log('Initializing Supabase client...');
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('Missing Supabase environment variables:', {
      hasUrl: !!url,
      hasKey: !!key
    });
    throw new Error(`Missing Supabase environment variables: ${!url ? 'NEXT_PUBLIC_SUPABASE_URL' : ''} ${!key ? 'SUPABASE_SERVICE_ROLE_KEY' : ''}`);
  }

  console.log('Supabase URL:', url);
  console.log('Service role key present:', !!key);

  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function syncUserWithSupabase(event: WebhookEvent) {
  console.log('Processing webhook event:', event.type);

  // Handle user creation
  if (event.type === 'user.created') {
    const { id } = event.data;
    console.log('Processing user creation for ID:', id);

    try {
      const supabase = initSupabaseClient();

      // Check if profile already exists - use count to be more efficient
      const { count, error: countError } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', id);

      if (countError) {
        console.error('Error checking for existing profile:', countError);
        throw countError;
      }

      if (count && count > 0) {
        console.log('Profile already exists, skipping creation');
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create default profile data
      const defaultProfile = {
        user_id: id,
        settings: {
          militaryTime: false,
          workType: 'full-time',
          categories: ['Work', 'Personal', 'Errands']
        },
        working_days: {
          monday: { start: '09:00', end: '17:00', isWorkingDay: true },
          tuesday: { start: '09:00', end: '17:00', isWorkingDay: true },
          wednesday: { start: '09:00', end: '17:00', isWorkingDay: true },
          thursday: { start: '09:00', end: '17:00', isWorkingDay: true },
          friday: { start: '09:00', end: '17:00', isWorkingDay: true },
          saturday: { start: '09:00', end: '17:00', isWorkingDay: false },
          sunday: { start: '09:00', end: '17:00', isWorkingDay: false }
        }
      };

      // Use upsert instead of insert to handle race conditions
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .upsert(defaultProfile, {
          onConflict: 'user_id',
          ignoreDuplicates: true
        })
        .select()
        .single();

      if (profileError) {
        console.error('Error creating user profile:', profileError);
        throw profileError;
      }

      console.log('Successfully created user profile:', newProfile);
      return new Response(JSON.stringify({ success: true, profile: newProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error during user creation:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error during user creation',
        details: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle user deletion
  if (event.type === 'user.deleted') {
    const { id } = event.data;
    console.log('Processing user deletion for ID:', id);

    try {
      const supabase = initSupabaseClient();
      
      // Delete user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', id);

      if (profileError) {
        console.error('Error deleting user profile:', profileError);
        throw profileError;
      }

      console.log('Successfully deleted user profile for ID:', id);
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error during user deletion:', error);
      return new Response(JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error during user deletion',
        details: error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function POST(req: Request) {
  console.log('Webhook endpoint hit at:', new Date().toISOString());
  console.log('Request URL:', req.url);
  console.log('Request method:', req.method);
  
  try {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
      console.error('Missing CLERK_WEBHOOK_SECRET environment variable');
      throw new Error('Missing CLERK_WEBHOOK_SECRET');
    }

    // Get the headers
    const headerPayload = headers();
    const svix_id = headerPayload.get('svix-id');
    const svix_timestamp = headerPayload.get('svix-timestamp');
    const svix_signature = headerPayload.get('svix-signature');

    // Log headers
    console.log('Webhook headers received:', {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature?.substring(0, 10) + '...'
    });

    if (!svix_id || !svix_timestamp || !svix_signature) {
      console.error('Missing required Svix headers:', {
        hasSvixId: !!svix_id,
        hasSvixTimestamp: !!svix_timestamp,
        hasSvixSignature: !!svix_signature
      });
      throw new Error('Missing required Svix headers');
    }

    // Get the body
    const payload = await req.json();
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));
    
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
      console.log('Webhook verified successfully');
    } catch (err) {
      console.error('Error verifying webhook:', err);
      throw new Error('Error verifying webhook signature');
    }

    return await syncUserWithSupabase(evt);
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error in webhook handler',
        details: error
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
