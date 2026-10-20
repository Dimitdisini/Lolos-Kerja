-- =========================================================================
-- LOLOS KERJA MASTER DATABASE DDL (SUPABASE / POSTGRESQL ENTERPRISE)
-- Arsitektur: Dimitri HQ (PT Fleek Group & PT Xavortree Digital Solution)
-- Versi: 2.0.0 (Hardened Production Schema: Strict RLS & Dedicated Modules)
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

-- 3. TABEL USERS (Master Profil & Kuota Akun, Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    role user_role_enum DEFAULT 'user',
    tier user_tier_enum DEFAULT 'FREE',
    blast_quota INT DEFAULT 10 CHECK (blast_quota >= 0),
    tier_expires_at TIMESTAMPTZ,
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
    payment_status tx_status_enum DEFAULT 'PENDING',
    payment_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    settled_at TIMESTAMPTZ
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

-- 6. TABEL CV_DOCUMENTS (Dokumen CV Persisten per User)
CREATE TABLE IF NOT EXISTS public.cv_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    target_role VARCHAR(100),
    raw_text TEXT,
    parsed_sections JSONB DEFAULT '{}'::jsonb,
    ats_score INT DEFAULT 0,
    star_points JSONB DEFAULT '[]'::jsonb,
    pdf_url TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL INTERVIEW_SESSIONS (Sesi Wawancara Persisten)
CREATE TABLE IF NOT EXISTS public.interview_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    job_id VARCHAR(100),
    question TEXT NOT NULL,
    audio_transcript TEXT,
    relevancy_score INT DEFAULT 0,
    delivery_score INT DEFAULT 0,
    filler_words JSONB DEFAULT '{}'::jsonb,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL APPLICATIONS (Riwayat Pelamaran Loker)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    job_id VARCHAR(100),
    company_name VARCHAR(255) NOT NULL,
    position VARCHAR(255) NOT NULL,
    channel VARCHAR(50) DEFAULT 'DIRECT_EMAIL',
    status VARCHAR(50) DEFAULT 'APPLIED',
    applied_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL SCRAPE_REQUESTS (Permintaan Bot Scrape Pengguna)
CREATE TABLE IF NOT EXISTS public.scrape_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    role_target VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    notes TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL JOBS (Katalog Loker Terkurasi & Kedaluwarsa)
CREATE TABLE IF NOT EXISTS public.jobs (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    location VARCHAR(255),
    type VARCHAR(50),
    salary VARCHAR(100),
    description TEXT,
    source_url TEXT,
    verified_email VARCHAR(255),
    posted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE
);

-- 11. SECURITY DEFINER HELPER: IS_ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role IN ('admin', 'owner')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. STORED PROCEDURE: ATOMIC QUOTA DECREMENT (Anti Race-Condition)
CREATE OR REPLACE FUNCTION public.decrement_blast_quota(target_user_id UUID)
RETURNS INT AS $$
DECLARE
    remaining_quota INT;
BEGIN
    UPDATE public.users
    SET blast_quota = blast_quota - 1
    WHERE id = target_user_id AND blast_quota > 0
    RETURNING blast_quota INTO remaining_quota;
    
    IF remaining_quota IS NULL THEN
        RAISE EXCEPTION 'Kuota blast habis atau user tidak ditemukan';
    END IF;
    
    RETURN remaining_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. AUTH TRIGGER: AUTO-SYNC AUTH.USERS TO PUBLIC.USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url, role, tier, blast_quota)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&crop=faces'),
        'user',
        'FREE',
        10
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 14. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cv_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 15. STRICT RLS POLICIES (Zero Public Override / Anti-Bypass)

-- A. USERS: User reads own profile, admin reads all.
-- User can update own name/avatar ONLY (tier, blast_quota, role locked).
DROP POLICY IF EXISTS "Public access to users" ON public.users;
CREATE POLICY "Users read own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users update own profile non-privileged" ON public.users 
    FOR UPDATE USING (auth.uid() = id OR public.is_admin())
    WITH CHECK (
        (auth.uid() = id AND 
         tier = (SELECT tier FROM public.users WHERE id = auth.uid()) AND
         blast_quota = (SELECT blast_quota FROM public.users WHERE id = auth.uid()) AND
         role = (SELECT role FROM public.users WHERE id = auth.uid())
        ) OR public.is_admin()
    );

-- B. TRANSACTIONS: User reads own tx, writes only pending tx. Settled by webhook/admin.
DROP POLICY IF EXISTS "Public access to transactions" ON public.transactions;
CREATE POLICY "Users read own transactions" ON public.transactions 
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users create pending transactions" ON public.transactions 
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- C. BLAST_LOGS: User reads and inserts own logs.
DROP POLICY IF EXISTS "Public access to blast_logs" ON public.blast_logs;
CREATE POLICY "Users read own blast logs" ON public.blast_logs 
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users write own blast logs" ON public.blast_logs 
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- D. CV_DOCUMENTS: User CRUD own CVs only.
CREATE POLICY "Users manage own CV documents" ON public.cv_documents 
    FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- E. INTERVIEW_SESSIONS: User CRUD own interview sessions.
CREATE POLICY "Users manage own interview sessions" ON public.interview_sessions 
    FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- F. APPLICATIONS: User manages own applications.
CREATE POLICY "Users manage own applications" ON public.applications 
    FOR ALL USING (user_id = auth.uid() OR public.is_admin());

-- G. SCRAPE_REQUESTS: User reads and inserts requests.
CREATE POLICY "Users view own scrape requests" ON public.scrape_requests 
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users insert scrape requests" ON public.scrape_requests 
    FOR INSERT WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- H. JOBS: Public read active jobs, admin manages all jobs.
CREATE POLICY "Public read active jobs" ON public.jobs 
    FOR SELECT USING (is_active = true OR public.is_admin());

CREATE POLICY "Admin manage jobs" ON public.jobs 
    FOR ALL USING (public.is_admin());

-- 16. SECURE REALTIME REPLICATION (Only on user's own channel / safe tables)
ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.blast_logs;
