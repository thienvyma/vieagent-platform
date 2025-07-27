'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import PlanUpgradeModal from './PlanUpgradeModal';
// ✅ PHASE 4B - Import standardized UI components
import Button from '@/components/ui/Button';

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

interface UpgradeButtonProps {
  variant?: 'header' | 'page';
}

export default function UpgradeButton({ variant = 'header' }: UpgradeButtonProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<Plan[]>([]);
  const [upgradeRequest, setUpgradeRequest] = useState<UpgradeRequest | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentPlan = session?.user?.plan || 'Trial';

  useEffect(() => {
    if (isOpen) {
      fetchPlansAndRequest();
    }
  }, [isOpen]);

  const fetchPlansAndRequest = async () => {
    setLoading(true);
    try {
      // Fetch available plans
      const plansResponse = await fetch('/api/public/plans');
      const plansData = await plansResponse.json();

      if (plansData.success) {
        // Filter out current plan and lower plans
        const higherPlans = filterHigherPlans(plansData.data, currentPlan);
        setAvailablePlans(higherPlans);
      }

      // Fetch current upgrade request
      const requestResponse = await fetch('/api/user/upgrade-request');
      const requestData = await requestResponse.json();

      if (requestData.success && requestData.data) {
        setUpgradeRequest(requestData.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Có lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const filterHigherPlans = (plans: Plan[], currentPlanName: string): Plan[] => {
    const planHierarchy = ['trial', 'basic', 'pro', 'enterprise', 'ultimate'];
    const currentIndex = planHierarchy.findIndex(p => currentPlanName.toLowerCase().includes(p));

    return plans.filter(plan => {
      const planIndex = planHierarchy.findIndex(p => plan.name.toLowerCase().includes(p));
      return planIndex > currentIndex;
    });
  };

  const handleSubmit = async (targetPlan: string, reason: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/user/upgrade-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan,
          currentPlan,
          reason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Yêu cầu nâng cấp đã được gửi thành công!');
        setUpgradeRequest(data.data);
        setIsOpen(false);
      } else {
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error submitting upgrade request:', error);
      toast.error('Lỗi kết nối mạng');
    } finally {
      setSubmitting(false);
    }
  };

  // Count available plans for badge
  const availableCount = availablePlans.length;

  if (variant === 'header') {
    return (
      <>
        {/* ✅ PHASE 4B - Use standardized Button component with custom gradient */}
        <div className='relative'>
          <Button
            onClick={() => setIsOpen(true)}
            variant='primary'
            size='sm'
            gradient='from-purple-500 to-pink-600'
            icon={<span className='text-lg'>💎</span>}
            className='group'
          >
            <span className='hidden md:inline'>Nâng cấp</span>
          </Button>

          {availableCount > 0 && (
            <div className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse'>
              {availableCount}
            </div>
          )}
        </div>

        <PlanUpgradeModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          availablePlans={availablePlans}
          currentPlan={currentPlan}
          upgradeRequest={upgradeRequest}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </>
    );
  }

  if (variant === 'page') {
    return (
      <div className='text-center'>
        {availableCount > 0 ? (
          <div className='flex justify-center'>
            {/* ✅ PHASE 4B - Use standardized Button component */}
            <Button
              onClick={() => setIsOpen(true)}
              variant='primary'
              size='lg'
              gradient='from-purple-500 to-pink-600'
              icon={<span className='text-xl'>💎</span>}
              className='text-lg font-semibold shadow-lg hover:shadow-xl'
            >
              <span>Yêu cầu nâng cấp gói dịch vụ</span>
              <div className='bg-white/20 px-2 py-1 rounded-lg text-sm ml-2'>
                {availableCount} gói
              </div>
            </Button>
          </div>
        ) : (
          <div className='bg-white/5 border border-gray-600 rounded-2xl p-8'>
            <div className='text-6xl mb-4'>🎉</div>
            <h3 className='text-xl font-bold text-white mb-2'>Bạn đã sử dụng gói cao nhất!</h3>
            <p className='text-gray-400'>Không có gói nào cao hơn gói hiện tại của bạn.</p>
          </div>
        )}

        <PlanUpgradeModal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          availablePlans={availablePlans}
          currentPlan={currentPlan}
          upgradeRequest={upgradeRequest}
          onSubmit={handleSubmit}
          submitting={submitting}
        />
      </div>
    );
  }

  return null;
}
