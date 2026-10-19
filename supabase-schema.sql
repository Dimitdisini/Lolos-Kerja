-- =========================================================================
-- LOLOS KERJA MASTER DATABASE DDL (SUPABASE / POSTGRESQL ENTERPRISE)
-- Arsitektur: Dimitri HQ (PT Fleek Group & PT Xavortree Digital Solution)
-- Versi: 1.0.0 (Production Schema dengan RLS & Realtime Engine)
-- =========================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE user_tier_enum AS ENUM ('FREE', 'FLASH', 'DIBANTUIN', 'VIP');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_role_enum AS ENUM ('user', 'admin', 'owner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE tx_status_enum AS ENUM ('PENDING', 'SETTLED', 'EXPIRED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE blast_status_enum AS ENUM ('TERKIRIM', 'GAGAL', 'BOUNCED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABEL USERS (Master Profil & Kuota Akun)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role_enum DEFAULT 'user',
    tier user_tier_enum DEFAULT 'FREE',
    blast_quota INT DEFAULT 10 CHECK (blast_quota >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL TRANSACTIONS (Audit Finansial QRIS & Settlement)
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    plan_name VARCHAR(100) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'QRIS',
    payment_status tx_status_enum DEFAULT 'SETTLED',
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL BLAST_LOGS (Log Korespondensi Legal B2B)
CREATE TABLE IF NOT EXISTS public.blast_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    target_company VARCHAR(255) NOT NULL,
    target_role VARCHAR(255) NOT NULL,
    recruiter_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    cover_letter_body TEXT,
    attachment_name VARCHAR(255),
    status blast_status_enum DEFAULT 'TERKIRIM',
    sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. STORED PROCEDURE: ATOMIC QUOTA DECREMENT (Anti Race-Condition)
CREATE OR REPLACE FUNCTION public.decrement_blast_quota(target_email VARCHAR)
RETURNS INT AS $$
DECLARE
    remaining_quota INT;
BEGIN
    UPDATE public.users
    SET blast_quota = blast_quota - 1
    WHERE email = target_email AND blast_quota > 0
    RETURNING blast_quota INTO remaining_quota;
    
    IF remaining_quota IS NULL THEN
        RAISE EXCEPTION 'Kuota blast habis atau user tidak ditemukan';
    END IF;
    
    RETURN remaining_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blast_logs ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES (Public Anon Read/Write for Frontend Client with API Key)
DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to users" ON public.users;
    CREATE POLICY "Public access to users" ON public.users FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to transactions" ON public.transactions;
    CREATE POLICY "Public access to transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Public access to blast_logs" ON public.blast_logs;
    CREATE POLICY "Public access to blast_logs" ON public.blast_logs FOR ALL USING (true) WITH CHECK (true);
EXCEPTION WHEN undefined_object THEN null; END $$;

-- 9. ENABLE REALTIME REPLICATION (Agar HP & Laptop Langsung Tembus Live)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blast_logs;
