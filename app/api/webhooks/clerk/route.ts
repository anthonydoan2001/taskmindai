// Clerk/Supabase integration: user IDs are TEXT (Clerk-compatible)
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Axiom } from '@axiomhq/js';
import { ErrorTypes } from '@/lib/errors';
import { generateRequestId } from '@/lib/utils';
import { logger } from '@/lib/logger';

// Debug environment variables
console.log('Environment variables check:', {
  hasAxiomToken: !!process.env.AXIOM_TOKEN,
  axiomTokenPrefix: process.env.AXIOM_TOKEN?.substring(0, 10),
  hasAxiomOrgId: !!process.env.AXIOM_ORG_ID,
  axiomOrgId: process.env.AXIOM_ORG_ID,
  nodeEnv: process.env.NODE_ENV,
  appUrl: process.env.NEXT_PUBLIC_APP_URL
});

// Type definitions
type UserWebhookEvent = WebhookEvent & {
  data: {
    id: string;
    email_addresses: Array<{
      email_address: string;
    }>;
  };
};

type DeleteWebhookEvent = WebhookEvent & {
  data: {
    id: string;
  };
};

type MetricName = 
  | 'webhook_received'
  | 'webhook_processed'
  | 'webhook_error'
  | 'user_creation_attempt'
  | 'user_creation_success'
  | 'user_creation_error'
  | 'user_deletion_attempt'
  | 'user_deletion_success'
  | 'user_deletion_error'
  | 'user_update'
  | 'user_update_error'
  | 'user_update_success'
  | 'database_operation_attempt'
  | 'database_operation_success'
  | 'database_operation_error'
  | 'webhook_verification_success'
  | 'webhook_verification_error';

type OperationName =
  | 'init_supabase'
  | 'verify_webhook'
  | 'user_creation'
  | 'user_deletion'
  | 'user_update'
  | 'upsert_profile'
  | 'delete_profile'
  | 'webhook_handler';

// Define days of week as string literals to match database enum
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

// Remove edge runtime to avoid potential issues
export const dynamic = 'force-dynamic';

// Initialize Axiom client for logging
const axiomToken = process.env.AXIOM_TOKEN;
const axiomOrgId = process.env.AXIOM_ORG_ID;

if (!axiomToken || !axiomOrgId) {
  throw new Error(`${ErrorTypes.ENVIRONMENT}: Missing Axiom credentials`);
}

const axiom = new Axiom({
  token: axiomToken,
  orgId: axiomOrgId
});

// Enhanced logger with request tracing and performance monitoring
const webhookLogger = {
  info: async (message: string, context = {}) => {
    const logData = {
      _time: new Date().toISOString(),
      level: 'info',
      message,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      host: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA,
      service: 'clerk-webhook',
      component: 'api',
      timestamp_ms: Date.now(),
      ...context
    };
    
    console.log('Sending log to Axiom:', logData);
    try {
      await axiom.ingest('taskmindai-webhooks-dev', [logData]);
      console.log('Successfully sent log to Axiom');
    } catch (error) {
      console.error('Failed to send log to Axiom:', error);
    }
  },
  error: async (message: string, error?: any, context = {}) => {
    const errorDetails = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.cause || 'UNKNOWN'
    } : error;

    const logData = {
      _time: new Date().toISOString(),
      level: 'error',
      message,
      error: errorDetails,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      host: process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA,
      service: 'clerk-webhook',
      component: 'api',
      timestamp_ms: Date.now(),
      error_category: errorDetails?.name || 'UnknownError',
      severity: 'high',
      ...context
    };

    console.error(JSON.stringify(logData));
    await axiom.ingest('taskmindai-webhooks-dev', [logData]);
  },
  metric: async (name: MetricName, value: number, tags = {}) => {
    const metricData = {
      _time: new Date().toISOString(),
      type: 'metric',
      name,
      value,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      host: process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA,
      service: 'clerk-webhook',
      component: 'api',
      timestamp_ms: Date.now(),
      metric_type: 'counter',
      ...tags
    };

    await axiom.ingest('taskmindai-webhooks-dev', [metricData]);
  },
  trackPerformance: async (operation: OperationName, durationMs: number, context = {}) => {
    const perfData = {
      _time: new Date().toISOString(),
      type: 'performance',
      operation,
      durationMs,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      host: process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA,
      service: 'clerk-webhook',
      component: 'api',
      timestamp_ms: Date.now(),
      perf_category: 'operation_duration',
      ...context
    };

    await axiom.ingest('taskmindai-webhooks-dev', [perfData]);
  },
  trace: async (requestId: string, phase: 'start' | 'end', context = {}) => {
    const traceData = {
      _time: new Date().toISOString(),
      type: 'trace',
      requestId,
      phase,
      environment: process.env.NODE_ENV,
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
      host: process.env.VERCEL_URL || 'localhost',
      region: process.env.VERCEL_REGION,
      deployment: process.env.VERCEL_GIT_COMMIT_SHA,
      service: 'clerk-webhook',
      component: 'api',
      timestamp_ms: Date.now(),
      trace_category: 'request',
      ...context
    };

    await axiom.ingest('taskmindai-webhooks-dev', [traceData]);
  }
};

