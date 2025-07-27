'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ArrowUp, CheckCircle, Star, Clock, XCircle } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: string;
  features: string[];
  limits: {
    agents: number;
    conversations: number;
    messages: number;
  };
  popular?: boolean;
  isActive: boolean;
}

interface UpgradeRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  targetPlan: string;
  currentPlan: string;
  reason?: string;
  rejectionReason?: string;
  createdAt: string;
}

interface PlanUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  availablePlans: Plan[];
  currentPlan: string;
  upgradeRequest: UpgradeRequest | null;
  onSubmit: (targetPlan: string, reason: string) => void;
  submitting: boolean;
}

export default function PlanUpgradeModal({
  isOpen,
  onClose,
  availablePlans,
  currentPlan,
  upgradeRequest,
  onSubmit,
  submitting,
}: PlanUpgradeModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [reason, setReason] = useState('');
  const [step, setStep] = useState<'select' | 'reason'>('select');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handlePlanSelect = (plan: Plan) => {
    setSelectedPlan(plan);
    setStep('reason');
  };

  const handleSubmit = () => {
    if (selectedPlan && reason.trim()) {
      onSubmit(selectedPlan.name, reason.trim());
      setSelectedPlan(null);
      setReason('');
      setStep('select');
    }
  };

  const handleBack = () => {
    setStep('select');
    setSelectedPlan(null);
  };

  const getPlanBadge = (planName: string) => {
    const name = planName.toLowerCase();
    if (name.includes('trial'))
      return {
        bg: 'bg-gray-500/20',
        border: 'border-gray-500/30',
        text: 'text-gray-300',
        emoji: '🎯',
      };
    if (name.includes('basic'))
      return {
        bg: 'bg-blue-500/20',
        border: 'border-blue-500/30',
        text: 'text-blue-300',
        emoji: '💡',
      };
    if (name.includes('pro'))
      return {
        bg: 'bg-purple-500/20',
        border: 'border-purple-500/30',
        text: 'text-purple-300',
        emoji: '🚀',
      };
    if (name.includes('enterprise'))
      return {
        bg: 'bg-orange-500/20',
        border: 'border-orange-500/30',
        text: 'text-orange-300',
        emoji: '🏢',
      };
    if (name.includes('ultimate'))
      return {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-300',
        emoji: '👑',
      };
    return {
      bg: 'bg-gray-500/20',
      border: 'border-gray-500/30',
      text: 'text-gray-300',
      emoji: '📦',
    };
  };

  const modalContent = (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-start justify-center p-4 pt-8 overflow-y-auto'
      style={{ zIndex: 99999 }}
    >
      <div className='bg-gray-900 rounded-3xl max-w-6xl w-full min-h-fit max-h-none border border-gray-700 my-8 relative z-[99999]'>
        <div className='p-6 sm:p-8'>
          {/* Header */}
          <div className='flex items-center justify-between mb-4 sm:mb-6'>
            <h2 className='text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center space-x-2 sm:space-x-3'>
              <div className='w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center'>
                💎
              </div>
              <span>Nâng cấp gói dịch vụ</span>
            </h2>
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-xl flex-shrink-0'
            >
              <X className='w-5 h-5 sm:w-6 sm:h-6' />
            </button>
          </div>

          {/* Current Plan Info */}
          <div className='bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 border border-gray-600'>
            <div className='flex items-center space-x-3 sm:space-x-4'>
              <div className='w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0'>
                <CheckCircle className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
              </div>
              <div className='min-w-0 flex-1'>
                <h3 className='text-lg sm:text-xl font-semibold text-white truncate'>
                  Gói hiện tại: {currentPlan}
                </h3>
                <p className='text-sm sm:text-base text-gray-400 truncate'>
                  Bạn đang sử dụng gói {currentPlan}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Request Warning */}
          {upgradeRequest && upgradeRequest.status === 'PENDING' && (
            <div className='bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-6 mb-6'>
              <div className='flex items-start space-x-3 text-yellow-300'>
                <Clock className='w-6 h-6 mt-0.5' />
                <div>
                  <p className='font-semibold text-lg'>
                    ⏳ Bạn đã có yêu cầu nâng cấp đang chờ duyệt
                  </p>
                  <p className='text-sm opacity-80 mt-1'>
                    Yêu cầu nâng cấp lên <strong>{upgradeRequest.targetPlan}</strong> đang được xem
                    xét. Vui lòng chờ admin phê duyệt hoặc liên hệ support để biết thêm chi tiết.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Message */}
          {upgradeRequest &&
            upgradeRequest.status === 'REJECTED' &&
            upgradeRequest.rejectionReason && (
              <div className='bg-red-500/10 border border-red-500/30 rounded-2xl p-6 mb-6'>
                <div className='flex items-start space-x-3 text-red-300'>
                  <XCircle className='w-6 h-6 mt-0.5' />
                  <div>
                    <p className='font-semibold text-lg'>❌ Yêu cầu trước đã bị từ chối</p>
                    <p className='text-sm opacity-80 mt-1'>{upgradeRequest.rejectionReason}</p>
                    <p className='text-xs opacity-60 mt-2'>
                      Bạn có thể gửi yêu cầu mới với lý do rõ ràng hơn.
                    </p>
                  </div>
                </div>
              </div>
            )}

          {step === 'select' && (
            <>
              {/* Plan Selection */}
              <div className='mb-8'>
                <h3 className='text-2xl font-bold text-white mb-6 flex items-center space-x-2'>
                  <Star className='w-6 h-6 text-yellow-400' />
                  <span>Chọn gói nâng cấp</span>
                </h3>

                {availablePlans.length === 0 ? (
                  <div className='text-center py-12'>
                    <div className='text-6xl mb-4'>🎉</div>
                    <h4 className='text-2xl font-bold text-white mb-2'>
                      Bạn đã sử dụng gói cao nhất!
                    </h4>
                    <p className='text-gray-400'>Không có gói nào cao hơn gói hiện tại của bạn.</p>
                  </div>
                ) : (
                  <div className='grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6'>
                    {availablePlans.map(plan => {
                      const planBadge = getPlanBadge(plan.name);
                      return (
                        <div
                          key={plan.id}
                          className='bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-600 hover:border-purple-500/50 transition-all group cursor-pointer relative'
                          onClick={() => handlePlanSelect(plan)}
                        >
                          {plan.popular && (
                            <div className='absolute -top-3 left-1/2 transform -translate-x-1/2'>
                              <div className='bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-medium'>
                                ⭐ Popular
                              </div>
                            </div>
                          )}

                          <div className='text-center mb-6'>
                            <div
                              className={`inline-flex px-4 py-2 ${planBadge.bg} border ${planBadge.border} rounded-xl mb-4`}
                            >
                              <span className={`${planBadge.text} text-sm font-medium`}>
                                {planBadge.emoji} {plan.name}
                              </span>
                            </div>

                            <div className='text-3xl font-bold text-white mb-2'>
                              {plan.price === -1 ? (
                                <span className='text-purple-400'>Liên hệ</span>
                              ) : (
                                <>
                                  <span className='text-2xl'>$</span>
                                  {plan.price}
                                  <span className='text-lg text-gray-400'>/{plan.interval}</span>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Features */}
                          <div className='space-y-3 mb-6'>
                            {plan.features.slice(0, 5).map((feature, index) => (
                              <div key={index} className='flex items-start space-x-3'>
                                <CheckCircle className='w-5 h-5 text-green-400 mt-0.5 flex-shrink-0' />
                                <span className='text-gray-300 text-sm'>{feature}</span>
                              </div>
                            ))}
                            {plan.features.length > 5 && (
                              <div className='text-gray-400 text-sm'>
                                +{plan.features.length - 5} tính năng khác...
                              </div>
                            )}
                          </div>

                          {/* Select Button */}
                          <button className='w-full bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all flex items-center justify-center space-x-2 group-hover:scale-105'>
                            <ArrowUp className='w-5 h-5' />
                            <span>Chọn gói này</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {step === 'reason' && selectedPlan && (
            <>
              {/* Reason Step */}
              <div className='mb-8'>
                <div className='flex items-center space-x-4 mb-6'>
                  <button
                    onClick={handleBack}
                    className='text-gray-400 hover:text-white transition-colors'
                  >
                    ← Quay lại
                  </button>
                  <h3 className='text-2xl font-bold text-white'>Lý do nâng cấp</h3>
                </div>

                {/* Selected Plan Summary */}
                <div className='bg-white/5 rounded-2xl p-6 mb-6 border border-purple-500/30'>
                  <div className='flex items-center space-x-4'>
                    <div className='w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center'>
                      {getPlanBadge(selectedPlan.name).emoji}
                    </div>
                    <div>
                      <h4 className='text-lg font-semibold text-white'>{selectedPlan.name}</h4>
                      <p className='text-gray-400'>
                        {selectedPlan.price === -1
                          ? 'Liên hệ'
                          : `$${selectedPlan.price}/${selectedPlan.interval}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className='space-y-3 sm:space-y-4'>
                  <label className='block text-white font-medium text-sm sm:text-base'>
                    Vui lòng cho biết lý do bạn muốn nâng cấp lên gói {selectedPlan.name}:
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder='Ví dụ: Cần thêm AI agents để phục vụ nhiều khách hàng hơn, cần tính năng Google Integration để tích hợp với hệ thống hiện tại...'
                    className='w-full bg-white/10 border border-gray-600 rounded-xl p-3 sm:p-4 text-white placeholder-gray-400 resize-none h-24 sm:h-32 focus:outline-none focus:border-purple-500 text-sm sm:text-base'
                    maxLength={500}
                  />
                  <div className='text-gray-400 text-xs sm:text-sm'>{reason.length}/500 ký tự</div>
                </div>

                <div className='flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 mt-6 sm:mt-8'>
                  <button
                    onClick={handleBack}
                    className='w-full sm:flex-1 bg-gray-600 text-white py-3 rounded-xl hover:bg-gray-700 transition-colors text-sm sm:text-base'
                  >
                    Quay lại
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!reason.trim() || submitting}
                    className='w-full sm:flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-3 rounded-xl hover:from-purple-600 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-sm sm:text-base'
                  >
                    {submitting ? (
                      <>
                        <div className='w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                        <span>Đang gửi...</span>
                      </>
                    ) : (
                      <>
                        <ArrowUp className='w-4 h-4 sm:w-5 sm:h-5' />
                        <span>Gửi yêu cầu</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
