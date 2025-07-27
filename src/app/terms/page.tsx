import { Metadata } from 'next';
import Link from 'next/link';
import { VIEAgentLogo } from '@/components/ui/vieagent-logo';

export const metadata: Metadata = {
  title: 'Điều khoản Dịch vụ - VIEAgent',
  description:
    'Điều khoản và điều kiện sử dụng dịch vụ VIEAgent. Tìm hiểu về quyền và nghĩa vụ khi sử dụng nền tảng của chúng tôi.',
  keywords: 'điều khoản dịch vụ, terms of service, VIEAgent, quyền và nghĩa vụ',
  openGraph: {
    title: 'Điều khoản Dịch vụ - VIEAgent',
    description: 'Điều khoản và điều kiện sử dụng dịch vụ VIEAgent',
    type: 'website',
  },
};

export default function TermsPage() {
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
                <p className='text-gray-400 text-sm'>Điều khoản Dịch vụ</p>
              </div>
            </div>
            <nav className='hidden md:flex space-x-6'>
              <Link href='/' className='text-gray-300 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <a href='/privacy' className='text-gray-300 hover:text-white transition-colors'>
                Quyền riêng tư
              </a>
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
          <div className='w-20 h-20 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6'>
            <span className='text-3xl'>📋</span>
          </div>
          <h1 className='text-4xl md:text-5xl font-bold text-white mb-4'>Điều khoản Dịch vụ</h1>
          <p className='text-xl text-gray-300 max-w-3xl mx-auto'>
            Điều khoản và điều kiện sử dụng dịch vụ VIEAgent. Vui lòng đọc kỹ trước khi sử dụng dịch
            vụ của chúng tôi.
          </p>
          <div className='mt-6 text-sm text-gray-400'>
            <p>
              Cập nhật lần cuối: <span className='text-orange-400'>27 tháng 6, 2024</span>
            </p>
            <p>
              Có hiệu lực từ: <span className='text-orange-400'>1 tháng 7, 2024</span>
            </p>
          </div>
        </div>

        {/* Content Sections */}
        <div className='space-y-8'>
          {/* Section 1: Acceptance */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>✅</span>
              1. Chấp nhận Điều khoản
            </h2>
            <div className='prose prose-invert max-w-none'>
              <p className='text-gray-300 text-lg leading-relaxed mb-4'>
                Bằng việc truy cập và sử dụng VIEAgent ("Dịch vụ"), bạn đồng ý tuân thủ và bị ràng
                buộc bởi các điều khoản và điều kiện này ("Điều khoản").
              </p>
              <div className='bg-orange-500/10 border border-orange-500/30 rounded-lg p-4'>
                <p className='text-orange-300 font-medium'>
                  ⚠️ Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không
                  sử dụng dịch vụ của chúng tôi.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Service Description */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🤖</span>
              2. Mô tả Dịch vụ
            </h2>
            <div className='space-y-6'>
              <p className='text-gray-300 text-lg'>VIEAgent cung cấp các dịch vụ sau:</p>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-blue-400 mb-2'>🧠 AI Agent Creation</h3>
                  <p className='text-gray-300 text-sm'>
                    Tạo và quản lý AI chatbot thông minh với khả năng học hỏi và phản hồi tự động.
                  </p>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-green-400 mb-2'>🔗 Platform Integration</h3>
                  <p className='text-gray-300 text-sm'>
                    Kết nối với Facebook, Google, Zalo và các nền tảng khác để tự động hóa giao
                    tiếp.
                  </p>
                </div>

                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-purple-400 mb-2'>📊 Analytics & Insights</h3>
                  <p className='text-gray-300 text-sm'>
                    Phân tích cuộc hội thoại và cung cấp insights để cải thiện hiệu suất.
                  </p>
                </div>

                <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-yellow-400 mb-2'>☁️ Cloud Infrastructure</h3>
                  <p className='text-gray-300 text-sm'>
                    Hosting và quản lý AI agent trên cloud với độ tin cậy và bảo mật cao.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: User Responsibilities */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>👤</span>
              3. Trách nhiệm Người dùng
            </h2>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h3 className='text-xl font-semibold text-green-400 mb-3'>✅ Bạn được phép:</h3>
                  <ul className='text-gray-300 space-y-2'>
                    <li>• Sử dụng dịch vụ cho mục đích kinh doanh hợp pháp</li>
                    <li>• Tạo và quản lý AI agent của riêng bạn</li>
                    <li>• Tích hợp với các nền tảng bên thứ ba</li>
                    <li>• Chia sẻ nội dung phù hợp với cộng đồng</li>
                    <li>• Xuất dữ liệu của bạn theo quy định</li>
                  </ul>
                </div>

                <div>
                  <h3 className='text-xl font-semibold text-red-400 mb-3'>
                    ❌ Bạn không được phép:
                  </h3>
                  <ul className='text-gray-300 space-y-2'>
                    <li>• Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                    <li>• Tạo nội dung spam, lừa đảo hoặc có hại</li>
                    <li>• Hack, phá hoại hệ thống hoặc dữ liệu</li>
                    <li>• Chia sẻ tài khoản với người khác</li>
                    <li>• Reverse engineer hoặc copy code</li>
                  </ul>
                </div>
              </div>

              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-yellow-400 mb-2'>⚠️ Lưu ý quan trọng:</h3>
                <p className='text-gray-300 text-sm'>
                  Bạn hoàn toàn chịu trách nhiệm về nội dung và hoạt động của AI agent mà bạn tạo
                  ra. Chúng tôi khuyến nghị thường xuyên kiểm tra và điều chỉnh để đảm bảo tuân thủ
                  quy định.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Pricing & Payment */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>💳</span>
              4. Giá cả & Thanh toán
            </h2>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-blue-400 mb-2'>💰 Pricing</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Miễn phí trial 14 ngày</li>
                    <li>• Các gói trả phí từ $29/tháng</li>
                    <li>• Enterprise pricing theo yêu cầu</li>
                    <li>• Không có phí setup</li>
                  </ul>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-green-400 mb-2'>💳 Payment</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Thanh toán hàng tháng/năm</li>
                    <li>• Hỗ trợ thẻ tín dụng</li>
                    <li>• Chuyển khoản ngân hàng</li>
                    <li>• Hóa đơn VAT đầy đủ</li>
                  </ul>
                </div>

                <div className='bg-purple-500/10 border border-purple-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-purple-400 mb-2'>🔄 Refund</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Hoàn tiền trong 30 ngày</li>
                    <li>• Áp dụng cho gói mới</li>
                    <li>• Không áp dụng cho Enterprise</li>
                    <li>• Xử lý trong 5-7 ngày làm việc</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 5: Intellectual Property */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>©️</span>
              5. Sở hữu Trí tuệ
            </h2>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-blue-400 mb-3'>🏢 Của chúng tôi</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Platform và source code</li>
                    <li>• AI models và algorithms</li>
                    <li>• Logo, branding, design</li>
                    <li>• Documentation và tutorials</li>
                    <li>• Patents và trade secrets</li>
                  </ul>
                </div>

                <div className='bg-green-500/10 border border-green-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-green-400 mb-3'>👤 Của bạn</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Nội dung bạn tạo ra</li>
                    <li>• Dữ liệu bạn upload</li>
                    <li>• Agent configurations</li>
                    <li>• Business logic và workflows</li>
                    <li>• Customer data và insights</li>
                  </ul>
                </div>
              </div>

              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-yellow-400 mb-2'>🤝 Shared Rights</h3>
                <p className='text-gray-300 text-sm'>
                  Bạn cấp cho chúng tôi quyền sử dụng nội dung của bạn để cung cấp dịch vụ, cải
                  thiện platform và hỗ trợ kỹ thuật. Chúng tôi không sở hữu nội dung của bạn.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Limitation of Liability */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>⚖️</span>
              6. Giới hạn Trách nhiệm
            </h2>
            <div className='space-y-6'>
              <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-red-400 mb-3'>🚫 Disclaimer</h3>
                <p className='text-gray-300 text-sm leading-relaxed'>
                  Dịch vụ được cung cấp "as is" và "as available". Chúng tôi không đảm bảo dịch vụ
                  sẽ luôn khả dụng, không có lỗi, hoặc đáp ứng hoàn toàn nhu cầu của bạn. AI có thể
                  tạo ra nội dung không chính xác hoặc không phù hợp.
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='bg-gray-700/30 rounded-lg p-4'>
                  <h4 className='font-medium text-white mb-2'>
                    🛡️ Chúng tôi không chịu trách nhiệm cho:
                  </h4>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Thiệt hại gián tiếp hoặc hậu quả</li>
                    <li>• Mất dữ liệu hoặc lợi nhuận</li>
                    <li>• Gián đoạn kinh doanh</li>
                    <li>• Nội dung do AI tạo ra</li>
                    <li>• Hành vi của third-party services</li>
                  </ul>
                </div>

                <div className='bg-gray-700/30 rounded-lg p-4'>
                  <h4 className='font-medium text-white mb-2'>💰 Giới hạn bồi thường:</h4>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Tối đa = phí đã trả trong 12 tháng</li>
                    <li>• Không quá $10,000 USD</li>
                    <li>• Áp dụng cho tất cả claims</li>
                    <li>• Bảo hiểm trách nhiệm nghề nghiệp</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Termination */}
          <section className='bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>🚪</span>
              7. Chấm dứt Dịch vụ
            </h2>
            <div className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div className='bg-blue-500/10 border border-blue-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-blue-400 mb-3'>👤 Bởi bạn</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Hủy bất cứ lúc nào</li>
                    <li>• Có hiệu lực cuối chu kỳ billing</li>
                    <li>• Xuất dữ liệu trước khi hủy</li>
                    <li>• Không hoàn phí partial months</li>
                  </ul>
                </div>

                <div className='bg-red-500/10 border border-red-500/30 rounded-lg p-4'>
                  <h3 className='font-semibold text-red-400 mb-3'>🏢 Bởi chúng tôi</h3>
                  <ul className='text-gray-300 text-sm space-y-1'>
                    <li>• Vi phạm điều khoản</li>
                    <li>• Không thanh toán</li>
                    <li>• Hoạt động bất hợp pháp</li>
                    <li>• Thông báo trước 30 ngày</li>
                  </ul>
                </div>
              </div>

              <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4'>
                <h3 className='font-semibold text-yellow-400 mb-2'>📦 Sau khi chấm dứt:</h3>
                <p className='text-gray-300 text-sm'>
                  Dữ liệu của bạn sẽ được lưu trữ thêm 90 ngày để bạn có thể xuất. Sau đó, tất cả dữ
                  liệu sẽ được xóa vĩnh viễn khỏi hệ thống của chúng tôi.
                </p>
              </div>
            </div>
          </section>

          {/* Contact Section */}
          <section className='bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-8'>
            <h2 className='text-2xl font-bold text-white mb-6 flex items-center'>
              <span className='mr-3'>📞</span>
              8. Thông tin Liên hệ
            </h2>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div>
                <h3 className='font-semibold text-white mb-4'>Legal Department</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>📧 Email: legal@aiagentplatform.com</p>
                  <p>📱 Hotline: +84 (0) 123 456 789</p>
                  <p>📍 Địa chỉ: 123 Nguyễn Huệ, Quận 1, TP.HCM</p>
                  <p>🏢 Công ty: VIEAgent JSC</p>
                </div>
              </div>
              <div>
                <h3 className='font-semibold text-white mb-4'>Business Registration</h3>
                <div className='space-y-2 text-gray-300'>
                  <p>🏛️ MST: 0123456789</p>
                  <p>📋 ĐKKD: 0123456789-001</p>
                  <p>🏦 Ngân hàng: Vietcombank</p>
                  <p>💳 STK: 1234567890</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer className='mt-16 pt-8 border-t border-gray-700/50'>
          <div className='text-center'>
            <p className='text-gray-400 mb-4'>
              Điều khoản này được bổ sung bởi
              <a href='/privacy' className='text-orange-400 hover:text-orange-300 mx-1'>
                Chính sách Quyền riêng tư
              </a>
              của chúng tôi.
            </p>
            <div className='flex justify-center space-x-6 text-sm'>
              <Link href='/' className='text-gray-400 hover:text-white transition-colors'>
                Trang chủ
              </Link>
              <a href='/privacy' className='text-gray-400 hover:text-white transition-colors'>
                Quyền riêng tư
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
