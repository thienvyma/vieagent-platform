'use client';

import { useState } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { CreditCard, Shield, Lock, CheckCircle, AlertCircle } from 'lucide-react';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  currency: string;
  planName: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripePaymentForm({
  clientSecret,
  amount,
  currency,
  planName,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        setMessage(`Payment failed: ${error.message}`);
      } else {
        setMessage('Payment successful! Redirecting...');
        onSuccess();
      }
    } catch (err) {
      const errorMessage = 'Payment processing failed';
      onError(errorMessage);
      setMessage(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10'>
      {/* Header */}
      <div className='text-center mb-8'>
        <div className='w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4'>
          <CreditCard className='w-8 h-8 text-white' />
        </div>
        <h3 className='text-2xl font-bold text-white mb-2'>💳 Thanh toán an toàn</h3>
        <p className='text-gray-400'>Hoàn tất đăng ký gói {planName}</p>
      </div>

      {/* Payment Summary */}
      <div className='bg-white/5 rounded-2xl p-6 mb-8'>
        <div className='flex justify-between items-center mb-4'>
          <span className='text-gray-300'>Gói dịch vụ:</span>
          <span className='text-white font-semibold'>{planName}</span>
        </div>
        <div className='flex justify-between items-center'>
          <span className='text-gray-300'>Số tiền:</span>
          <span className='text-3xl font-bold text-green-400'>
            ${amount} {currency.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Payment Form */}
      <form onSubmit={handleSubmit} className='space-y-6'>
        <div className='bg-white/5 rounded-2xl p-6'>
          <div className='mb-4'>
            <h4 className='text-white font-semibold mb-2'>Thông tin thanh toán</h4>
            <p className='text-gray-400 text-sm'>
              Nhập thông tin thẻ của bạn để hoàn tất thanh toán
            </p>
          </div>
          <PaymentElement
            options={{
              layout: 'tabs',
              defaultValues: {
                billingDetails: {
                  email: 'customer@example.com',
                },
              },
            }}
          />
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`p-4 rounded-2xl flex items-center space-x-3 ${
              message.includes('successful')
                ? 'bg-green-500/20 border border-green-500/30 text-green-300'
                : 'bg-red-500/20 border border-red-500/30 text-red-300'
            }`}
          >
            {message.includes('successful') ? (
              <CheckCircle className='w-5 h-5' />
            ) : (
              <AlertCircle className='w-5 h-5' />
            )}
            <span>{message}</span>
          </div>
        )}

        {/* Security Info */}
        <div className='bg-green-500/10 border border-green-500/30 rounded-2xl p-4'>
          <div className='flex items-center space-x-3 text-green-300'>
            <Shield className='w-6 h-6' />
            <div className='flex-1'>
              <p className='font-semibold'>🔒 Thanh toán bảo mật</p>
              <p className='text-sm opacity-80'>Được bảo vệ bởi mã hóa SSL 256-bit</p>
            </div>
            <Lock className='w-5 h-5' />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type='submit'
          disabled={!stripe || !elements || isProcessing}
          className='w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-4 rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isProcessing ? (
            <div className='flex items-center justify-center space-x-2'>
              <div className='w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin'></div>
              <span>Đang xử lý thanh toán...</span>
            </div>
          ) : (
            <span className='flex items-center justify-center space-x-2'>
              <CreditCard className='w-5 h-5' />
              <span>
                Thanh toán ${amount} {currency.toUpperCase()}
              </span>
            </span>
          )}
        </button>
      </form>

      {/* Payment Methods */}
      <div className='mt-8 text-center'>
        <p className='text-gray-400 text-sm mb-4'>Phương thức thanh toán được chấp nhận</p>
        <div className='flex justify-center space-x-4'>
          <div className='bg-white/10 rounded-lg p-3 flex items-center space-x-2'>
            <span className='text-blue-400 font-bold text-sm'>💳 VISA</span>
          </div>
          <div className='bg-white/10 rounded-lg p-3 flex items-center space-x-2'>
            <span className='text-red-400 font-bold text-sm'>💳 MC</span>
          </div>
          <div className='bg-white/10 rounded-lg p-3 flex items-center space-x-2'>
            <span className='text-blue-300 font-bold text-sm'>💳 AMEX</span>
          </div>
          <div className='bg-white/10 rounded-lg p-3 flex items-center space-x-2'>
            <span className='text-purple-400 font-bold text-sm'>📱 GPay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
