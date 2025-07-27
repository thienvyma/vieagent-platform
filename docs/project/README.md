# VIEAgent

VIEAgent là một nền tảng AI Agent tiên tiến được thiết kế đặc biệt cho người dùng Việt Nam. Nền tảng này cung cấp các tính năng AI mạnh mẽ với khả năng tích hợp Google Services, hệ thống RAG (Retrieval-Augmented Generation), và auto-learning.

## ✨ Tính năng chính

### 🤖 AI Agent System
- **Multi-Model Support**: Hỗ trợ OpenAI, Anthropic, Google Gemini
- **Intelligent Model Switching**: Tự động chuyển đổi model phù hợp
- **Cost Optimization**: Theo dõi và tối ưu chi phí sử dụng

### 📚 Knowledge Management
- **RAG System**: Tìm kiếm và truy xuất thông tin thông minh
- **Document Processing**: Xử lý PDF, DOCX, TXT, CSV, JSON
- **Vector Database**: ChromaDB cho tìm kiếm semantic
- **Auto-Learning**: Học hỏi từ phản hồi người dùng

### 🔗 Google Integration
- **Gmail**: Quản lý email thông minh
- **Google Calendar**: Lập lịch tự động
- **Google Sheets**: Xử lý dữ liệu spreadsheet
- **Google Drive**: Quản lý file và folder

### 🛡️ Security & Authentication
- **NextAuth.js**: Xác thực an toàn
- **Role-based Access**: Phân quyền người dùng
- **API Security**: Bảo mật API endpoints

### 📊 Monitoring & Analytics
- **Performance Monitoring**: Theo dõi hiệu suất hệ thống
- **Error Tracking**: Báo cáo và xử lý lỗi
- **Usage Analytics**: Phân tích sử dụng

## 🚀 Công nghệ sử dụng

- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Node.js, Prisma ORM
- **Database**: SQLite (development), PostgreSQL (production)
- **Vector Database**: ChromaDB
- **AI Models**: OpenAI, Anthropic, Google Gemini
- **Authentication**: NextAuth.js
- **UI**: Tailwind CSS, shadcn/ui
- **Deployment**: Vercel, Docker

## 📦 Cài đặt

### Yêu cầu hệ thống
- Node.js 18+
- npm hoặc yarn
- Git

### Cài đặt local

```bash
# Clone repository
git clone <repository-url>
cd vieagent

# Cài đặt dependencies
npm install

# Cấu hình environment variables
cp .env.example .env.local

# Thiết lập database
npm run db:generate
npm run db:push

# Chạy development server
npm run dev
```

## 🔧 Cấu hình

### Environment Variables

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# AI Models
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_API_KEY="your-google-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## 🎨 VIEAgent Logo Usage

### Component Import
```tsx
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';
```

### Basic Usage
```tsx
// Default logo
<VIEAgentLogo />

// Small navigation logo
<VIEAgentLogo size="small" />

// Large horizontal logo
<VIEAgentLogo size="large" variant="horizontal" />
```

## 📚 Tài liệu

- [Logo Usage Guide](./VIEAGENT-LOGO-GUIDE.md)
- [Implementation Plan](./STEP_BY_STEP_IMPLEMENTATION_PLAN.md)
- [API Documentation](./docs/api.md)

## 🧪 Testing

```bash
# Chạy tests
npm run test

# Chạy health check
npm run test:health

# Chạy database tests
npm run test:db
```

## 🚀 Deployment

### Production Build
```bash
# Build production
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t vieagent .

# Run container
docker run -p 3000:3000 vieagent
```

## 📈 Monitoring

VIEAgent bao gồm hệ thống monitoring toàn diện:

- **Health Checks**: `/api/health`
- **Performance Metrics**: Real-time performance tracking
- **Error Tracking**: Comprehensive error reporting
- **Usage Analytics**: Detailed usage statistics

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Tạo Pull Request

## 📄 License

Dự án này được cấp phép theo [MIT License](LICENSE).

## 🙏 Acknowledgments

- OpenAI cho GPT models
- Anthropic cho Claude models
- Google cho Gemini models
- Vercel cho hosting platform
- Next.js team cho framework tuyệt vời

---

**VIEAgent** - AI Agent Platform for Vietnamese Users 🇻🇳
