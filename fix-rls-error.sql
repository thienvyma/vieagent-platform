-- ========================================
-- Khắc phục lỗi RLS cho verification_tokens
-- ========================================

-- Bật RLS cho bảng verification_tokens
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Tạo policy cho verification_tokens
CREATE POLICY "Allow verification token operations" ON verification_tokens
  FOR ALL USING (true);

-- Kiểm tra kết quả
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'verification_tokens';

-- Thông báo hoàn thành
SELECT 'RLS error fixed for verification_tokens!' as status; 