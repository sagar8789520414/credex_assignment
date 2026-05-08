import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? '';

const isConfigured = supabaseUrl.startsWith('https://') && supabaseKey.length > 0;

if (!isConfigured) {
  console.warn('[db] Supabase env vars not set — lead storage disabled');
}

// Provide dummy values to avoid createClient throwing on empty strings
export const supabase = createClient(
  isConfigured ? supabaseUrl : 'https://placeholder.supabase.co',
  isConfigured ? supabaseKey : 'placeholder'
);

export { isConfigured as supabaseConfigured };
