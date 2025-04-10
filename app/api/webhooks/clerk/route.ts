import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export const runtime = 'edge'; // Add edge runtime
export const dynamic = 'force-dynamic'; // Ensure dynamic handling

type UserProfile = Database['public']['Tables']['user_profiles']['Insert'];

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation'
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
    const { id, email_addresses } = event.data;
    console.log('User ID from Clerk:', id);
    console.log('User email:', email_addresses?.[0]?.email_address);

    try {
      // Check if profile already exists
      console.log('Checking for existing profile...');
      const { data: existingProfile, error: lookupError } = await supabase
        .from('user_profiles')
        .select()
        .eq('id', id)
        .single();

      if (lookupError) {
        console.error('Lookup error details:', {
          code: lookupError.code,
          message: lookupError.message,
          details: lookupError.details,
          hint: lookupError.hint
        });
        
        if (lookupError.code !== 'PGRST116') {
          return new Response(JSON.stringify({ error: lookupError.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      if (existingProfile) {
        console.log('Existing profile found:', JSON.stringify(existingProfile, null, 2));
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Create default profile data
      const defaultProfile: UserProfile = {
        id,
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

      console.log('Attempting to create profile with data:', JSON.stringify(defaultProfile, null, 2));

      // Create user profile with default settings
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .insert(defaultProfile)
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error details:', {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint
        });
        console.error('Profile data that failed:', JSON.stringify(defaultProfile, null, 2));
        return new Response(JSON.stringify({ 
          error: profileError.message,
          details: profileError.details,
          hint: profileError.hint 
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Successfully created user profile in Supabase:', JSON.stringify(newProfile, null, 2));
      return new Response(JSON.stringify({ success: true, profile: newProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Unexpected error during user creation:', error);
      // Log the full error object for debugging
      console.error('Full error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      return new Response(JSON.stringify({ 
        error: 'Internal server error during user creation',
        details: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Handle user deletion
  if (event.type === 'user.deleted') {
    const { id } = event.data;

    try {
      // Delete user profile
      const { data: deletedProfile, error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (profileError) {
        console.error('Error deleting user profile in Supabase:', profileError);
        console.error('Failed deletion for id:', id);
        return new Response(JSON.stringify({ error: profileError.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.log('Successfully deleted user profile from Supabase:', JSON.stringify(deletedProfile, null, 2));
      return new Response(JSON.stringify({ success: true, profile: deletedProfile }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Unexpected error during user deletion:', error);
      return new Response(JSON.stringify({ error: 'Internal server error during user deletion' }), {
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
  // Add CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, svix-id, svix-timestamp, svix-signature',
  };

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  console.log('Webhook endpoint hit');
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return new Response(
      JSON.stringify({ error: 'Missing CLERK_WEBHOOK_SECRET' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
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
    'svix-signature': svix_signature?.substring(0, 10) + '...' // Log partial signature for security
  });

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing required Svix headers');
    return new Response(
      JSON.stringify({ error: 'Missing required Svix headers' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  // Get the body
  let payload;
  try {
    payload = await req.json();
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2));
  } catch (err) {
    console.error('Error parsing request body:', err);
    return new Response(
      JSON.stringify({ error: 'Error parsing request body' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
  
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
    return new Response(
      JSON.stringify({ error: 'Error verifying webhook signature' }), 
      { 
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }

  // Log Supabase connection details (without sensitive info)
  console.log('Supabase URL being used:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('Service role key present:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

  try {
    const response = await syncUserWithSupabase(evt);
    // Add CORS headers to the successful response
    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    console.error('Error in syncUserWithSupabase:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      }
    );
  }
}
