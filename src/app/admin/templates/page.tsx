'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, QrCode, Download, Settings as SettingsIcon, Lock } from 'lucide-react';
import { hasPermission, type UserRole } from '@/lib/permissions';
import BankTransferTemplate from '@/components/payments/BankTransferTemplate';

export default function TemplatesPage() {
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as UserRole;
  const [selectedTemplate, setSelectedTemplate] = useState<'bank-transfer' | 'invoice' | 'receipt'>(
    'bank-transfer'
  );

  // Permissions
  const canManageTemplates = hasPermission(currentUserRole, 'manage_system_settings');

  if (!canManageTemplates) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center'>
        <div className='text-center'>
          <Lock className='w-16 h-16 text-red-400 mx-auto mb-4' />
          <h1 className='text-2xl font-bold text-white mb-2'>🚫 Không có quyền truy cập</h1>
          <p className='text-gray-400'>Bạn không có quyền truy cập template hệ thống.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900'>
      <div className='container mx-auto px-4 py-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-white mb-4 flex items-center justify-center space-x-3'>
            <FileText className='w-10 h-10' />
            <span>📋 Template Manager</span>
          </h1>
          <p className='text-xl text-gray-300'>Quản lý template form và document dự phòng</p>
        </div>

        {/* Template Selection */}
        <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-2 mb-8 border border-white/10 max-w-4xl mx-auto'>
          <div className='flex space-x-2 overflow-x-auto'>
            {[
              {
                key: 'bank-transfer',
                label: '🏦 Chuyển khoản',
                icon: QrCode,
                description: 'Form chuyển khoản với QR code',
              },
              {
                key: 'invoice',
                label: '📄 Hóa đơn',
                icon: FileText,
                description: 'Template hóa đơn thanh toán',
                disabled: true,
              },
              {
                key: 'receipt',
                label: '🧾 Biên lai',
                icon: Download,
                description: 'Template biên lai giao dịch',
                disabled: true,
              },
            ].map(template => (
              <button
                key={template.key}
                onClick={() => !template.disabled && setSelectedTemplate(template.key as any)}
                disabled={template.disabled}
                className={`flex flex-col items-center space-y-2 px-6 py-4 rounded-2xl transition-all whitespace-nowrap min-w-[160px] ${
                  selectedTemplate === template.key
                    ? 'bg-purple-600 text-white shadow-lg'
                    : template.disabled
                      ? 'text-gray-500 cursor-not-allowed opacity-50'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
                title={template.description}
              >
                <template.icon className='w-6 h-6' />
                <span className='text-sm font-medium'>{template.label}</span>
                {template.disabled && <span className='text-xs text-gray-500'>Coming Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Template Content */}
        <div className='max-w-6xl mx-auto'>
          {selectedTemplate === 'bank-transfer' && (
            <div className='space-y-8'>
              {/* Template Info */}
              <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10'>
                <div className='flex items-center justify-between'>
                  <div>
                    <h2 className='text-2xl font-bold text-white mb-2 flex items-center space-x-2'>
                      <QrCode className='w-6 h-6' />
                      <span>🏦 Bank Transfer Template</span>
                    </h2>
                    <p className='text-gray-400'>
                      Template form chuyển khoản với QR code tự động. Sử dụng khi tính năng payment
                      gateway gặp sự cố.
                    </p>
                  </div>

                  <div className='flex items-center space-x-2 text-green-400'>
                    <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                    <span className='text-sm font-medium'>Active Template</span>
                  </div>
                </div>

                {/* Features */}
                <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
                  <div className='bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-center'>
                    <QrCode className='w-8 h-8 text-blue-400 mx-auto mb-2' />
                    <h3 className='font-semibold text-blue-300 mb-1'>QR Code Auto</h3>
                    <p className='text-blue-200 text-sm'>Tự động tạo QR code chuyển khoản</p>
                  </div>

                  <div className='bg-green-500/20 border border-green-500/30 rounded-xl p-4 text-center'>
                    <SettingsIcon className='w-8 h-8 text-green-400 mx-auto mb-2' />
                    <h3 className='font-semibold text-green-300 mb-1'>Customizable</h3>
                    <p className='text-green-200 text-sm'>Tùy chỉnh thông tin ngân hàng</p>
                  </div>

                  <div className='bg-purple-500/20 border border-purple-500/30 rounded-xl p-4 text-center'>
                    <Download className='w-8 h-8 text-purple-400 mx-auto mb-2' />
                    <h3 className='font-semibold text-purple-300 mb-1'>Export Ready</h3>
                    <p className='text-purple-200 text-sm'>In, tải xuống, copy dễ dàng</p>
                  </div>
                </div>
              </div>

              {/* Bank Transfer Template Component */}
              <BankTransferTemplate
                planName='Premium Plan'
                amount={999000}
                currency='VND'
                orderId={`ORD${Date.now()}`}
              />

              {/* Usage Instructions */}
              <div className='bg-yellow-500/20 border border-yellow-500/30 rounded-3xl p-6'>
                <h3 className='text-xl font-bold text-yellow-300 mb-4 flex items-center space-x-2'>
                  <span>💡</span>
                  <span>Hướng dẫn sử dụng Template</span>
                </h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-6 text-yellow-200'>
                  <div>
                    <h4 className='font-semibold mb-2'>📝 Khi nào sử dụng:</h4>
                    <ul className='space-y-1 text-sm'>
                      <li>• Stripe/PayPal gặp sự cố</li>
                      <li>• Khách hàng không có thẻ tín dụng</li>
                      <li>• Muốn nhận chuyển khoản trực tiếp</li>
                      <li>• Backup payment method</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className='font-semibold mb-2'>🔧 Cách cấu hình:</h4>
                    <ul className='space-y-1 text-sm'>
                      <li>• Nhấn nút &quot;Cài đặt&quot; để chỉnh sửa</li>
                      <li>• Nhập thông tin ngân hàng chính xác</li>
                      <li>• Template sẽ lưu trong localStorage</li>
                      <li>• QR code tự động cập nhật</li>
                    </ul>
                  </div>
                </div>

                <div className='mt-4 p-4 bg-yellow-600/20 rounded-xl'>
                  <p className='text-yellow-100 text-sm'>
                    <strong>🔒 Bảo mật:</strong> Thông tin ngân hàng chỉ lưu trên trình duyệt của
                    bạn. Không gửi lên server để đảm bảo an toàn.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Coming Soon Templates */}
          {(selectedTemplate === 'invoice' || selectedTemplate === 'receipt') && (
            <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-12 border border-white/10 text-center'>
              <div className='w-20 h-20 bg-gray-600/50 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                <FileText className='w-10 h-10 text-gray-400' />
              </div>
              <h2 className='text-2xl font-bold text-white mb-4'>🚧 Template đang phát triển</h2>
              <p className='text-gray-400 mb-6'>
                Template này sẽ được ra mắt trong phiên bản tiếp theo.
              </p>
              <div className='text-sm text-gray-500'>Dự kiến: Q2 2025</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
