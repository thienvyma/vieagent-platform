'use client';

import { useState } from 'react';
import { Upload, Copy, Check, AlertCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';

interface BankTransferFormProps {
  planId: string;
  planName: string;
  amount: number;
  currency: string;
  onSuccess: (transferId: string) => void;
  onError: (error: string) => void;
}

export default function BankTransferForm({
  planId,
  planName,
  amount,
  currency,
  onSuccess,
  onError,
}: BankTransferFormProps) {
  const [loading, setLoading] = useState(false);
  const [transferInfo, setTransferInfo] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    bankName: '',
    transferAmount: amount,
    transferDate: '',
    transferNote: '',
    proofImage: null as File | null,
  });
  const [copied, setCopied] = useState<string | null>(null);

  const bankInfo = {
    bankName: 'Vietcombank',
    accountNumber: '1234567890',
    accountName: 'CONG TY AI PLATFORM',
    branch: 'Chi nhánh TP.HCM',
  };

  const transferContent = `${planId} - ${planName}`;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transferInfo.customerName || !transferInfo.customerEmail || !transferInfo.transferDate) {
      toast.error('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('planId', planId);
      formData.append('customerName', transferInfo.customerName);
      formData.append('customerEmail', transferInfo.customerEmail);
      formData.append('customerPhone', transferInfo.customerPhone);
      formData.append('bankName', transferInfo.bankName);
      formData.append('transferAmount', transferInfo.transferAmount.toString());
      formData.append('transferDate', transferInfo.transferDate);
      formData.append('transferNote', transferInfo.transferNote);

      if (transferInfo.proofImage) {
        formData.append('proofImage', transferInfo.proofImage);
      }

      const response = await fetch('/api/payments/bank-transfer', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Thông tin chuyển khoản đã được gửi thành công!');
        onSuccess(result.data.id);
      } else {
        onError(result.error || 'Không thể gửi thông tin chuyển khoản');
      }
    } catch (error) {
      onError('Lỗi kết nối mạng');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error('File không được vượt quá 5MB');
        return;
      }
      setTransferInfo(prev => ({ ...prev, proofImage: file }));
    }
  };

  return (
    <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
      <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-3'>
        <CreditCard className='w-8 h-8' />
        <span>🏦 Chuyển khoản ngân hàng</span>
      </h3>

      {/* Bank Information */}
      <div className='bg-blue-500/20 border border-blue-500/30 rounded-2xl p-6 mb-8'>
        <h4 className='text-blue-300 font-bold text-lg mb-4'>📋 Thông tin chuyển khoản</h4>

        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-blue-200'>Ngân hàng:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-white font-medium'>{bankInfo.bankName}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.bankName, 'tên ngân hàng')}
                  className='text-blue-400 hover:text-white transition-colors'
                >
                  {copied === 'tên ngân hàng' ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-blue-200'>Số tài khoản:</span>
              <div className='flex items-center space-x-2'>
                <span className='text-white font-medium font-mono'>{bankInfo.accountNumber}</span>
                <button
                  onClick={() => copyToClipboard(bankInfo.accountNumber, 'số tài khoản')}
                  className='text-blue-400 hover:text-white transition-colors'
                >
                  {copied === 'số tài khoản' ? (
                    <Check className='w-4 h-4' />
                  ) : (
                    <Copy className='w-4 h-4' />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <span className='text-blue-200'>Chủ tài khoản:</span>
              <span className='text-white font-medium'>{bankInfo.accountName}</span>
            </div>

            <div className='flex justify-between items-center'>
              <span className='text-blue-200'>Chi nhánh:</span>
              <span className='text-white font-medium'>{bankInfo.branch}</span>
            </div>
          </div>
        </div>

        <div className='mt-4 pt-4 border-t border-blue-500/30'>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-blue-200'>Số tiền:</span>
            <span className='text-green-400 font-bold text-xl'>
              {amount?.toLocaleString()} {currency}
            </span>
          </div>

          <div className='flex justify-between items-center'>
            <span className='text-blue-200'>Nội dung chuyển khoản:</span>
            <div className='flex items-center space-x-2'>
              <span className='text-yellow-300 font-medium'>{transferContent}</span>
              <button
                onClick={() => copyToClipboard(transferContent, 'nội dung')}
                className='text-yellow-400 hover:text-white transition-colors'
              >
                {copied === 'nội dung' ? (
                  <Check className='w-4 h-4' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Họ tên người chuyển <span className='text-red-400'>*</span>
            </label>
            <input
              type='text'
              required
              value={transferInfo.customerName}
              onChange={e => setTransferInfo(prev => ({ ...prev, customerName: e.target.value }))}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='Nguyễn Văn A'
            />
          </div>

          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Email <span className='text-red-400'>*</span>
            </label>
            <input
              type='email'
              required
              value={transferInfo.customerEmail}
              onChange={e => setTransferInfo(prev => ({ ...prev, customerEmail: e.target.value }))}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='email@example.com'
            />
          </div>

          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>Số điện thoại</label>
            <input
              type='tel'
              value={transferInfo.customerPhone}
              onChange={e => setTransferInfo(prev => ({ ...prev, customerPhone: e.target.value }))}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='0901234567'
            />
          </div>

          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Ngân hàng chuyển từ
            </label>
            <input
              type='text'
              value={transferInfo.bankName}
              onChange={e => setTransferInfo(prev => ({ ...prev, bankName: e.target.value }))}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder='VD: Techcombank, BIDV...'
            />
          </div>

          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Ngày chuyển khoản <span className='text-red-400'>*</span>
            </label>
            <input
              type='datetime-local'
              required
              value={transferInfo.transferDate}
              onChange={e => setTransferInfo(prev => ({ ...prev, transferDate: e.target.value }))}
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            />
          </div>

          <div>
            <label className='block text-gray-300 text-sm font-medium mb-2'>
              Số tiền đã chuyển
            </label>
            <input
              type='number'
              value={transferInfo.transferAmount}
              onChange={e =>
                setTransferInfo(prev => ({ ...prev, transferAmount: parseFloat(e.target.value) }))
              }
              className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              placeholder={amount.toString()}
            />
          </div>
        </div>

        <div>
          <label className='block text-gray-300 text-sm font-medium mb-2'>Ghi chú thêm</label>
          <textarea
            value={transferInfo.transferNote}
            onChange={e => setTransferInfo(prev => ({ ...prev, transferNote: e.target.value }))}
            rows={3}
            className='w-full bg-gray-800/50 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none'
            placeholder='Thông tin bổ sung (nếu có)...'
          />
        </div>

        <div>
          <label className='block text-gray-300 text-sm font-medium mb-2'>
            Ảnh chụp bill chuyển khoản
          </label>
          <div className='border-2 border-dashed border-gray-600 rounded-xl p-6 text-center hover:border-gray-500 transition-colors'>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileChange}
              className='hidden'
              id='proof-upload'
            />
            <label htmlFor='proof-upload' className='cursor-pointer'>
              <Upload className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-400 mb-2'>
                {transferInfo.proofImage ? transferInfo.proofImage.name : 'Click để tải ảnh lên'}
              </p>
              <p className='text-gray-500 text-sm'>PNG, JPG lên đến 5MB</p>
            </label>
          </div>
        </div>

        <div className='bg-yellow-500/20 border border-yellow-500/30 rounded-2xl p-4'>
          <div className='flex items-start space-x-3'>
            <AlertCircle className='w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0' />
            <div className='text-yellow-200 text-sm'>
              <p className='font-semibold mb-1'>Lưu ý quan trọng:</p>
              <ul className='space-y-1'>
                <li>• Chuyển khoản đúng số tiền và nội dung như trên</li>
                <li>• Gửi ảnh chụp bill để xác minh nhanh chóng</li>
                <li>• Thời gian xử lý: 2-24h trong ngày làm việc</li>
                <li>• Liên hệ hotline nếu cần hỗ trợ</li>
              </ul>
            </div>
          </div>
        </div>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-gradient-to-r from-green-500 to-blue-600 text-white font-semibold px-8 py-4 rounded-2xl hover:from-green-600 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {loading ? (
            <span className='flex items-center justify-center space-x-2'>
              <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
              <span>Đang gửi...</span>
            </span>
          ) : (
            '🚀 Gửi thông tin chuyển khoản'
          )}
        </button>
      </form>
    </div>
  );
}
