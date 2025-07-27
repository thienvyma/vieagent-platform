import { Metadata } from 'next';
import Link from 'next/link';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

export const metadata: Metadata = {
  title: 'Chính sách Quyền riêng tư - VIEAgent',
  description:
    'Chính sách quyền riêng tư và bảo vệ dữ liệu của VIEAgent. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ thông tin cá nhân của bạn.',
  keywords: 'chính sách quyền riêng tư, bảo vệ dữ liệu, GDPR, privacy policy, VIEAgent',
  openGraph: {
    title: 'Chính sách Quyền riêng tư - VIEAgent',
    description: 'Chính sách quyền riêng tư và bảo vệ dữ liệu của VIEAgent',
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900'>
      {/* Header */}
      <header className='bg-gray-900/50 backdrop-blur-sm border-b border-gray-800/50 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center py-4'>
            <div className='flex items-center space-x-4'>
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center'>
                <VIEAgentLogo size='small' />
              </div>
              <div>
                <h1 className='text-xl font-bold text-white'>VIEAgent</h1>
                <p className='text-gray-400 text-sm'>Chính sách Quyền riêng tư</p>
              </div>
            </div>
            <nav className='hidden md:flex space-x-6'>
              <Link href='/' className='text-gray-300 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <a href='/contact' className='text-gray-300 hover:text-white transition-colors'>
                Liên hệ
              </a>
              <a
                href='/login'
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
              >
                Đăng nhập
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <div className='w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>🛡️</span>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>
            Chính sách Quyền riêng tư
          </h1>
          <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
            Chúng tôi cam kết bảo vệ quyền riêng tư và dữ liệu cá nhân của bạn. Tài liệu này giải
            thích cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn.
          </p>
          <div className='mt-6 text-sm text-gray-400'>
            <p>
              Cập nhật lần cuối: <span className='text-blue-400'>27 tháng 6, 2024</span>
            </p>
            <p>
              Có hiệu lực từ: <span className='text-blue-400'>1 tháng 7, 2024</span>
            </p>
          </div>
        </div>

        {/* Table of Contents */}
        <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-700/50'>
          <h2 className='text-xl font-semibold text-white mb-4 flex items-center'>
            <span className='mr-2'>📋</span>
            Mục lục
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
            {[
              { id: 'overview', title: '1. Tổng quan' },
              { id: 'data-collection', title: '2. Thu thập dữ liệu' },
              { id: 'data-usage', title: '3. Sử dụng dữ liệu' },
              { id: 'data-sharing', title: '4. Chia sẻ dữ liệu' },
              { id: 'data-security', title: '5. Bảo mật dữ liệu' },
              { id: 'user-rights', title: '6. Quyền của người dùng' },
              { id: 'cookies', title: '7. Cookies và Tracking' },
              { id: 'third-party', title: '8. Dịch vụ bên thứ ba' },
              { id: 'data-retention', title: '9. Lưu trữ dữ liệu' },
              { id: 'international', title: '10. Chuyển giao quốc tế' },
              { id: 'children', title: '11. Trẻ em dưới 16 tuổi' },
              { id: 'updates', title: '12. Cập nhật chính sách' },
              { id: 'contact', title: '13. Thông tin liên hệ' },
              { id: 'compliance', title: '14. Tuân thủ pháp luật' },
            ].map(item => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className='text-blue-400 hover:text-blue-300 transition-colors p-2 rounded-lg hover:bg-gray-700/30'
              >
                {item.title}
              </a>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <div className='space-y-8'>
          {/* Section 1: Overview */}
          <section
            id='overview'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🎯</span>
              1. Tổng quan
            </h2>
            <div className='prose prose-invert max-w-none'>
              <p className='text-gray-300 text-lg leading-relaxed mb-4'>
                VIEAgent ("chúng tôi", "của chúng tôi") cam kết bảo vệ quyền riêng tư của bạn. Chính
                sách này áp dụng cho tất cả thông tin chúng tôi thu thập thông qua:
              </p>
              <ul className='text-gray-300 space-y-2 ml-6'>
                <li>• Website và ứng dụng web của chúng tôi</li>
                <li>• API và dịch vụ tích hợp</li>
                <li>• Chatbot và AI Agent</li>
                <li>• Email và liên lạc trực tiếp</li>
                <li>• Tích hợp với các nền tảng bên thứ ba (Google, Facebook, etc.)</li>
              </ul>
              <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6'>
                <p className='text-blue-300 font-medium'>
                  🔒 Cam kết của chúng tôi: Chúng tôi không bao giờ bán dữ liệu cá nhân của bạn cho
                  bên thứ ba.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Data Collection */}
          <section
            id='data-collection'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>📊</span>
              2. Thu thập dữ liệu
            </h2>
            <div className='space-y-6'>
              <div>
                <h3 className='text-xl font-semibold text-white mb-3'>
                  2.1 Thông tin bạn cung cấp trực tiếp
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='bg-gray-700/30 rounded-lg p-4'>
                    <h4 className='font-medium text-blue-400 mb-2'>Thông tin tài khoản</h4>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Tên và email</li>
                      <li>• Mật khẩu (được mã hóa)</li>
                      <li>• Ảnh đại diện</li>
                      <li>• Thông tin công ty</li>
                    </ul>
                  </div>
                  <div className='bg-gray-700/30 rounded-lg p-4'>
                    <h4 className='font-medium text-green-400 mb-2'>Dữ liệu sử dụng</h4>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Cuộc hội thoại với AI</li>
                      <li>• Cấu hình Agent</li>
                      <li>• Tài liệu tải lên</li>
                      <li>• Cài đặt tùy chỉnh</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-white mb-3'>
                  2.2 Thông tin thu thập tự động
                </h3>
                <div className='bg-gray-700/30 rounded-lg p-4'>
                  <ul className='text-gray-300 space-y-2'>
                    <li>
                      • <strong>Thông tin kỹ thuật:</strong> IP address, browser, thiết bị, hệ điều
                      hành
                    </li>
                    <li>
                      • <strong>Dữ liệu sử dụng:</strong> Trang truy cập, thời gian sử dụng, tính
                      năng được dùng
                    </li>
                    <li>
                      • <strong>Cookies:</strong> Preferences, session data, analytics
                    </li>
                    <li>
                      • <strong>Performance data:</strong> Response time, error logs, system metrics
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className='text-xl font-semibold text-white mb-3'>
                  2.3 Dữ liệu từ tích hợp bên thứ ba
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                    <h4 className='font-medium text-red-400 mb-2'>Google Services</h4>
                    <p className='text-gray-300 text-sm'>
                      Gmail, Calendar, Drive, Docs, Sheets (chỉ khi bạn kết nối)
                    </p>
                  </div>
                  <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                    <h4 className='font-medium text-blue-400 mb-2'>Facebook/Meta</h4>
                    <p className='text-gray-300 text-sm'>
                      Pages, Messenger data (chỉ khi bạn kết nối)
                    </p>
                  </div>
                  <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                    <h4 className='font-medium text-purple-400 mb-2'>Other Platforms</h4>
                    <p className='text-gray-300 text-sm'>Zalo, WhatsApp, Telegram (theo yêu cầu)</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Data Usage */}
          <section
            id='data-usage'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>⚙️</span>
              3. Sử dụng dữ liệu
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Chúng tôi sử dụng dữ liệu của bạn cho các mục đích sau:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-green-400 mb-2'>🎯 Cung cấp dịch vụ</h3>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Vận hành AI Agent và chatbot</li>
                      <li>• Xử lý và phản hồi tin nhắn</li>
                      <li>• Đồng bộ dữ liệu từ các nền tảng</li>
                      <li>• Cung cấp analytics và insights</li>
                    </ul>
                  </div>

                  <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-blue-400 mb-2'>🔧 Cải thiện dịch vụ</h3>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Phân tích hiệu suất hệ thống</li>
                      <li>• Tối ưu hóa AI models</li>
                      <li>• Phát triển tính năng mới</li>
                      <li>• Sửa lỗi và bảo trì</li>
                    </ul>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-purple-400 mb-2'>📧 Liên lạc</h3>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Gửi thông báo quan trọng</li>
                      <li>• Hỗ trợ kỹ thuật</li>
                      <li>• Cập nhật sản phẩm</li>
                      <li>• Marketing (có thể hủy đăng ký)</li>
                    </ul>
                  </div>

                  <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-yellow-400 mb-2'>🛡️ Bảo mật</h3>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Phát hiện gian lận</li>
                      <li>• Ngăn chặn spam và abuse</li>
                      <li>• Tuân thủ pháp luật</li>
                      <li>• Bảo vệ quyền lợi người dùng</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Data Sharing */}
          <section
            id='data-sharing'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🤝</span>
              4. Chia sẻ dữ liệu
            </h2>
            <div className='space-y-6'>
              <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-red-400 mb-3'>
                  🚫 Chúng tôi KHÔNG chia sẻ dữ liệu cho:
                </h3>
                <ul className='text-gray-300 space-y-1'>
                  <li>• Các công ty quảng cáo để targeting</li>
                  <li>• Data brokers hoặc third-party marketers</li>
                  <li>• Bất kỳ bên nào để bán hoặc cho thuê dữ liệu</li>
                </ul>
              </div>

              <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-green-400 mb-3'>
                  ✅ Chúng tôi có thể chia sẻ dữ liệu trong các trường hợp:
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-4'>
                  <div>
                    <h4 className='font-medium text-white mb-2'>Service Providers</h4>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Cloud hosting (AWS, Google Cloud)</li>
                      <li>• Analytics providers</li>
                      <li>• Payment processors</li>
                      <li>• Email service providers</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className='font-medium text-white mb-2'>Yêu cầu pháp lý</h4>
                    <ul className='text-gray-300 text-sm space-y-1'>
                      <li>• Lệnh của tòa án</li>
                      <li>• Yêu cầu của cơ quan chức năng</li>
                      <li>• Bảo vệ quyền lợi hợp pháp</li>
                      <li>• Ngăn chặn tội phạm</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Data Security */}
          <section
            id='data-security'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🔒</span>
              5. Bảo mật dữ liệu
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Chúng tôi áp dụng các biện pháp bảo mật tiên tiến để bảo vệ dữ liệu của bạn:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>🔐</div>
                  <h3 className='font-semibold text-blue-400 mb-2'>Mã hóa</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• HTTPS/TLS 1.3</li>
                    <li>• AES-256 encryption</li>
                    <li>• End-to-end encryption</li>
                  </ul>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>🛡️</div>
                  <h3 className='font-semibold text-green-400 mb-2'>Access Control</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Multi-factor authentication</li>
                    <li>• Role-based permissions</li>
                    <li>• Regular access reviews</li>
                  </ul>
                </div>

                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>📊</div>
                  <h3 className='font-semibold text-purple-400 mb-2'>Monitoring</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• 24/7 security monitoring</li>
                    <li>• Intrusion detection</li>
                    <li>• Audit logs</li>
                  </ul>
                </div>

                <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>🏢</div>
                  <h3 className='font-semibold text-yellow-400 mb-2'>Infrastructure</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• SOC 2 compliant providers</li>
                    <li>• Regular security audits</li>
                    <li>• Backup và disaster recovery</li>
                  </ul>
                </div>

                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>👥</div>
                  <h3 className='font-semibold text-red-400 mb-2'>Team Security</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Security training</li>
                    <li>• Background checks</li>
                    <li>• Confidentiality agreements</li>
                  </ul>
                </div>

                <div className='bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4'>
                  <div className='text-2xl mb-2'>🔄</div>
                  <h3 className='font-semibold text-indigo-400 mb-2'>Updates</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Regular security patches</li>
                    <li>• Vulnerability assessments</li>
                    <li>• Penetration testing</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 6: User Rights */}
          <section
            id='user-rights'
            className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>⚖️</span>
              6. Quyền của người dùng
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Bạn có các quyền sau đối với dữ liệu cá nhân của mình:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-blue-400 mb-2 flex items-center'>
                      <span className='mr-2'>👁️</span>
                      Quyền truy cập
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Yêu cầu bản sao dữ liệu cá nhân chúng tôi đang xử lý về bạn.
                    </p>
                  </div>

                  <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-green-400 mb-2 flex items-center'>
                      <span className='mr-2'>✏️</span>
                      Quyền chỉnh sửa
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Yêu cầu chỉnh sửa dữ liệu không chính xác hoặc không đầy đủ.
                    </p>
                  </div>

                  <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-red-400 mb-2 flex items-center'>
                      <span className='mr-2'>🗑️</span>
                      Quyền xóa
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Yêu cầu xóa dữ liệu cá nhân trong một số trường hợp nhất định.
                    </p>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-purple-400 mb-2 flex items-center'>
                      <span className='mr-2'>⏸️</span>
                      Quyền hạn chế
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Yêu cầu hạn chế việc xử lý dữ liệu cá nhân của bạn.
                    </p>
                  </div>

                  <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-yellow-400 mb-2 flex items-center'>
                      <span className='mr-2'>📦</span>
                      Quyền di chuyển
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Nhận dữ liệu của bạn ở định dạng có thể đọc được bằng máy.
                    </p>
                  </div>

                  <div className='bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-indigo-400 mb-2 flex items-center'>
                      <span className='mr-2'>🚫</span>
                      Quyền phản đối
                    </h3>
                    <p className='text-gray-300 text-sm'>
                      Phản đối việc xử lý dữ liệu cho mục đích marketing hoặc lợi ích hợp pháp.
                    </p>
                  </div>
                </div>
              </div>

              <div className='bg-gray-700/30 rounded-lg p-6 mt-6'>
                <h3 className='font-semibold text-white mb-3'>Cách thực hiện quyền của bạn:</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>
                    • <strong>Tự động:</strong> Sử dụng các tính năng trong tài khoản của bạn
                  </p>
                  <p>
                    • <strong>Email:</strong> Gửi yêu cầu đến privacy@aiagentplatform.com
                  </p>
                  <p>
                    • <strong>Thời gian phản hồi:</strong> Trong vòng 30 ngày
                  </p>
                  <p>
                    • <strong>Miễn phí:</strong> Không tính phí cho các yêu cầu hợp lý
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section
            id='contact'
            className='bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-2xl p-8'
          >
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>📞</span>
              13. Thông tin liên hệ
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-semibold text-white mb-4'>Data Protection Officer</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>📧 Email: privacy@aiagentplatform.com</p>
                  <p>📱 Hotline: +84 (0) 123 456 789</p>
                  <p>📍 Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                  <p>🕒 Giờ làm việc: 8:00 - 17:00 (T2-T6)</p>
                </div>
              </div>
              <div>
                <h3 className='font-semibold text-white mb-4'>Liên hệ khẩn cấp</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>🔴 Security issues: security@aiagentplatform.com</p>
                  <p>🔴 Data breach: breach@aiagentplatform.com</p>
                  <p>⚖️ Legal matters: legal@aiagentplatform.com</p>
                  <p>💬 Live chat: Có sẵn trong ứng dụng</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className='mt-16 pt-8 border-t border-gray-700/50'>
          <div className='text-center'>
            <p className='text-gray-400 mb-4'>
              Chính sách này là một phần của
              <a href='/terms' className='text-blue-400 hover:text-blue-300 mx-1'>
                Điều khoản Dịch vụ
              </a>
              của chúng tôi.
            </p>
            <div className='flex justify-center space-x-6 text-sm'>
              <Link href='/' className='text-gray-400 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <a href='/terms' className='text-gray-400 hover:text-white transition-colors'>
                Điều khoản
              </a>
              <a href='/contact' className='text-gray-400 hover:text-white transition-colors'>
                Liên hệ
              </a>
              <a href='/cookie-policy' className='text-gray-400 hover:text-white transition-colors'>
                Cookie Policy
              </a>
            </div>
            <p className='text-gray-500 text-sm mt-4'>
              © 2024 VIEAgent. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}
