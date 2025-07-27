'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function DataImportRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Show notification about the migration
    toast.success('Redirecting to unified Knowledge Center...', {
      duration: 3000,
      icon: '📚',
    });

    // Redirect to new unified page
    setTimeout(() => {
      router.replace('/dashboard/knowledge');
    }, 1500);
  }, [router]);

  return (
    <div className='min-h-screen bg-gray-900 flex items-center justify-center'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4'></div>
        <h2 className='text-2xl font-semibold text-white mb-2'>Page Moved</h2>
        <p className='text-gray-400 mb-4'>
          Data Import has been integrated into the new Knowledge Center
        </p>
        <p className='text-sm text-gray-500'>Redirecting you now...</p>
      </div>
    </div>
  );
}
