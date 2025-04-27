import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface AuditLogEntry {
  user_id: string;
  action: string;
  resource: string;
  details: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  status: 'success' | 'failure';
  error_message?: string;
  created_at?: string;
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        ...entry,
        created_at: new Date().toISOString(),
      });

    if (error) {
      logger.error('Error creating audit log', error, { entry });
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Failed to create audit log', error, { entry });
    return false;
  }
}

export async function getAuditLogs(userId: string, options?: {
  resource?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (options?.resource) {
      query = query.eq('resource', options.resource);
    }

    if (options?.action) {
      query = query.eq('action', options.action);
    }

    if (options?.startDate) {
      query = query.gte('created_at', options.startDate.toISOString());
    }

    if (options?.endDate) {
      query = query.lte('created_at', options.endDate.toISOString());
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.offset) {
      query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
    }

    const { data, error } = await query;

    if (error) {
      logger.error('Error fetching audit logs', error, { userId, options });
      return null;
    }

    return data;
  } catch (error) {
    logger.error('Failed to fetch audit logs', error, { userId, options });
    return null;
  }
} 