import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Public client for reading weather data and Realtime subscriptions (lazy singleton)
let _publicClient: SupabaseClient | null = null;

export function getSupabase() {
  if (!_publicClient) {
    _publicClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _publicClient;
}

// Server-side client with service role key (for API routes)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
