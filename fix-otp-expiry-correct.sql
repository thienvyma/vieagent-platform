-- =====================================================
-- KIỂM TRA CẤU HÌNH AUTH HIỆN TẠI
-- =====================================================
-- Mô tả: Kiểm tra cấu hình authentication
-- Ngày tạo: 2025-07-19
-- =====================================================

-- Bước 1: Kiểm tra các bảng auth có sẵn
SELECT 
    schemaname, 
    tablename 
FROM pg_tables 
WHERE schemaname = 'auth' 
ORDER BY tablename;

-- Bước 2: Kiểm tra cấu hình auth từ pg_settings
SELECT 
    name, 
    setting, 
    unit 
FROM pg_settings 
WHERE name LIKE '%auth%' 
   OR name LIKE '%password%' 
   OR name LIKE '%session%';

-- Bước 3: Kiểm tra các function auth
SELECT 
    n.nspname as schema,
    p.proname as function_name
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'auth'
ORDER BY p.proname; 