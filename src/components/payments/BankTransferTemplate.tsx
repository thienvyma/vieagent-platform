'use client';

import { useState, useRef } from 'react';
import { QrCode, Download, Copy, Printer, Settings, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountName: string;
  branch?: string;
}

interface BankTransferTemplateProps {
  planName?: string;
  amount?: number;
  currency?: string;
  orderId?: string;
}

export default function BankTransferTemplate({
  planName = 'Premium Plan',
  amount = 999000,
  currency = 'VND',
  orderId = 'ORD' + Date.now(),
}: BankTransferTemplateProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [customBankInfo, setCustomBankInfo] = useState<BankInfo>({
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'CONG TY AI PLATFORM',
    branch: 'Chi nhánh TP.HCM',
  });
  const [isEditing, setIsEditing] = useState(false);
  const templateRef = useRef<HTMLDivElement>(null);

  // Generate QR Code URL (using QR API service)
  const generateQRCode = () => {
    const qrData = `${customBankInfo.bankName}|${customBankInfo.accountNumber}|${customBankInfo.accountName}|${amount}|${orderId}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      toast.success(`Đã copy ${type}!`);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      toast.error('Lỗi copy!');
    }
  };

  const downloadTemplate = () => {
    if (templateRef.current) {
      // Simple download as text file
      const content = `
=== THÔNG TIN CHUYỂN KHOẢN ===
Ngân hàng: ${customBankInfo.bankName}
Số tài khoản: ${customBankInfo.accountNumber}
Tên tài khoản: ${customBankInfo.accountName}
Chi nhánh: ${customBankInfo.branch}

Số tiền: ${amount?.toLocaleString()} ${currency}
Nội dung: ${orderId} - ${planName}
Mã đơn hàng: ${orderId}

Lưu ý: Vui lòng ghi chính xác nội dung chuyển khoản để được xử lý nhanh chóng.
      `;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bank-transfer-${orderId}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Đã tải template!');
    }
  };

  const printTemplate = () => {
    window.print();
    toast.success('Đang in template...');
  };

  const saveBankInfo = () => {
    // Save to localStorage for future use
    localStorage.setItem('bankTransferTemplate', JSON.stringify(customBankInfo));
    setIsEditing(false);
    toast.success('Đã lưu thông tin ngân hàng!');
  };

  const resetBankInfo = () => {
    const saved = localStorage.getItem('bankTransferTemplate');
    if (saved) {
      setCustomBankInfo(JSON.parse(saved));
    }
    setIsEditing(false);
  };

  return (
    <div className='bg-gray-900/50 backdrop-blur-sm rounded-3xl border border-gray-800/50 p-8 max-w-4xl mx-auto'>
      {/* Header */}
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h2 className='text-3xl font-bold text-white mb-2'>🏦 Form Chuyển Khoản Mẫu</h2>
          <p className='text-gray-400'>
            Thông tin chuyển khoản dự phòng khi tính năng khác không hoạt động
          </p>
        </div>

        {/* Action Buttons */}
        <div className='flex items-center space-x-3'>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className='flex items-center space-x-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 hover:bg-blue-500/30 px-4 py-2 rounded-xl transition-all'
          >
            <Settings className='w-4 h-4' />
            <span className='hidden sm:inline'>Cài đặt</span>
          </button>

          <button
            onClick={downloadTemplate}
            className='flex items-center space-x-2 bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30 px-4 py-2 rounded-xl transition-all'
          >
            <Download className='w-4 h-4' />
            <span className='hidden sm:inline'>Tải xuống</span>
          </button>

          <button
            onClick={printTemplate}
            className='flex items-center space-x-2 bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30 px-4 py-2 rounded-xl transition-all'
          >
            <Printer className='w-4 h-4' />
            <span className='hidden sm:inline'>In</span>
          </button>
        </div>
      </div>

      {/* Bank Info Settings */}
      {isEditing && (
        <div className='bg-gray-800/50 rounded-2xl p-6 mb-8 border border-gray-700/50'>
          <h3 className='text-xl font-bold text-white mb-4'>⚙️ Cài Đặt Thông Tin Ngân Hàng</h3>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Tên ngân hàng</label>
              <input
                type='text'
                value={customBankInfo.bankName}
                onChange={e => setCustomBankInfo({ ...customBankInfo, bankName: e.target.value })}
                className='w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='VD: Vietcombank, BIDV, Techcombank...'
              />
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Số tài khoản</label>
              <input
                type='text'
                value={customBankInfo.accountNumber}
                onChange={e =>
                  setCustomBankInfo({ ...customBankInfo, accountNumber: e.target.value })
                }
                className='w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='1234567890'
              />
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>Tên tài khoản</label>
              <input
                type='text'
                value={customBankInfo.accountName}
                onChange={e =>
                  setCustomBankInfo({ ...customBankInfo, accountName: e.target.value })
                }
                className='w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='CONG TY AI PLATFORM'
              />
            </div>

            <div>
              <label className='block text-gray-300 text-sm font-medium mb-2'>
                Chi nhánh (tùy chọn)
              </label>
              <input
                type='text'
                value={customBankInfo.branch || ''}
                onChange={e => setCustomBankInfo({ ...customBankInfo, branch: e.target.value })}
                className='w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                placeholder='Chi nhánh TP.HCM'
              />
            </div>
          </div>

          <div className='flex justify-end space-x-3 mt-6'>
            <button
              onClick={resetBankInfo}
              className='px-4 py-2 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors'
            >
              Hủy
            </button>
            <button
              onClick={saveBankInfo}
              className='px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors'
            >
              Lưu thông tin
            </button>
          </div>
        </div>
      )}

      {/* Main Template */}
      <div ref={templateRef} className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Bank Transfer Info */}
        <div className='bg-white/5 rounded-2xl p-6 border border-gray-700/50'>
          <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-2'>
            <span>🏦</span>
            <span>Thông Tin Chuyển Khoản</span>
          </h3>

          <div className='space-y-4'>
            {/* Bank Name */}
            <div className='flex justify-between items-center p-4 bg-gray-800/50 rounded-xl'>
              <span className='text-gray-400'>Ngân hàng:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-white font-medium'>{customBankInfo.bankName}</span>
                <button
                  onClick={() => copyToClipboard(customBankInfo.bankName, 'tên ngân hàng')}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  {copied === 'tên ngân hàng' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Account Number */}
            <div className='flex justify-between items-center p-4 bg-gray-800/50 rounded-xl'>
              <span className='text-gray-400'>Số tài khoản:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-white font-medium font-mono text-lg'>
                  {customBankInfo.accountNumber}
                </span>
                <button
                  onClick={() => copyToClipboard(customBankInfo.accountNumber, 'số tài khoản')}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  {copied === 'số tài khoản' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Account Name */}
            <div className='flex justify-between items-center p-4 bg-gray-800/50 rounded-xl'>
              <span className='text-gray-400'>Tên tài khoản:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-white font-medium'>{customBankInfo.accountName}</span>
                <button
                  onClick={() => copyToClipboard(customBankInfo.accountName, 'tên tài khoản')}
                  className='text-gray-400 hover:text-white transition-colors'
                >
                  {copied === 'tên tài khoản' ? (
                    <Check className='w-4 h-4 text-green-400' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Branch */}
            {customBankInfo.branch && (
              <div className='flex justify-between items-center p-4 bg-gray-800/50 rounded-xl'>
                <span className='text-gray-400'>Chi nhánh:</span>
                <span className='text-white font-medium'>{customBankInfo.branch}</span>
              </div>
            )}

            {/* Amount */}
            <div className='flex justify-between items-center p-4 bg-green-500/20 border border-green-500/30 rounded-xl'>
              <span className='text-green-300'>Số tiền:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-green-300 font-bold text-xl'>
                  {amount?.toLocaleString()} {currency}
                </span>
                <button
                  onClick={() => copyToClipboard(amount?.toString() || '', 'số tiền')}
                  className='text-green-400 hover:text-white transition-colors'
                >
                  {copied === 'số tiền' ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            {/* Transfer Content */}
            <div className='flex justify-between items-center p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl'>
              <span className='text-blue-300'>Nội dung:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-blue-300 font-medium'>
                  {orderId} - {planName}
                </span>
                <button
                  onClick={() => copyToClipboard(`${orderId} - ${planName}`, 'nội dung CK')}
                  className='text-blue-400 hover:text-white transition-colors'
                >
                  {copied === 'nội dung CK' ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className='mt-6 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl'>
            <h4 className='text-yellow-300 font-bold mb-2'>📝 Hướng dẫn:</h4>
            <ul className='text-yellow-200 text-sm space-y-1'>
              <li>• Chuyển khoản chính xác số tiền như trên</li>
              <li>• Ghi đúng nội dung chuyển khoản để xử lý nhanh</li>
              <li>• Gửi ảnh chụp bill về email hoặc liên hệ admin</li>
              <li>• Thời gian xử lý: 24h trong ngày làm việc</li>
            </ul>
          </div>
        </div>

        {/* QR Code Section */}
        <div className='bg-white/5 rounded-2xl p-6 border border-gray-700/50'>
          <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-2'>
            <QrCode className='w-6 h-6' />
            <span>QR Code Chuyển Khoản</span>
          </h3>

          <div className='text-center'>
            {/* QR Code */}
            <div className='bg-white p-4 rounded-xl inline-block mb-6'>
              <img
                src={generateQRCode()}
                alt='QR Code Chuyển Khoản'
                className='w-48 h-48 mx-auto'
              />
            </div>

            <p className='text-gray-400 text-sm mb-4'>
              Quét QR code để tự động điền thông tin chuyển khoản
            </p>

            {/* Order Info */}
            <div className='bg-gray-800/50 rounded-xl p-4 text-left'>
              <div className='flex justify-between mb-2'>
                <span className='text-gray-400'>Mã đơn hàng:</span>
                <span className='text-white font-mono'>{orderId}</span>
              </div>
              <div className='flex justify-between mb-2'>
                <span className='text-gray-400'>Gói dịch vụ:</span>
                <span className='text-white'>{planName}</span>
              </div>
              <div className='flex justify-between'>
                <span className='text-gray-400'>Tạo lúc:</span>
                <span className='text-white'>{new Date().toLocaleString('vi-VN')}</span>
              </div>
            </div>

            {/* Contact Info */}
            <div className='mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl'>
              <h4 className='text-red-300 font-bold mb-2'>📞 Liên hệ hỗ trợ:</h4>
              <div className='text-red-200 text-sm space-y-1'>
                <p>📧 Email: support@aiplatform.com</p>
                <p>📱 Hotline: 1900-xxxx</p>
                <p>💬 Telegram: @aisupport</p>
                <p>🕐 Giờ làm việc: 8:00 - 22:00 (T2-CN)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copy All Button */}
      <div className='text-center mt-8'>
        <button
          onClick={() => {
            const allInfo = `
Thông tin chuyển khoản:
Ngân hàng: ${customBankInfo.bankName}
Số tài khoản: ${customBankInfo.accountNumber}
Tên tài khoản: ${customBankInfo.accountName}
${customBankInfo.branch ? `Chi nhánh: ${customBankInfo.branch}` : ''}
Số tiền: ${amount?.toLocaleString()} ${currency}
Nội dung: ${orderId} - ${planName}
            `;
            copyToClipboard(allInfo, 'toàn bộ thông tin');
          }}
          className='bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-purple-600 hover:to-pink-700 transition-all duration-300 shadow-lg'
        >
          📋 Copy Toàn Bộ Thông Tin
        </button>
      </div>
    </div>
  );
}
