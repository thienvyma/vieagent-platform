-- =====================================================
-- KHẮC PHỤC WARNING: Auth OTP Long Expiry
-- =====================================================
-- Mô tả: Giảm thời gian OTP expiry xuống dưới 1 giờ
-- Ngày tạo: 2025-07-19
-- =====================================================

-- Bước 1: Kiểm tra cấu hình OTP hiện tại
SELECT 
    'Current OTP configuration:' as info,
    auth.config->>'email_otp_expiry' as current_otp_expiry;

-- Bước 2: Cập nhật OTP expiry xuống 30 phút (1800 giây)
UPDATE auth.config 
SET config = jsonb_set(
    config, 
    '{email_otp_expiry}', 
    '1800'
) 
WHERE id = 1;

-- Bước 3: Xác nhận thay đổi
SELECT 
    'Updated OTP configuration:' as info,
    auth.config->>'email_otp_expiry' as new_otp_expiry,
    'OTP expiry set to 30 minutes (1800 seconds)' as status;

-- Bước 4: Kiểm tra tất cả cấu hình auth
SELECT 
    'Auth configuration summary:' as info,
    config->>'email_otp_expiry' as otp_expiry,
    config->>'enable_signup' as enable_signup,
    config->>'enable_confirmations' as enable_confirmations; 