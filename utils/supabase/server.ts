import { createServerSupabaseClient, createClerkSupabaseClientSsr } from './context';

export const createClient = createServerSupabaseClient;
export { createClerkSupabaseClientSsr };