// Helper for timing operations
const timeOperation = async <T>(
  operation: OperationName,
  fn: () => Promise<T>,
  context = {}
): Promise<T> => {
  const start = Date.now();
  try {
    await webhookLogger.metric(`${operation}_attempt` as MetricName, 1, context);
    const result = await fn();
    const duration = Date.now() - start;
    await webhookLogger.trackPerformance(operation, duration, context);
    await webhookLogger.metric(`${operation}_success` as MetricName, 1, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    await webhookLogger.trackPerformance(operation, duration, { 
      ...context, 
      status: 'error',
      errorType: error instanceof Error ? error.name : 'unknown'
    });
    await webhookLogger.metric(`${operation}_error` as MetricName, 1, {
      ...context,
      errorType: error instanceof Error ? error.name : 'unknown'
    });
    throw error;
  }
};

// Initialize Supabase client with more detailed error handling
function initSupabaseClient() {
  return timeOperation('init_supabase', async () => {
    webhookLogger.info('Initializing Supabase client');
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      const missingVars = [
        !url && 'SUPABASE_URL',
        !key && 'SUPABASE_SERVICE_ROLE_KEY'
      ].filter(Boolean);
      
      webhookLogger.error('Missing Supabase environment variables', null, { missingVars });
      throw new Error(`${ErrorTypes.ENVIRONMENT}: Missing variables: ${missingVars.join(', ')}`);
    }

    webhookLogger.info('Supabase client initialized', { url });
    return createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });
}

// Default work schedule (Mon-Fri, 9-5)
const DEFAULT_WORK_DAYS: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday'
];

