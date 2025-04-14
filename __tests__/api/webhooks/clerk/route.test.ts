import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Webhook } from 'svix';
import type { UserJSON } from '@clerk/backend';
import type { WebhookEvent, DeletedObjectJSON } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { Axiom } from '@axiomhq/js';
import { ErrorTypes } from '@/lib/errors';

// Mock environment variables
vi.mock('process', () => ({
  env: {
    NODE_ENV: 'test',
    AXIOM_TOKEN: 'test-token',
    AXIOM_ORG_ID: 'test-org',
    CLERK_WEBHOOK_SECRET: 'test-secret',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
  }
}));

// Mock Axiom client
vi.mock('@axiomhq/js', () => ({
  Axiom: vi.fn(() => ({
    ingest: vi.fn().mockResolvedValue(undefined)
  }))
}));

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      upsert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn(() => ({
        eq: vi.fn().mockResolvedValue({ data: null, error: null })
      }))
    }))
  }))
}));

// Test data
const mockUser = {
  id: 'test-user-id',
  email_addresses: [
    {
      email_address: 'test@example.com',
    }
  ],
};

describe('Clerk Webhook Handler', () => {
  const mockUserData: UserJSON = {
    object: 'user',
    id: 'user_test123',
    external_id: null,
    primary_email_address_id: 'email_test123',
    primary_phone_number_id: null,
    primary_web3_wallet_id: null,
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    image_url: 'https://example.com/avatar.jpg',
    has_image: true,
    email_addresses: [{
      email_address: 'test@example.com',
      id: 'email_test123',
      object: 'email_address',
      verification: null,
      linked_to: []
    }],
    phone_numbers: [],
    web3_wallets: [],
    external_accounts: [],
    saml_accounts: [],
    organization_memberships: [],
    password_enabled: true,
    totp_enabled: false,
    backup_code_enabled: false,
    two_factor_enabled: false,
    banned: false,
    locked: false,
    last_active_at: 1701111111,
    last_sign_in_at: 1701111111,
    created_at: 1701111111,
    updated_at: 1701111111,
    password_last_updated_at: 1701111111,
    public_metadata: {},
    private_metadata: {},
    unsafe_metadata: {},
    create_organization_enabled: true,
    create_organizations_limit: null,
    delete_self_enabled: true,
    legal_accepted_at: null,
    lockout_expires_in_seconds: null,
    verification_attempts_remaining: 3,
  };

  const mockWebhookEvent: WebhookEvent = {
    data: mockUserData,
    object: 'event',
    type: 'user.created',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should handle user.created event', async () => {
    const { POST } = await import('@/app/api/webhooks/clerk/route');
    
    const mockReq = new Request('https://example.com/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'v1,test-signature',
      },
      body: JSON.stringify(mockWebhookEvent),
    });

    const response = await POST(mockReq);
    expect(response.status).toBe(200);
  });

  it('should handle user.deleted event', async () => {
    const { POST } = await import('@/app/api/webhooks/clerk/route');
    
    const mockDeletedData: DeletedObjectJSON = {
      id: mockUserData.id,
      object: 'user',
      deleted: true,
      slug: undefined
    };

    const deleteEvent: WebhookEvent = {
      data: mockDeletedData,
      object: 'event',
      type: 'user.deleted',
    };

    const mockReq = new Request('https://example.com/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'v1,test-signature',
      },
      body: JSON.stringify(deleteEvent),
    });

    const response = await POST(mockReq);
    expect(response.status).toBe(200);
  });

  it('should handle invalid webhook signature', async () => {
    const { POST } = await import('@/app/api/webhooks/clerk/route');
    
    const mockReq = new Request('https://example.com/api/webhooks/clerk', {
      method: 'POST',
      headers: {
        'svix-id': 'test-id',
        'svix-timestamp': Math.floor(Date.now() / 1000).toString(),
        'svix-signature': 'invalid-signature',
      },
      body: JSON.stringify(mockWebhookEvent),
    });

    const response = await POST(mockReq);
    expect(response.status).toBe(400);
    const responseData = await response.json();
    expect(responseData.error).toBe(ErrorTypes.WEBHOOK_VERIFICATION);
  });
}); 