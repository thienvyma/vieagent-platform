'use client';

import DashboardLayout from '@/components/ui/DashboardLayout';
import UpgradeButton from '@/components/dashboard/UpgradeButton';

export default function UpgradePage() {
  return (
    <DashboardLayout
      title='💎 Nâng cấp gói dịch vụ'
      description='Khám phá các gói dịch vụ cao cấp để mở rộng khả năng AI Agent của bạn'
    >
      <div className='space-y-8'>
        {/* Hero Section */}
        <div className='bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-3xl p-8 border border-purple-500/20'>
          <div className='text-center max-w-3xl mx-auto'>
            <div className='w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-6'>
              <span className='text-3xl'>💎</span>
            </div>
            <h1 className='text-4xl font-bold text-white mb-4'>Nâng cấp trải nghiệm AI Agent</h1>
            <p className='text-xl text-gray-300 mb-8'>
              Mở khóa những tính năng mạnh mẽ để phát triển doanh nghiệp của bạn lên tầm cao mới
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className='grid md:grid-cols-3 gap-6'>
          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl text-blue-400'>AI</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Thêm AI Agents</h3>
            <p className='text-gray-400 text-sm'>
              Tạo nhiều AI agents hơn để xử lý đồng thời nhiều cuộc hội thoại và khách hàng
            </p>
          </div>

          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl'>💬</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Unlimited Conversations</h3>
            <p className='text-gray-400 text-sm'>
              Không giới hạn số lượng cuộc hội thoại và tin nhắn cho nhu cầu doanh nghiệp
            </p>
          </div>

          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl'>🔌</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Google Integration</h3>
            <p className='text-gray-400 text-sm'>
              Tích hợp Calendar, Gmail, Sheets để tự động hóa quy trình làm việc
            </p>
          </div>

          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl'>📊</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Advanced Analytics</h3>
            <p className='text-gray-400 text-sm'>
              Báo cáo chi tiết về hiệu suất, trends và insights để tối ưu hóa
            </p>
          </div>

          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl'>🎨</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Custom Branding</h3>
            <p className='text-gray-400 text-sm'>
              White-label solution với logo và thương hiệu riêng của bạn
            </p>
          </div>

          <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
            <div className='w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center mb-4'>
              <span className='text-2xl'>🚀</span>
            </div>
            <h3 className='text-lg font-semibold text-white mb-2'>Priority Support</h3>
            <p className='text-gray-400 text-sm'>
              Hỗ trợ ưu tiên 24/7 với dedicated account manager
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-white/5 rounded-3xl p-8 border border-gray-700 text-center'>
          <h2 className='text-2xl font-bold text-white mb-4'>Sẵn sàng nâng cấp trải nghiệm?</h2>
          <p className='text-gray-400 mb-8 max-w-2xl mx-auto'>
            Gửi yêu cầu nâng cấp và admin sẽ liên hệ với bạn trong vòng 24 giờ để tư vấn gói phù hợp
            nhất
          </p>

          <UpgradeButton variant='page' />
        </div>

        {/* FAQ Section */}
        <div className='space-y-6'>
          <h2 className='text-2xl font-bold text-white text-center mb-8'>Câu hỏi thường gặp</h2>

          <div className='grid md:grid-cols-2 gap-6'>
            <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
              <h3 className='text-lg font-semibold text-white mb-3'>
                Làm thế nào để nâng cấp gói?
              </h3>
              <p className='text-gray-400 text-sm'>
                {/* ✅ fixed from LINTING_MANUAL_FIXES_NEEDED.md */}
                Chỉ cần click nút &quot;Yêu cầu nâng cấp&quot; và điền thông tin. Admin sẽ xem xét và liên hệ
                trực tiếp với bạn.
              </p>
            </div>

            <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
              <h3 className='text-lg font-semibold text-white mb-3'>Khi nào tôi được nâng cấp?</h3>
              <p className='text-gray-400 text-sm'>
                Sau khi yêu cầu được phê duyệt và thanh toán thành công, gói mới sẽ được kích hoạt
                ngay lập tức.
              </p>
            </div>

            <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
              <h3 className='text-lg font-semibold text-white mb-3'>Có thể hủy gói đã nâng cấp?</h3>
              <p className='text-gray-400 text-sm'>
                Có, bạn có thể hủy bất kỳ lúc nào. Gói sẽ vẫn hoạt động đến hết chu kỳ thanh toán
                hiện tại.
              </p>
            </div>

            <div className='bg-white/5 rounded-2xl p-6 border border-gray-700'>
              <h3 className='text-lg font-semibold text-white mb-3'>
                Có hỗ trợ migration data không?
              </h3>
              <p className='text-gray-400 text-sm'>
                Có, team support sẽ hỗ trợ di chuyển toàn bộ dữ liệu và cấu hình sang gói mới một
                cách an toàn.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