async function handleUserCreation(user: UserWebhookEvent['data'], requestId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  try {
    // Insert into users table first
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email_addresses[0]?.email_address,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (userError) {
      webhookLogger.error('Error creating user', userError, { userId: user.id, requestId });
      throw userError;
    }

    // Insert default preferences
    const { error: prefError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: true
          }
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (prefError) {
      webhookLogger.error('Error creating user preferences', prefError, { userId: user.id, requestId });
      // Don't fail webhook if preferences fail
    }

    // Insert default work schedules
    const { error: scheduleError } = await supabase
      .from('work_schedules')
      .insert(
        DEFAULT_WORK_DAYS.map(day => ({
          user_id: user.id,
          day,
          start_time: '09:00',
          end_time: '17:00',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }))
      );

    if (scheduleError) {
      webhookLogger.error('Error creating work schedules', scheduleError, { userId: user.id, requestId });
      // Don't fail webhook if schedules fail
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    webhookLogger.error('Error in webhook handler', error, { userId: user.id, requestId });
    throw error;
  }
}

async function handleUserDeletion(userData: DeleteWebhookEvent['data'], requestId: string) {
  const { id } = userData;
  
  webhookLogger.info('Processing user deletion', { userId: id, requestId });

  try {
    const supabase = await initSupabaseClient();
    
    const { error: delError } = await timeOperation('user_deletion',
      async () => supabase
        .from('users')
        .delete()
        .eq('id', id),
      { userId: id, requestId }
    );

    if (delError) {
      webhookLogger.error('Error deleting user', delError, { userId: id, requestId });
      webhookLogger.metric('user_deletion_error', 1, { error_type: 'delete_error', userId: id });
      throw new Error(`${ErrorTypes.DATABASE}: ${delError.message}`);
    }

    webhookLogger.metric('user_deletion_success', 1, { userId: id });
    webhookLogger.info('Successfully deleted user', { userId: id, requestId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    webhookLogger.error('Error during user deletion', error, { userId: id, requestId });
    webhookLogger.metric('user_deletion_error', 1, {
      error_type: error instanceof Error ? error.name : 'unknown',
      userId: id
    });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error during user deletion',
      errorType: ErrorTypes.USER_DELETION,
      details: error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleUserUpdate(userData: UserWebhookEvent['data'], requestId: string) {
  const { id, email_addresses } = userData;
  const firstName = (userData as any).first_name ?? '';
  const lastName = (userData as any).last_name ?? '';
  const primaryEmail = email_addresses?.[0]?.email_address;
  const fullName = `${firstName} ${lastName}`.trim();
  
  webhookLogger.info('Processing user update', { userId: id, email: primaryEmail, requestId });

  if (!primaryEmail) {
    webhookLogger.error('No email address found for user', null, { userId: id, requestId });
    webhookLogger.metric('user_update_error', 1, { error_type: 'missing_email', userId: id });
    throw new Error(`${ErrorTypes.USER_CREATION}: No email address found for user ${id}`);
  }

  try {
    const supabase = await initSupabaseClient();

    const { error: updateError } = await timeOperation('user_update',
      async () => supabase
        .from('users')
        .update({
          email: primaryEmail,
          full_name: fullName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id),
      { userId: id, email: primaryEmail, requestId }
    );

    if (updateError) {
      webhookLogger.error('Error updating user', updateError, { userId: id, email: primaryEmail, requestId });
      webhookLogger.metric('user_update_error', 1, { error_type: 'update_error', userId: id });
      throw new Error(`${ErrorTypes.DATABASE}: ${updateError.message}`);
    }

    webhookLogger.metric('user_update_success', 1, { userId: id });
    webhookLogger.info('Successfully updated user', { userId: id, requestId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    webhookLogger.error('Error during user update', error, { userId: id, email: primaryEmail, requestId });
    webhookLogger.metric('user_update_error', 1, { 
      error_type: error instanceof Error ? error.name : 'unknown',
      userId: id 
    });
    
    // Handle database errors with 500 status
    if (error instanceof Error) {
      if (error.message.includes('Database connection failed') || 
          error.message.includes('duplicate key value') ||
          error.message.startsWith(ErrorTypes.DATABASE)) {
        return new Response(JSON.stringify({ 
          error: error.message,
          errorType: ErrorTypes.DATABASE
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error during user update',
      errorType: ErrorTypes.USER_CREATION
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Ensure environment variables are defined
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables');
}

// Initialize clients
const wh = new Webhook(webhookSecret);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Default work schedule
const DEFAULT_WORK_HOURS = {
  start: '09:00',
  end: '17:00',
};

// Helper to add audit logs
async function addAuditLog(userId: string, action: string, details: any) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    action,
    details,
  });
}

export async function POST(req: Request) {
  const payload = await req.json();
  const headerPayload = headers();
  const svixId = headerPayload.get('svix-id');
  const svixTimestamp = headerPayload.get('svix-timestamp');
  const svixSignature = headerPayload.get('svix-signature');

  // Validate webhook
  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response('Missing svix headers', { status: 400 });
  }

  // Verify webhook
  try {
    wh.verify(JSON.stringify(payload), {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error verifying webhook', { status: 400 });
  }

  // Handle webhook
  try {
    const { type, data: user } = payload;
    const userId = user.id as string;

    switch (type) {
      case 'user.created': {
        if (!user.email_addresses?.[0]?.email_address) {
          return new Response('Missing email address', { status: 400 });
        }

        // Create user
        await supabase.from('users').insert({
          id: userId,
          email: user.email_addresses[0].email_address,
        });

        // Create default preferences
        await supabase.from('user_preferences').insert({
          user_id: userId,
          preferences: {
            theme: 'system',
            notifications: {
              email: true,
              push: true,
            },
          },
        });

        // Create default work schedules
        for (const day of DEFAULT_WORK_DAYS) {
          await supabase.from('work_schedules').insert({
            user_id: userId,
            day,
            start_time: DEFAULT_WORK_HOURS.start,
            end_time: DEFAULT_WORK_HOURS.end,
          });
        }

        // Add audit log
        await addAuditLog(userId, 'user.created', {
          email: user.email_addresses[0].email_address,
        });

        break;
      }

      case 'user.deleted': {
        // Delete user (will cascade to preferences and schedules)
        await supabase.from('users').delete().eq('id', userId);

        // Add audit log
        await addAuditLog(userId, 'user.deleted', {
          timestamp: new Date().toISOString(),
        });

        break;
      }
    }

    return new Response('Webhook processed', { status: 200 });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return new Response('Error processing webhook', { status: 500 });
  }
}

async function handleUserCreated(event: WebhookEvent, requestId: string) {
  // ... rest of the handler implementation ...
}

async function handleUserDeleted(event: WebhookEvent, requestId: string) {
  // ... rest of the handler implementation ...
}

async function syncUserWithSupabase(event: WebhookEvent) {
  const requestId = generateRequestId();
  await webhookLogger.trace(requestId, 'start', { eventType: event.type });
  
  const eventContext = {
    eventType: event.type,
    userId: event.data.id,
    requestId
  };
  
  webhookLogger.info('Processing webhook event', eventContext);

  try {
    if (event.type === 'user.created') {
      return await timeOperation('user_creation', 
        () => handleUserCreation(event.data as UserWebhookEvent['data'], requestId),
        eventContext
      );
    }

    if (event.type === 'user.deleted') {
      return await timeOperation('user_deletion',
        () => handleUserDeletion(event.data as DeleteWebhookEvent['data'], requestId),
        eventContext
      );
    }

    if (event.type === 'user.updated') {
      return await timeOperation('user_update',
        () => handleUserUpdate(event.data as UserWebhookEvent['data'], requestId),
        eventContext
      );
    }

    await webhookLogger.trace(requestId, 'end', { 
      eventType: event.type,
      status: 'success'
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await webhookLogger.trace(requestId, 'end', { 
      eventType: event.type,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
