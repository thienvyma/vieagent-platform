'use client';

import DashboardLayout from '@/components/ui/DashboardLayout';
import TranslationDemo from '@/components/demo/TranslationDemo';

export default function TranslationDemoPage() {
  return (
    <DashboardLayout
      title="Translation Demo"
      description="Test the internationalization system"
    >
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-6">
          <h1 className="text-2xl font-bold text-white mb-2">
            🌍 Multilingual System Demo
          </h1>
          <p className="text-gray-300">
            This demo shows the internationalization system working with Vietnamese and English translations.
          </p>
        </div>
        
        <TranslationDemo />
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-green-400 mb-2">
                ✅ Implemented
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• React Context for state management</li>
                <li>• JSON translation files</li>
                <li>• Language switcher component</li>
                <li>• Persistent language selection</li>
                <li>• Fallback to Vietnamese</li>
                <li>• Parameter replacement support</li>
                <li>• Dynamic HTML lang attribute</li>
              </ul>
            </div>
            
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-yellow-400 mb-2">
                🔄 In Progress
              </h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Updating all components</li>
                <li>• Adding more translation keys</li>
                <li>• Testing across the app</li>
                <li>• Performance optimization</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 