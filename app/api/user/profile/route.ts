import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { userProfileSchema, userSettingsSchema, workingDaysSchema } from '@/lib/validations/user-profile';
import { logger } from '@/lib/logger';
import { auth } from '@clerk/nextjs/server';
import { strictRateLimiter } from '@/lib/rate-limit';
import { createAuditLog } from '@/lib/audit-log';
import { headers } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Initialize Supabase client with service role for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to get request metadata
function getRequestMetadata(req: Request) {
  const headersList = headers();
  return {
    ip_address: headersList.get('x-forwarded-for') || 'unknown',
    user_agent: headersList.get('user-agent') || 'unknown',
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const { success, limit, reset, remaining } = await strictRateLimiter.limit(
      `profile_get_${session.userId}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    if (error) {
      logger.error('Error fetching user profile', error);
      return NextResponse.json(
        { error: 'Failed to fetch user profile' },
        { status: 500 }
      );
    }

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    logger.error('Unexpected error in GET /api/user/profile', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const { success, limit, reset, remaining } = await strictRateLimiter.limit(
      `profile_update_${session.userId}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const body = await req.json();
    const metadata = getRequestMetadata(req);
    
    // Validate the update data based on what's being updated
    if (body.settings) {
      try {
        userSettingsSchema.parse(body.settings);
      } catch (error) {
        await createAuditLog({
          user_id: session.userId,
          action: 'update_settings',
          resource: 'user_profile',
          details: { attempted_settings: body.settings },
          status: 'failure',
          error_message: 'Invalid settings data',
          ...metadata,
        });

        return NextResponse.json(
          { error: 'Invalid settings data', details: error },
          { status: 400 }
        );
      }
    }

    if (body.working_days) {
      try {
        workingDaysSchema.parse(body.working_days);
      } catch (error) {
        await createAuditLog({
          user_id: session.userId,
          action: 'update_working_days',
          resource: 'user_profile',
          details: { attempted_working_days: body.working_days },
          status: 'failure',
          error_message: 'Invalid working days data',
          ...metadata,
        });

        return NextResponse.json(
          { error: 'Invalid working days data', details: error },
          { status: 400 }
        );
      }
    }

    // Add updated_at timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', session.userId);

    if (error) {
      await createAuditLog({
        user_id: session.userId,
        action: 'update_profile',
        resource: 'user_profile',
        details: { attempted_update: updateData },
        status: 'failure',
        error_message: error.message,
        ...metadata,
      });

      logger.error('Error updating user profile', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Log successful update
    await createAuditLog({
      user_id: session.userId,
      action: 'update_profile',
      resource: 'user_profile',
      details: { updated_fields: Object.keys(body) },
      status: 'success',
      ...metadata,
    });

    // Fetch and return the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    if (fetchError) {
      logger.error('Error fetching updated profile', fetchError);
      return NextResponse.json(
        { error: 'Profile updated but failed to fetch updated data' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    logger.error('Unexpected error in PATCH /api/user/profile', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Apply rate limiting
    const { success, limit, reset, remaining } = await strictRateLimiter.limit(
      `profile_replace_${session.userId}`
    );

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests', reset },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          }
        }
      );
    }

    const body = await req.json();
    const metadata = getRequestMetadata(req);

    // Validate entire profile data
    try {
      userProfileSchema.parse({
        ...body,
        user_id: session.userId
      });
    } catch (error) {
      await createAuditLog({
        user_id: session.userId,
        action: 'replace_profile',
        resource: 'user_profile',
        details: { attempted_profile: body },
        status: 'failure',
        error_message: 'Invalid profile data',
        ...metadata,
      });

      return NextResponse.json(
        { error: 'Invalid profile data', details: error },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_profiles')
      .upsert({
        ...body,
        user_id: session.userId,
        updated_at: new Date().toISOString()
      });

    if (error) {
      await createAuditLog({
        user_id: session.userId,
        action: 'replace_profile',
        resource: 'user_profile',
        details: { attempted_profile: body },
        status: 'failure',
        error_message: error.message,
        ...metadata,
      });

      logger.error('Error upserting user profile', error);
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Log successful update
    await createAuditLog({
      user_id: session.userId,
      action: 'replace_profile',
      resource: 'user_profile',
      details: { updated_fields: Object.keys(body) },
      status: 'success',
      ...metadata,
    });

    // Fetch and return the updated profile
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', session.userId)
      .single();

    if (fetchError) {
      logger.error('Error fetching updated profile', fetchError);
      return NextResponse.json(
        { error: 'Profile updated but failed to fetch updated data' },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedProfile);
  } catch (error) {
    logger.error('Unexpected error in PUT /api/user/profile', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 