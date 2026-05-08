import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? '';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY ?? '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Creating leads table...');

  // Use raw SQL via the Supabase SQL editor API
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public.leads (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        email text NOT NULL,
        company_name text,
        role text,
        team_size integer,
        audit_id text NOT NULL,
        created_at timestamptz DEFAULT now()
      );
      ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies WHERE tablename = 'leads' AND policyname = 'service_role_all'
        ) THEN
          CREATE POLICY service_role_all ON public.leads
            FOR ALL TO service_role USING (true) WITH CHECK (true);
        END IF;
      END $$;
    `
  });

  if (error) {
    // rpc not available — try direct insert to check if table exists
    console.log('RPC not available, checking table directly...');
    const { error: checkError } = await supabase.from('leads').select('id').limit(1);
    if (checkError?.code === '42P01') {
      console.error('\n❌ Table does not exist and cannot be created automatically.');
      console.error('Please run this SQL in your Supabase dashboard SQL editor:');
      console.error(`
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  company_name text,
  role text,
  team_size integer,
  audit_id text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY service_role_all ON public.leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);
      `);
      process.exit(1);
    } else {
      console.log('✅ Table already exists or was created.');
    }
  } else {
    console.log('✅ Table created successfully.');
  }

  // Verify
  const { data, error: verifyError } = await supabase.from('leads').select('id').limit(1);
  if (verifyError) {
    console.error('❌ Verification failed:', verifyError.message);
  } else {
    console.log('✅ Supabase leads table is ready. Rows:', data?.length ?? 0);
  }
}

setup();
