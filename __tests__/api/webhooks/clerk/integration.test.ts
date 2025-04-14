import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

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

      // Verify test signature format
      const signature = headers['svix-signature'];
      if (!signature.startsWith('v1,test-signature-') || !signature.includes(headers['svix-timestamp'])) {
        throw new Error('No matching signature found');
      }

      // Return parsed payload
      return JSON.parse(payload);
    })
  }))
}));

describe('Clerk Webhook Integration Tests', () => {
  const testUserId = 'test_user_123';
  let supabase: SupabaseClient;
  let baseUrl: string;

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

  afterAll(() => {
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
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Helper function to make webhook requests
  const makeWebhookRequest = async (payload: object) => {
    const headers = signWebhookRequest(payload);
    const response = await fetch(`${baseUrl}/api/webhooks/clerk`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    
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
      expect(profile!.settings).toEqual({
        militaryTime: false,
        workType: 'full-time',
        categories: ['Work', 'Personal', 'Errands']
      });
      expect(profile!.working_days).toBeDefined();
    });

    it('should handle concurrent webhook requests correctly', async () => {
      const concurrentRequests = 3;
      const payload = {
        data: {
          id: testUserId,
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

      const requests = Array(concurrentRequests).fill(null).map(() => 
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
        .eq('user_id', testUserId);

      expect(error).toBeNull();
      expect(profiles).toHaveLength(1);
    });
  });

  describe('End-to-End User Lifecycle', () => {
    const uniqueTestUserId = 'test_user_456';
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

    it('should handle user creation and deletion correctly', async () => {
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
}); 