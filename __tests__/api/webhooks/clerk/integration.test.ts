import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';
import { ErrorTypes } from '@/lib/errors';

// Mock Axiom client
vi.mock('@axiomhq/js', () => ({
  Axiom: vi.fn(() => ({
    ingest: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Svix Webhook
vi.mock('svix', () => ({
  Webhook: vi.fn().mockImplementation(() => ({
    verify: vi.fn().mockImplementation((payload, headers) => {
      // Verify timestamp is within tolerance
      const timestamp = parseInt(headers['svix-timestamp']);
      const now = Math.floor(Date.now() / 1000);
      const tolerance = 5 * 60; // 5 minutes tolerance
      
      if (Math.abs(now - timestamp) > tolerance) {
        throw new Error('Message timestamp too old');
      }

      // In test mode, verify all required headers are present
      if (!headers['svix-id'] || !headers['svix-timestamp'] || !headers['svix-signature']) {
        throw new Error('Missing required Svix headers');
      }

      // Return parsed payload
      try {
        return JSON.parse(payload);
      } catch (error) {
        throw new Error('Invalid JSON payload');
      }
    })
  }))
}));

describe('Clerk Webhook Integration Tests', () => {
  const testUserId = 'test_user_123';
  let supabase: SupabaseClient;
  let baseUrl: string;
  // Track created test users for cleanup
  const createdTestUsers: string[] = [];

  // Helper function to clean up test data
  async function cleanupTestData() {
    try {
      // Delete all test users created during tests
      if (createdTestUsers.length > 0) {
        const { error } = await supabase
          .from('user_profiles')
          .delete()
          .in('user_id', createdTestUsers);
        
        if (error) {
          console.error('Error cleaning up test data:', error);
        }
      }
      // Clear the tracking array
      createdTestUsers.length = 0;
    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }

  // Helper function to track created test users
  function trackTestUser(userId: string) {
    createdTestUsers.push(userId);
  }

  beforeAll(async () => {
    // Initialize Supabase client
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Use ngrok URL for integration tests
    baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    console.log('Using base URL:', baseUrl);

    // Log environment setup
    console.log('Test environment setup:', {
      nodeEnv: process.env.NODE_ENV,
      testMode: process.env.TEST_MODE,
      hasAxiomToken: !!process.env.AXIOM_TOKEN,
      axiomTokenPrefix: process.env.AXIOM_TOKEN?.substring(0, 10),
      hasAxiomOrgId: !!process.env.AXIOM_ORG_ID,
      axiomOrgId: process.env.AXIOM_ORG_ID,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
      hasClerkSecret: !!process.env.CLERK_WEBHOOK_SECRET,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      baseUrl
    });
  });

  afterAll(async () => {
    // Clean up any remaining test data
    await cleanupTestData();
    vi.unstubAllEnvs();
  });

  const signWebhookRequest = (payload: object) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const svixId = 'test-svix-id';
    
    return {
      'Content-Type': 'application/json',
      'svix-id': svixId,
      'svix-timestamp': timestamp,
      'svix-signature': `v1,test-signature`
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Clear tracking array before each test
    createdTestUsers.length = 0;
  });

  afterEach(async () => {
    // Clean up test data after each test
    await cleanupTestData();
    vi.clearAllMocks();
  });

  // Update makeWebhookRequest to track created users
  const makeWebhookRequest = async (payload: object) => {
    const headers = signWebhookRequest(payload);
    const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
    // Track user if it's a creation event
    const payloadObj = payload as any;
    if (payloadObj.type === 'user.created' && payloadObj.data?.id) {
      trackTestUser(payloadObj.data.id);
    }
    
    if (response.status !== 200) {
      const errorData = await response.json();
      console.error('Webhook request failed:', {
        status: response.status,
        error: errorData,
        headers: headers,
        payload: payload,
        environment: process.env.NODE_ENV,
        testMode: process.env.TEST_MODE
      });
    }
    
    return response;
  };

  describe('User Creation Flow', () => {
    it('should create a new user profile in Supabase when Clerk webhook is received', async () => {
      const testPayload = {
        data: {
          id: testUserId,
          email_addresses: [{ email_address: 'test@example.com', id: 'test_email_123' }],
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        },
        object: 'user',
        type: 'user.created'
      };

      const response = await makeWebhookRequest(testPayload);
      expect(response.status).toBe(200);

      // Verify user was created in Supabase
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', testUserId)
        .single();

      expect(error).toBeNull();
      expect(profile).not.toBeNull();
      expect(profile!.user_id).toBe(testUserId);
      expect(profile!.email).toBe('test@example.com');
    });

    it('should handle concurrent webhook requests correctly', async () => {
      const uniqueTestUserId = 'test_user_concurrent_123';
      const payload = {
        data: {
          id: uniqueTestUserId,
          email_addresses: [
            {
              email_address: 'test@example.com',
              id: 'test-email-id',
              object: 'email_address',
              verification: null,
              linked_to: [],
            }
          ],
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          object: 'user',
        },
        object: 'event',
        type: 'user.created',
      };

      // Track this test user
      trackTestUser(uniqueTestUserId);

      const requests = Array(3).fill(null).map(() => 
        makeWebhookRequest(payload)
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      // Verify only one profile exists
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uniqueTestUserId);

      expect(error).toBeNull();
      expect(profiles).toHaveLength(1);
    });
  });

  describe('End-to-End User Lifecycle', () => {
    const uniqueTestUserId = 'test_user_456';

    beforeEach(() => {
      // Track this test user
      trackTestUser(uniqueTestUserId);
    });

    it('should handle user creation and deletion correctly', async () => {
      const createPayload = {
        data: {
          id: uniqueTestUserId,
          email_addresses: [{ email_address: 'test@example.com', id: 'test_email_456' }],
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        },
        object: 'user',
        type: 'user.created'
      };

      const deletePayload = {
        data: {
          id: uniqueTestUserId,
          email_addresses: [{ email_address: 'test@example.com', id: 'test_email_456' }],
          deleted: true,
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000)
        },
        object: 'user',
        type: 'user.deleted'
      };

      // Create user
      const createResponse = await makeWebhookRequest(createPayload);
      expect(createResponse.status).toBe(200);

      // Verify user exists
      let { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uniqueTestUserId)
        .single();

      expect(profile).not.toBeNull();

      // Delete user
      const deleteResponse = await makeWebhookRequest(deletePayload);
      expect(deleteResponse.status).toBe(200);

      // Verify user was deleted
      const { data: deletedProfile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', uniqueTestUserId)
        .single();

      expect(error).not.toBeNull();
      expect(deletedProfile).toBeNull();
    });
  });

  describe('Error Handling', () => {
    describe('Database Errors', () => {
      it('should handle database connection errors', async () => {
        // Mock Supabase client to simulate connection error
        const originalFrom = supabase.from;
        supabase.from = vi.fn().mockImplementation(() => ({
          upsert: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          delete: vi.fn().mockImplementation(() => ({
            in: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }));

        const testPayload = {
          data: {
            id: 'test_db_error_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        const response = await makeWebhookRequest(testPayload);
        expect(response.status).toBe(500);
        const errorData = await response.json();
        expect(errorData.error).toContain('Database connection failed');
        expect(errorData.errorType).toBe(ErrorTypes.DATABASE);

        // Restore original Supabase client
        supabase.from = originalFrom;
      });

      it('should handle database constraint violations', async () => {
        // Mock Supabase client to simulate unique constraint violation
        const originalFrom = supabase.from;
        supabase.from = vi.fn().mockImplementation(() => ({
          upsert: vi.fn().mockResolvedValue({
            error: {
              message: 'duplicate key value violates unique constraint',
              code: '23505'
            }
          }),
          delete: vi.fn().mockImplementation(() => ({
            in: vi.fn().mockResolvedValue({ data: null, error: null })
          }))
        }));

        const testPayload = {
          data: {
            id: 'test_constraint_error_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        const response = await makeWebhookRequest(testPayload);
        expect(response.status).toBe(500);
        const errorData = await response.json();
        expect(errorData.error).toContain('duplicate key value');
        expect(errorData.errorType).toBe(ErrorTypes.DATABASE);

        // Restore original Supabase client
        supabase.from = originalFrom;
      });
    });

    describe('Malformed Payloads', () => {
      it('should handle missing required fields', async () => {
        const malformedPayload = {
          data: {
            // Missing id field
            email_addresses: [{ email_address: 'test@example.com' }],
            created_at: Math.floor(Date.now() / 1000)
          },
          type: 'user.created'
        };

        const response = await makeWebhookRequest(malformedPayload);
        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Invalid webhook payload');
      });

      it('should handle invalid email format', async () => {
        const invalidEmailPayload = {
          data: {
            id: 'test_invalid_email_user',
            email_addresses: [{ email_address: 'not-an-email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        const response = await makeWebhookRequest(invalidEmailPayload);
        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Invalid email format');
      });

      it('should handle invalid JSON payload', async () => {
        const headers = signWebhookRequest({});
        const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
          method: 'POST',
          headers,
          body: 'not-json-content',
        });

        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Invalid JSON payload');
      });
    });

    describe('Rate Limiting', () => {
      it('should handle rapid concurrent requests', async () => {
        const payload = {
          data: {
            id: 'test_rate_limit_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        // Make 10 concurrent requests
        const requests = Array(10).fill(null).map(() => 
          makeWebhookRequest(payload)
        );

        const responses = await Promise.all(requests);
        
        // Check if some requests were rate limited
        const rateLimitedResponses = responses.filter(r => r.status === 429);
        const successResponses = responses.filter(r => r.status === 200);

        // We should either see rate limits or all successful responses
        expect(
          rateLimitedResponses.length > 0 || successResponses.length === requests.length
        ).toBe(true);

        if (rateLimitedResponses.length > 0) {
          const errorData = await rateLimitedResponses[0].json();
          expect(errorData.error).toContain('Too many requests');
        }
      });

      it('should recover after rate limit window', async () => {
        const payload = {
          data: {
            id: 'test_rate_recovery_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        // Make initial request
        const firstResponse = await makeWebhookRequest(payload);
        expect(firstResponse.status).toBe(200);

        // Wait for rate limit window to reset (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Make another request
        const secondResponse = await makeWebhookRequest(payload);
        expect(secondResponse.status).toBe(200);
      });
    });

    describe('Webhook Signature Verification', () => {
      it('should handle expired timestamps', async () => {
        const payload = {
          data: {
            id: 'test_expired_timestamp_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        // Use an expired timestamp (6 minutes old)
        const headers = {
          ...signWebhookRequest(payload),
          'svix-timestamp': (Math.floor(Date.now() / 1000) - 6 * 60).toString()
        };

        const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Message timestamp too old');
      });

      it('should handle missing signature headers', async () => {
        const payload = {
          data: {
            id: 'test_missing_headers_user',
            email_addresses: [{ email_address: 'test@example.com', id: 'test_email' }],
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          },
          object: 'user',
          type: 'user.created'
        };

        const headers = {
          'Content-Type': 'application/json'
        };

        const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        expect(response.status).toBe(400);
        const errorData = await response.json();
        expect(errorData.error).toContain('Missing required Svix headers');
      });
    });
  });
}); 