import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { Axiom } from '@axiomhq/js';
import { ErrorTypes } from '@/lib/errors';
import { generateRequestId } from '@/lib/utils';

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
  | 'upsert_profile'
  | 'delete_profile'
  | 'webhook_handler';

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
const logger = {
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
    await logger.metric(`${operation}_attempt` as MetricName, 1, context);
    const result = await fn();
    const duration = Date.now() - start;
    await logger.trackPerformance(operation, duration, context);
    await logger.metric(`${operation}_success` as MetricName, 1, context);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    await logger.trackPerformance(operation, duration, { 
      ...context, 
      status: 'error',
      errorType: error instanceof Error ? error.name : 'unknown'
    });
    await logger.metric(`${operation}_error` as MetricName, 1, {
      ...context,
      errorType: error instanceof Error ? error.name : 'unknown'
    });
    throw error;
  }
};

// Initialize Supabase client with more detailed error handling
function initSupabaseClient() {
  return timeOperation('init_supabase', async () => {
    logger.info('Initializing Supabase client');
    
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      const missingVars = [
        !url && 'SUPABASE_URL',
        !key && 'SUPABASE_SERVICE_ROLE_KEY'
      ].filter(Boolean);
      
      logger.error('Missing Supabase environment variables', null, { missingVars });
      throw new Error(`${ErrorTypes.ENVIRONMENT}: Missing variables: ${missingVars.join(', ')}`);
    }

    logger.info('Supabase client initialized', { url });
    return createClient<Database>(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  });
}

