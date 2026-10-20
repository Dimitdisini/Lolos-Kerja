-- ==============================================================================
-- 0003_seed_promote_owner.sql: TEMPLATE PROMOSI AKUN OWNER (TINDAKAN MANUAL)
-- Project: Lolos Kerja (Antigravity Architecture - Dimitri HQ)
-- ==============================================================================
--
-- INSTRUKSI:
-- 1. Jalankan script ini langsung di Supabase Dashboard -> SQL Editor.
-- 2. Ganti placeholder 'OWNER_EMAIL_HERE' dengan alamat email akun terdaftar Anda.
-- 3. Akun akan mendapatkan wewenang role 'owner', tier 'VIP', dan kuota blast tak terbatas.

do $$
declare
  v_target_email text := 'dimitriahmad000@gmail.com'; -- Ganti dengan email owner yang terdaftar
  v_user_id uuid;
begin
  select id into v_user_id
  from public.profiles
  where lower(email) = lower(v_target_email);

  if v_user_id is null then
    raise notice 'Pengguna dengan email % belum mendaftar. Silakan daftar akun terlebih dahulu di Lolos Kerja.', v_target_email;
  else
    update public.profiles
    set
      role = 'owner',
      tier = 'VIP',
      tier_expires_at = now() + interval '10 years',
      daily_blast_limit = 40,
      blast_credits = 9999,
      free_cv_analyses_left = 9999,
      free_interviews_left = 9999
    where id = v_user_id;

    raise notice 'SUKSES: Akun % (ID: %) telah dipromosikan menjadi OWNER dan VIP.', v_target_email, v_user_id;
  end if;
end;
$$;
