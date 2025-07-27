import { Metadata } from 'next';
import Link from 'next/link'; // ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

export const metadata: Metadata = {
  title: 'Chính sách Cookie - VIEAgent',
  description:
    'Chính sách sử dụng Cookie và các công nghệ tracking của VIEAgent. Tìm hiểu cách chúng tôi sử dụng cookies để cải thiện trải nghiệm người dùng.',
  keywords: 'cookie policy, chính sách cookie, tracking, VIEAgent, web analytics',
  openGraph: {
    title: 'Chính sách Cookie - VIEAgent',
    description: 'Chính sách sử dụng Cookie và các công nghệ tracking của VIEAgent',
    type: 'website',
  },
};

export default function CookiePolicyPage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900'>
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
                <p className='text-gray-400 text-sm'>Chính sách Cookie</p>
              </div>
            </div>
            <nav className='hidden md:flex space-x-6'>
              {/* ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md */}
              <Link href='/' className='text-gray-300 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <Link href='/privacy' className='text-gray-300 hover:text-white transition-colors'>
                Quyền riêng tư
              </Link>
              <Link href='/terms' className='text-gray-300 hover:text-white transition-colors'>
                Điều khoản
              </Link>
              <Link
                href='/login'
                className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors'
              >
                Đăng nhập
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>🍪</span>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>Chính sách Cookie</h1>
          <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
            Tìm hiểu cách VIEAgent sử dụng cookies và các công nghệ tracking để cải thiện trải
            nghiệm người dùng và cung cấp dịch vụ tốt hơn.
          </p>
          <div className='mt-6 text-sm text-gray-400'>
            <p>
              Cập nhật lần cuối: <span className='text-purple-400'>27 tháng 6, 2024</span>
            </p>
            <p>
              Có hiệu lực từ: <span className='text-purple-400'>1 tháng 7, 2024</span>
            </p>
          </div>
        </div>

        {/* Cookie Consent Banner Demo */}
        <div className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-purple-500/30'>
          <h2 className='text-xl font-semibold text-white mb-4 flex items-center'>
            <span className='mr-2'>🔔</span>
            Cookie Consent Banner
          </h2>
          <div className='bg-gray-900/50 rounded-lg p-4 border border-gray-700/50'>
            <div className='flex items-start space-x-4'>
              <div className='text-2xl'>🍪</div>
              <div className='flex-1'>
                <h3 className='font-semibold text-white mb-2'>Chúng tôi sử dụng cookies</h3>
                <p className='text-gray-300 text-sm mb-4'>
                  Website này sử dụng cookies để cải thiện trải nghiệm của bạn, phân tích lưu lượng
                  và cung cấp nội dung được cá nhân hóa. Bằng việc tiếp tục sử dụng, bạn đồng ý với
                  việc sử dụng cookies.
                </p>
                <div className='flex flex-wrap gap-3'>
                  <button className='bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm transition-colors'>
                    Chấp nhận tất cả
                  </button>
                  <button className='border border-gray-600 text-gray-300 hover:text-white px-4 py-2 rounded-lg text-sm transition-colors'>
                    Tùy chỉnh
                  </button>
                  <button className='text-gray-400 hover:text-white px-4 py-2 text-sm transition-colors'>
                    Từ chối
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className='space-y-8'>
          {/* Section 1: What are Cookies */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🤔</span>
              1. Cookie là gì?
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg leading-relaxed'>
                Cookies là các file text nhỏ được lưu trữ trên thiết bị của bạn khi bạn truy cập
                website. Chúng giúp website &quot;nhớ&quot; thông tin về lần truy cập của bạn để cải thiện
                trải nghiệm sử dụng.
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-blue-400 mb-3'>🔒 First-party Cookies</h3>
                  <p className='text-gray-300 text-sm'>
                    Được tạo trực tiếp bởi VIEAgent để cung cấp các tính năng cơ bản như đăng nhập,
                    lưu cài đặt và duy trì phiên làm việc.
                  </p>
                </div>

                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-purple-400 mb-3'>🌐 Third-party Cookies</h3>
                  <p className='text-gray-300 text-sm'>
                    Được tạo bởi các dịch vụ bên thứ ba như Google Analytics, Facebook Pixel để phân
                    tích và cải thiện hiệu suất website.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Types of Cookies */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>📋</span>
              2. Các loại Cookie chúng tôi sử dụng
            </h2>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                {/* Essential Cookies */}
                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-6'>
                  <div className='flex items-center mb-4'>
                    <span className='text-2xl mr-3'>🔧</span>
                    <h3 className='text-xl font-semibold text-green-400'>Essential Cookies</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-4'>
                    Cần thiết cho hoạt động cơ bản của website. Không thể tắt.
                  </p>
                  <div className='space-y-2'>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>session_token</h4>
                      <p className='text-gray-400 text-xs'>Duy trì phiên đăng nhập • 24 giờ</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>csrf_token</h4>
                      <p className='text-gray-400 text-xs'>Bảo mật form • Phiên làm việc</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>user_preferences</h4>
                      <p className='text-gray-400 text-xs'>Lưu cài đặt người dùng • 1 năm</p>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-6'>
                  <div className='flex items-center mb-4'>
                    <span className='text-2xl mr-3'>📊</span>
                    <h3 className='text-xl font-semibold text-blue-400'>Analytics Cookies</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-4'>
                    Giúp chúng tôi hiểu cách người dùng tương tác với website.
                  </p>
                  <div className='space-y-2'>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>_ga, _ga_*</h4>
                      <p className='text-gray-400 text-xs'>Google Analytics • 2 năm</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>_gid</h4>
                      <p className='text-gray-400 text-xs'>Google Analytics ID • 24 giờ</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>hotjar_*</h4>
                      <p className='text-gray-400 text-xs'>Hotjar heatmaps • 1 năm</p>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-6'>
                  <div className='flex items-center mb-4'>
                    <span className='text-2xl mr-3'>📢</span>
                    <h3 className='text-xl font-semibold text-purple-400'>Marketing Cookies</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-4'>
                    Để hiển thị quảng cáo phù hợp và đo lường hiệu quả campaign.
                  </p>
                  <div className='space-y-2'>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>_fbp, _fbc</h4>
                      <p className='text-gray-400 text-xs'>Facebook Pixel • 90 ngày</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>_gcl_au</h4>
                      <p className='text-gray-400 text-xs'>Google Ads • 90 ngày</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>utm_*</h4>
                      <p className='text-gray-400 text-xs'>Campaign tracking • 6 tháng</p>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6'>
                  <div className='flex items-center mb-4'>
                    <span className='text-2xl mr-3'>⚙️</span>
                    <h3 className='text-xl font-semibold text-yellow-400'>Functional Cookies</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-4'>
                    Cải thiện trải nghiệm với các tính năng nâng cao.
                  </p>
                  <div className='space-y-2'>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>theme_preference</h4>
                      <p className='text-gray-400 text-xs'>Dark/Light mode • 1 năm</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>language</h4>
                      <p className='text-gray-400 text-xs'>Ngôn ngữ hiển thị • 1 năm</p>
                    </div>
                    <div className='bg-gray-700/30 rounded p-3'>
                      <h4 className='font-medium text-white text-sm'>chat_widget</h4>
                      <p className='text-gray-400 text-xs'>Trạng thái chat • Phiên làm việc</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Cookie Management */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🛠️</span>
              3. Quản lý Cookie
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Bạn có thể kiểm soát và quản lý cookies theo nhiều cách khác nhau:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-6'>
                  <h3 className='font-semibold text-blue-400 mb-4 flex items-center'>
                    <span className='mr-2'>🎛️</span>
                    Cookie Preferences Center
                  </h3>
                  <p className='text-gray-300 text-sm mb-4'>
                    Sử dụng trung tâm quản lý cookie của chúng tôi để tùy chỉnh theo ý muốn.
                  </p>
                  <button className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors'>
                    Mở Cookie Settings
                  </button>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-6'>
                  <h3 className='font-semibold text-green-400 mb-4 flex items-center'>
                    <span className='mr-2'>🌐</span>
                    Browser Settings
                  </h3>
                  <p className='text-gray-300 text-sm mb-4'>
                    Hầu hết browser đều cho phép bạn quản lý cookies trong settings.
                  </p>
                  <div className='space-y-2 text-sm'>
                    <p className='text-gray-400'>• Chrome: Settings → Privacy → Cookies</p>
                    <p className='text-gray-400'>• Firefox: Preferences → Privacy</p>
                    <p className='text-gray-400'>• Safari: Preferences → Privacy</p>
                  </div>
                </div>
              </div>

              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-yellow-400 mb-2 flex items-center'>
                  <span className='mr-2'>⚠️</span>
                  Lưu ý quan trọng
                </h3>
                <p className='text-gray-300 text-sm'>
                  Việc tắt cookies có thể ảnh hưởng đến trải nghiệm sử dụng website. Một số tính
                  năng có thể không hoạt động bình thường nếu bạn tắt Essential Cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Third-party Services */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🔗</span>
              4. Dịch vụ Bên thứ ba
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Chúng tôi sử dụng các dịch vụ bên thứ ba sau, mỗi dịch vụ có chính sách cookie
                riêng:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>📊</span>
                    <h3 className='font-semibold text-red-400'>Google Analytics</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>
                    Phân tích lưu lượng và hành vi người dùng.
                  </p>
                  <a
                    href='https://policies.google.com/privacy'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-red-400 hover:text-red-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>

                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>📘</span>
                    <h3 className='font-semibold text-blue-400'>Facebook Pixel</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>
                    Tracking conversions và tối ưu quảng cáo.
                  </p>
                  <a
                    href='https://www.facebook.com/privacy/policy/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-400 hover:text-blue-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>

                <div className='bg-orange-500/10 border border-orange-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>🔥</span>
                    <h3 className='font-semibold text-orange-400'>Hotjar</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>Heatmaps và session recordings.</p>
                  <a
                    href='https://www.hotjar.com/legal/policies/privacy/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-orange-400 hover:text-orange-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>💬</span>
                    <h3 className='font-semibold text-green-400'>Intercom</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>Customer support chat widget.</p>
                  <a
                    href='https://www.intercom.com/legal/privacy'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-green-400 hover:text-green-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>

                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>💳</span>
                    <h3 className='font-semibold text-purple-400'>Stripe</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>
                    Payment processing và fraud detection.
                  </p>
                  <a
                    href='https://stripe.com/privacy'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-purple-400 hover:text-purple-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>

                <div className='bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4'>
                  <div className='flex items-center mb-3'>
                    <span className='text-xl mr-2'>📧</span>
                    <h3 className='font-semibold text-indigo-400'>Mailchimp</h3>
                  </div>
                  <p className='text-gray-300 text-sm mb-3'>Email marketing và newsletters.</p>
                  <a
                    href='https://mailchimp.com/legal/privacy/'
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-indigo-400 hover:text-indigo-300 text-sm'
                  >
                    Xem chính sách →
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Opt-out Options */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🚫</span>
              5. Tùy chọn Opt-out
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>
                Bạn có thể opt-out khỏi một số dịch vụ tracking:
              </p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='space-y-4'>
                  <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-blue-400 mb-2'>Google Analytics</h3>
                    <p className='text-gray-300 text-sm mb-3'>
                      Cài đặt Google Analytics Opt-out Browser Add-on.
                    </p>
                    <a
                      href='https://tools.google.com/dlpage/gaoptout'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors'
                    >
                      Tải về Add-on
                    </a>
                  </div>

                  <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-red-400 mb-2'>Facebook Pixel</h3>
                    <p className='text-gray-300 text-sm mb-3'>
                      Điều chỉnh Ad Preferences trong tài khoản Facebook.
                    </p>
                    <a
                      href='https://www.facebook.com/settings?tab=ads'
                      target='_blank'
                      rel='noopener noreferrer'
                      className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors'
                    >
                      Facebook Ad Settings
                    </a>
                  </div>
                </div>

                <div className='space-y-4'>
                  <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-purple-400 mb-2'>Do Not Track</h3>
                    <p className='text-gray-300 text-sm mb-3'>
                      Bật &quot;Do Not Track&quot; trong browser settings.
                    </p>
                    <div className='text-sm text-gray-400'>
                      <p>• Chrome: Settings → Advanced → Privacy</p>
                      <p>• Firefox: Preferences → Privacy</p>
                    </div>
                  </div>

                  <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                    <h3 className='font-semibold text-green-400 mb-2'>Ad Blockers</h3>
                    <p className='text-gray-300 text-sm mb-3'>
                      Sử dụng ad blockers như uBlock Origin, AdBlock Plus.
                    </p>
                    <p className='text-gray-400 text-sm'>
                      Lưu ý: Có thể ảnh hưởng đến một số tính năng website.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className='bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-2xl p-8'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>📞</span>
              6. Liên hệ về Cookie
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-semibold text-white mb-4'>Cookie Questions</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>📧 Email: cookies@aiagentplatform.com</p>
                  <p>📱 Hotline: +84 (0) 123 456 789</p>
                  <p>💬 Live Chat: Có sẵn trong ứng dụng</p>
                  <p>🕒 Phản hồi trong: 24-48 giờ</p>
                </div>
              </div>
              <div>
                <h3 className='font-semibold text-white mb-4'>Technical Support</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>🔧 Technical issues: tech@aiagentplatform.com</p>
                  <p>🛡️ Privacy concerns: privacy@aiagentplatform.com</p>
                  <p>📋 Data requests: data@aiagentplatform.com</p>
                  <p>🆘 Emergency: support@aiagentplatform.com</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className='mt-16 pt-8 border-t border-gray-700/50'>
          <div className='text-center'>
            <p className='text-gray-400 mb-4'>
              Chính sách này là một phần của hệ thống tài liệu pháp lý của chúng tôi.
            </p>
            <div className='flex justify-center space-x-6 text-sm'>
              <Link href='/' className='text-gray-400 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <a href='/privacy' className='text-gray-400 hover:text-white transition-colors'>
                Quyền riêng tư
              </a>
              <a href='/terms' className='text-gray-400 hover:text-white transition-colors'>
                Điều khoản
              </a>
              <a href='/contact' className='text-gray-400 hover:text-white transition-colors'>
                Liên hệ
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
