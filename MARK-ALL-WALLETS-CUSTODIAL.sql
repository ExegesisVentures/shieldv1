-- =====================================================
-- MARK ALL 5 WALLETS AS CUSTODIAL FOR nestd@pm.me
-- =====================================================

-- First, add updated_at column if it doesn't exist (for trigger)
ALTER TABLE public.wallets 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update all wallets for nestd@pm.me to be custodial
UPDATE public.wallets
SET 
  is_custodial = true,
  source = 'admin',
  custodian_note = 'Admin custodial wallet'
WHERE public_user_id IN (
  SELECT up.public_user_id 
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.auth_user_id
  WHERE au.email = 'nestd@pm.me'
);

-- Verify the update
SELECT 
  '=== VERIFICATION ===' as status,
  '' as data
UNION ALL
SELECT 
  'Total Wallets',
  COUNT(*)::text
FROM public.wallets w
WHERE w.public_user_id IN (
  SELECT up.public_user_id 
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.auth_user_id
  WHERE au.email = 'nestd@pm.me'
)
UNION ALL
SELECT 
  'Custodial Wallets',
  COUNT(*)::text
FROM public.wallets w
WHERE w.public_user_id IN (
  SELECT up.public_user_id 
  FROM public.user_profiles up
  JOIN auth.users au ON au.id = up.auth_user_id
  WHERE au.email = 'nestd@pm.me'
)
AND w.is_custodial = true;

-- Show all wallets with their status
SELECT 
  w.address,
  w.label,
  w.is_custodial,
  w.source,
  w.custodian_note,
  CASE 
    WHEN LOWER(w.address) IN (
      'core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg',
      'core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw',
      'core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu'
    ) THEN '✅ ADMIN'
    ELSE '📝 Regular'
  END as admin_status
FROM auth.users au
JOIN public.user_profiles up ON up.auth_user_id = au.id
JOIN public.wallets w ON w.public_user_id = up.public_user_id
WHERE au.email = 'nestd@pm.me'
ORDER BY w.created_at;

-- Final verification query
SELECT 
  au.email,
  COUNT(w.id) as total_wallets,
  SUM(CASE WHEN w.is_custodial THEN 1 ELSE 0 END) as custodial_wallets,
  SUM(CASE WHEN LOWER(w.address) IN (
    'core1mgvlgvh2hfw5pgdqc79up3du69v2z3t8qz4kwg',
    'core1jcas459gnu857ylephjdjlea3rkr38m0asj6gw',
    'core1ltltw0jya4hq39myd9798qqvu6jzy6zxalxhqu'
  ) THEN 1 ELSE 0 END) as admin_wallets
FROM auth.users au
JOIN public.user_profiles up ON up.auth_user_id = au.id
JOIN public.wallets w ON w.public_user_id = up.public_user_id
WHERE au.email = 'nestd@pm.me'
GROUP BY au.email;

-- Expected result:
-- | email       | total_wallets | custodial_wallets | admin_wallets |
-- | nestd@pm.me | 5             | 5                 | 3             |
-- 
-- ✅ All 5 wallets should now be custodial!

