# Scripts

Thư mục này chứa các script phục vụ cho việc phát triển, kiểm thử và triển khai dự án AI Agent Platform. Các script được tổ chức thành các nhóm sau:

## Cấu trúc thư mục

- **validation/**: Chứa các script kiểm thử validation cho các tính năng đã được triển khai.
- **deployment/**: Chứa các script phục vụ cho việc triển khai dự án.
- **utilities/**: Chứa các script tiện ích khác.

## Sử dụng

Các script trong thư mục này có thể được chạy bằng Node.js hoặc Python tùy thuộc vào loại file. Ví dụ:

```bash
# Chạy script Node.js
node scripts/validation/day30-load-testing.js

# Chạy script Python
python scripts/start-chromadb-server.py
```

## Lưu ý

Một số script có thể yêu cầu các biến môi trường hoặc cấu hình cụ thể để chạy đúng. Vui lòng tham khảo tài liệu hoặc mã nguồn của từng script để biết thêm chi tiết. 