async function syncUserWithSupabase(event: WebhookEvent) {
  const requestId = generateRequestId();
  await logger.trace(requestId, 'start', { eventType: event.type });
  
  const eventContext = {
    eventType: event.type,
    userId: event.data.id,
    requestId
  };
  
  logger.info('Processing webhook event', eventContext);

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

    await logger.trace(requestId, 'end', { 
      eventType: event.type,
      status: 'success'
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    await logger.trace(requestId, 'end', { 
      eventType: event.type,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function handleUserCreation(userData: UserWebhookEvent['data'], requestId: string) {
  const { id, email_addresses } = userData;
  const primaryEmail = email_addresses?.[0]?.email_address;
  
  logger.info('Processing user creation', { userId: id, email: primaryEmail, requestId });

  if (!primaryEmail) {
    logger.error('No email address found for user', null, { userId: id, requestId });
    logger.metric('user_creation_error', 1, { error_type: 'missing_email', userId: id });
    throw new Error(`${ErrorTypes.USER_CREATION}: No email address found for user ${id}`);
  }

  try {
    const supabase = await initSupabaseClient();

    const { error: upsertError } = await timeOperation('upsert_profile',
      async () => supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: id,
            email: primaryEmail,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
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
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        ),
      { userId: id, email: primaryEmail, requestId }
    );

    if (upsertError) {
      logger.error('Error upserting user profile', upsertError, { userId: id, email: primaryEmail, requestId });
      logger.metric('user_creation_error', 1, { error_type: 'upsert_error', userId: id });
      throw new Error(`${ErrorTypes.DATABASE}: ${upsertError.message}`);
    }

    logger.metric('user_creation_success', 1, { userId: id });
    logger.info('Successfully upserted user profile', { userId: id, requestId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error during user creation', error, { userId: id, email: primaryEmail, requestId });
    logger.metric('user_creation_error', 1, { 
      error_type: error instanceof Error ? error.name : 'unknown',
      userId: id 
    });
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error during user creation',
      errorType: ErrorTypes.USER_CREATION,
      details: error
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function handleUserDeletion(userData: DeleteWebhookEvent['data'], requestId: string) {
  const { id } = userData;
  
  logger.info('Processing user deletion', { userId: id, requestId });

  try {
    const supabase = await initSupabaseClient();
    
    const { error: profileError } = await timeOperation('delete_profile',
      async () => supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', id),
      { userId: id, requestId }
    );

    if (profileError) {
      logger.error('Error deleting user profile', profileError, { userId: id, requestId });
      logger.metric('user_deletion_error', 1, { error_type: 'delete_error', userId: id });
      throw new Error(`${ErrorTypes.DATABASE}: ${profileError.message}`);
    }

    logger.metric('user_deletion_success', 1, { userId: id });
    logger.info('Successfully deleted user profile', { userId: id, requestId });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    logger.error('Error during user deletion', error, { userId: id, requestId });
    logger.metric('user_deletion_error', 1, {
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

export async function POST(req: Request) {
  const requestId = generateRequestId();
  
  // Get headers from request object directly
  const svixId = req.headers.get('svix-id');
  const svixTimestamp = req.headers.get('svix-timestamp');
  const svixSignature = req.headers.get('svix-signature');

  // Log webhook request
  await axiom.ingest('taskmindai-webhooks-dev', [{
    _time: new Date().toISOString(),
    level: 'info',
    message: 'Webhook endpoint hit:',
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    host: process.env.NEXT_PUBLIC_APP_URL || 'localhost',
    service: 'clerk-webhook',
    component: 'api',
    timestamp_ms: Date.now(),
    url: req.url,
    method: req.method,
    headers: {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature
    },
    requestId
  }]);

  // Verify webhook signature
  const payloadString = await req.text();
  let event: WebhookEvent;

  try {
    // Check required headers first
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new Error('Missing required Svix headers');
    }

    // Handle test mode first
    const isTestMode = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.TEST_MODE === 'true';
    if (isTestMode) {
      try {
        // Parse payload first to validate JSON
        event = JSON.parse(payloadString) as WebhookEvent;
        
        // Verify timestamp is within tolerance
        const timestamp = parseInt(svixTimestamp);
        const now = Math.floor(Date.now() / 1000);
        const tolerance = 5 * 60; // 5 minutes tolerance
        
        if (Math.abs(now - timestamp) > tolerance) {
          await logger.error('Message timestamp too old', null, { 
            timestamp, 
            now, 
            difference: Math.abs(now - timestamp),
            tolerance,
            requestId,
            environment: process.env.NODE_ENV
          });
          throw new Error('Message timestamp too old');
        }

        // In test mode, only verify basic signature format
        if (!svixSignature.startsWith('v1,')) {
          await logger.error('Invalid signature format', null, { 
            signature: svixSignature,
            requestId,
            environment: process.env.NODE_ENV
          });
          throw new Error('Invalid signature format');
        }

        await logger.metric('webhook_verification_success', 1, { mode: 'test' });
        return await syncUserWithSupabase(event);
      } catch (parseError) {
        await logger.error('Failed to parse webhook payload in test mode', parseError, { 
          requestId,
          payload: payloadString,
          headers: {
            'svix-id': svixId,
            'svix-timestamp': svixTimestamp,
            'svix-signature': svixSignature
          },
          environment: process.env.NODE_ENV
        });
        return new Response(
          JSON.stringify({ 
            error: ErrorTypes.WEBHOOK_VERIFICATION,
            details: parseError instanceof Error ? parseError.message : 'Invalid webhook payload'
          }), 
          { status: 400 }
        );
      }
    }

    // Production verification with Svix
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET || 'test-secret');
    try {
      event = webhook.verify(
        payloadString,
        {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        }
      ) as WebhookEvent;

      await logger.metric('webhook_verification_success', 1, { mode: 'production' });
      return await syncUserWithSupabase(event);
    } catch (verifyError) {
      await logger.error('Webhook verification failed', verifyError, { requestId });
      await logger.metric('webhook_verification_error', 1, { 
        mode: process.env.NODE_ENV === 'test' ? 'test' : 'production',
        error: verifyError instanceof Error ? verifyError.message : 'unknown'
      });
      return new Response(
        JSON.stringify({ 
          error: ErrorTypes.WEBHOOK_VERIFICATION,
          details: verifyError instanceof Error ? verifyError.message : 'Unknown verification error'
        }), 
        { status: 400 }
      );
    }
  } catch (err) {
    await logger.error('Webhook processing failed', err, { requestId });
    await logger.metric('webhook_error', 1, { 
      mode: process.env.NODE_ENV === 'test' ? 'test' : 'production',
      error: err instanceof Error ? err.message : 'unknown'
    });
    return new Response(
      JSON.stringify({ 
        error: ErrorTypes.WEBHOOK_VERIFICATION,
        details: err instanceof Error ? err.message : 'Unknown error'
      }), 
      { status: 400 }
    );
  }
}

async function handleUserCreated(event: WebhookEvent, requestId: string) {
  // ... rest of the handler implementation ...
}

async function handleUserDeleted(event: WebhookEvent, requestId: string) {
  // ... rest of the handler implementation ...
}
