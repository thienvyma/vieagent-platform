'use client';

import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function TranslationDemo() {
  const { t, language } = useTranslation();

  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">
          {t('language.switchLanguage')}
        </h2>
        <LanguageSwitcher />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('navigation.dashboard')}
          </h3>
          <p className="text-gray-300 text-sm">
            {t('dashboard.welcome')}
          </p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('navigation.agents')}
          </h3>
          <p className="text-gray-300 text-sm">
            {t('agent.create')}
          </p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('navigation.chat')}
          </h3>
          <p className="text-gray-300 text-sm">
            {t('chat.sendMessage')}
          </p>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">
            {t('navigation.settings')}
          </h3>
          <p className="text-gray-300 text-sm">
            {t('settings.language')}
          </p>
        </div>
      </div>
      
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-2">
          {t('common.loading')}
        </h3>
        <div className="flex space-x-2">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
            {t('common.save')}
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded">
            {t('common.cancel')}
          </button>
        </div>
      </div>
      
      <div className="text-center text-gray-400 text-sm">
        {t('language.currentLanguage')}: {language === 'vi' ? t('language.vietnamese') : t('language.english')}
      </div>
    </div>
  );
} 