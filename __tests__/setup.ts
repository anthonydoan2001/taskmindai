import { beforeAll, vi } from 'vitest';
import { config } from 'dotenv';

// Load environment variables from .env.test
config({ path: '.env.test' });

// Set up test environment variables
beforeAll(() => {
  // Set test environment using vi.stubEnv
  vi.stubEnv('NODE_ENV', 'test');
  
  // Set default values only if environment variables are not already set
  if (!process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = 'https://test.supabase.co';
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  }
  if (!process.env.CLERK_WEBHOOK_SECRET) {
    process.env.CLERK_WEBHOOK_SECRET = 'test-secret';
  }
  if (!process.env.AXIOM_TOKEN) {
    process.env.AXIOM_TOKEN = 'test-token';
  }
  if (!process.env.AXIOM_ORG_ID) {
    process.env.AXIOM_ORG_ID = 'test-org';
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = process.env.NGROK_URL || 'http://localhost:3000';
  }

  // Log environment setup for debugging
  console.log('Test environment setup:', {
    nodeEnv: process.env.NODE_ENV,
    hasAxiomToken: !!process.env.AXIOM_TOKEN,
    axiomTokenPrefix: process.env.AXIOM_TOKEN?.substring(0, 5),
    hasAxiomOrgId: !!process.env.AXIOM_ORG_ID,
    axiomOrgId: process.env.AXIOM_ORG_ID,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasClerkSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });
}); 