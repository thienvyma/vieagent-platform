# 🌍 HƯỚNG DẪN HỖ TRỢ ĐA NGÔN NGỮ MIỄN PHÍ

## 📊 **PHÂN TÍCH HIỆN TRẠNG**

### **🎯 Tình trạng hiện tại:**
- ✅ **Có sẵn language selector** trong settings (`vi`, `en`, `ja`, `ko`)
- ✅ **Database đã support** language field trong UserSettings
- ✅ **Layout đã set** `lang="vi"` mặc định
- ❌ **Chưa có translation system** thực tế
- ❌ **Chưa có i18n implementation**
- ❌ **Hard-coded text** trong components

### **🔍 Files cần quan tâm:**
```javascript
// Current language support
src/app/layout.tsx: lang="vi"
src/app/dashboard/settings/page.tsx: language selector
prisma/schema.prisma: UserSettings.language
```

---

## 🚀 **GIẢI PHÁP MIỄN PHÍ**

### **Option 1: React Context + JSON Files (Recommended)**

#### **🔧 Implementation Steps:**

#### **Step 1: Tạo Translation Files**
```bash
# Tạo thư mục translations
mkdir -p src/translations
```

**File: `src/translations/vi.json`**
```json
{
  "common": {
    "save": "Lưu",
    "cancel": "Hủy",
    "delete": "Xóa",
    "edit": "Chỉnh sửa",
    "loading": "Đang tải...",
    "success": "Thành công",
    "error": "Lỗi",
    "confirm": "Xác nhận"
  },
  "navigation": {
    "dashboard": "Bảng điều khiển",
    "agents": "Quản lý Agent",
    "chat": "Trò chuyện",
    "knowledge": "Kiến thức",
    "settings": "Cài đặt",
    "logout": "Đăng xuất"
  },
  "agent": {
    "create": "Tạo Agent",
    "name": "Tên Agent",
    "description": "Mô tả",
    "model": "Mô hình AI",
    "temperature": "Nhiệt độ",
    "maxTokens": "Số token tối đa",
    "systemPrompt": "Lời nhắc hệ thống",
    "status": "Trạng thái"
  },
  "chat": {
    "sendMessage": "Gửi tin nhắn",
    "typing": "Đang gõ...",
    "selectAgent": "Chọn Agent",
    "newConversation": "Cuộc trò chuyện mới",
    "messageHistory": "Lịch sử tin nhắn"
  },
  "settings": {
    "profile": "Hồ sơ",
    "language": "Ngôn ngữ",
    "theme": "Giao diện",
    "notifications": "Thông báo",
    "privacy": "Quyền riêng tư"
  }
}
```

**File: `src/translations/en.json`**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading...",
    "success": "Success",
    "error": "Error",
    "confirm": "Confirm"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "agents": "Agent Management",
    "chat": "Chat",
    "knowledge": "Knowledge",
    "settings": "Settings",
    "logout": "Logout"
  },
  "agent": {
    "create": "Create Agent",
    "name": "Agent Name",
    "description": "Description",
    "model": "AI Model",
    "temperature": "Temperature",
    "maxTokens": "Max Tokens",
    "systemPrompt": "System Prompt",
    "status": "Status"
  },
  "chat": {
    "sendMessage": "Send Message",
    "typing": "Typing...",
    "selectAgent": "Select Agent",
    "newConversation": "New Conversation",
    "messageHistory": "Message History"
  },
  "settings": {
    "profile": "Profile",
    "language": "Language",
    "theme": "Theme",
    "notifications": "Notifications",
    "privacy": "Privacy"
  }
}
```

#### **Step 2: Tạo Translation Context**

**File: `src/contexts/TranslationContext.tsx`**
```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

// Import translation files
import viTranslations from '@/translations/vi.json';
import enTranslations from '@/translations/en.json';

type TranslationKey = string;
type TranslationValue = string | Record<string, any>;
type Translations = Record<string, TranslationValue>;

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey, params?: Record<string, string>) => string;
  availableLanguages: { code: string; name: string; flag: string }[];
}

const translations: Record<string, Translations> = {
  vi: viTranslations,
  en: enTranslations,
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { data: session } = useSession();
  const [language, setLanguageState] = useState('vi');

  const availableLanguages = [
    { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  // Load user language preference
  useEffect(() => {
    const loadUserLanguage = async () => {
      if (session?.user?.id) {
        try {
          const response = await fetch('/api/user/settings');
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data?.language) {
              setLanguageState(result.data.language);
            }
          }
        } catch (error) {
          console.error('Error loading user language:', error);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const savedLanguage = localStorage.getItem('preferred-language');
        if (savedLanguage && translations[savedLanguage]) {
          setLanguageState(savedLanguage);
        }
      }
    };

    loadUserLanguage();
  }, [session]);

  const setLanguage = async (lang: string) => {
    setLanguageState(lang);
    
    // Save to localStorage
    localStorage.setItem('preferred-language', lang);
    
    // Save to user settings if authenticated
    if (session?.user?.id) {
      try {
        await fetch('/api/user/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: lang }),
        });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    }
  };

  const getNestedValue = (obj: any, path: string): string => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  };

  const t = (key: TranslationKey, params?: Record<string, string>): string => {
    const currentTranslations = translations[language] || translations['vi'];
    let translation = getNestedValue(currentTranslations, key);
    
    if (!translation) {
      console.warn(`Translation missing for key: ${key} in language: ${language}`);
      return key; // Return key as fallback
    }
    
    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(`{{${param}}}`, value);
      });
    }
    
    return translation;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t, availableLanguages }}>
      {children}
    </TranslationContext.Provider>
  );
};
```

#### **Step 3: Tạo Translation Hook**

**File: `src/hooks/useTranslation.ts`**
```typescript
import { useContext } from 'react';
import { TranslationContext } from '@/contexts/TranslationContext';

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};

// Helper hook for common translations
export const useCommonTranslations = () => {
  const { t } = useTranslation();
  
  return {
    save: t('common.save'),
    cancel: t('common.cancel'),
    delete: t('common.delete'),
    edit: t('common.edit'),
    loading: t('common.loading'),
    success: t('common.success'),
    error: t('common.error'),
    confirm: t('common.confirm'),
  };
};
```

#### **Step 4: Update Layout**

**File: `src/app/layout.tsx`** (Update existing)
```typescript
import TranslationProvider from '@/contexts/TranslationContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi"> {/* Will be dynamic later */}
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <TranslationProvider>
            {children}
            <Toaster />
          </TranslationProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

#### **Step 5: Tạo Language Switcher Component**

**File: `src/components/ui/LanguageSwitcher.tsx`**
```typescript
'use client';

import { useState } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';
import { ChevronDownIcon, GlobeIcon } from 'lucide-react';

export default function LanguageSwitcher() {
  const { language, setLanguage, availableLanguages } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = availableLanguages.find(lang => lang.code === language);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-600 hover:bg-gray-700/50 transition-colors"
      >
        <GlobeIcon className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-white">
          {currentLanguage?.flag} {currentLanguage?.name}
        </span>
        <ChevronDownIcon className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 transition-colors ${
                language === lang.code 
                  ? 'bg-purple-600/20 text-purple-400' 
                  : 'text-gray-300'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### **Step 6: Update Components để sử dụng translations**

**Example: Update Dashboard Header**
```typescript
// src/components/dashboard/DashboardHeader.tsx
import { useTranslation } from '@/contexts/TranslationContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

export default function DashboardHeader() {
  const { t } = useTranslation();
  
  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-xl font-semibold text-white">
          {t('navigation.dashboard')}
        </h1>
        <div className="flex items-center space-x-4">
          <LanguageSwitcher />
          {/* Other header items */}
        </div>
      </div>
    </header>
  );
}
```

---

## 🎯 **IMPLEMENTATION PLAN**

### **Phase 1: Core Setup (2-3 hours)**
1. ✅ Tạo translation files (vi.json, en.json)
2. ✅ Tạo TranslationContext
3. ✅ Tạo LanguageSwitcher component
4. ✅ Update layout để wrap TranslationProvider

### **Phase 2: Component Updates (4-6 hours)**
1. 🔄 Update Dashboard components
2. 🔄 Update Agent management
3. 🔄 Update Chat interface
4. 🔄 Update Settings page
5. 🔄 Update Navigation

### **Phase 3: Advanced Features (2-3 hours)**
1. 🔄 Dynamic HTML lang attribute
2. 🔄 RTL support preparation
3. 🔄 Date/time localization
4. 🔄 Number formatting

### **Phase 4: Testing & Optimization (1-2 hours)**
1. 🔄 Test all pages
2. 🔄 Missing translation detection
3. 🔄 Performance optimization

---

## 🔧 **ADVANCED FEATURES**

### **Dynamic HTML Lang Attribute**

**File: `src/components/providers/DynamicHtmlLang.tsx`**
```typescript
'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/contexts/TranslationContext';

export default function DynamicHtmlLang() {
  const { language } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
```

### **Date/Time Localization**

**File: `src/utils/dateLocalization.ts`**
```typescript
export const formatDate = (date: Date | string, language: string = 'vi'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const locales = {
    vi: 'vi-VN',
    en: 'en-US',
  };

  return dateObj.toLocaleDateString(locales[language] || locales.vi, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (date: Date | string, language: string = 'vi'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const locales = {
    vi: 'vi-VN',
    en: 'en-US',
  };

  return dateObj.toLocaleTimeString(locales[language] || locales.vi, {
    hour: '2-digit',
    minute: '2-digit',
  });
};
```

### **Number Formatting**

**File: `src/utils/numberLocalization.ts`**
```typescript
export const formatNumber = (number: number, language: string = 'vi'): string => {
  const locales = {
    vi: 'vi-VN',
    en: 'en-US',
  };

  return number.toLocaleString(locales[language] || locales.vi);
};

export const formatCurrency = (amount: number, currency: string = 'VND', language: string = 'vi'): string => {
  const locales = {
    vi: 'vi-VN',
    en: 'en-US',
  };

  return new Intl.NumberFormat(locales[language] || locales.vi, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};
```

---

## 🚀 **QUICK START SCRIPT**

**File: `scripts/setup-i18n.js`**
```javascript
const fs = require('fs');
const path = require('path');

// Create translations directory
const translationsDir = path.join(process.cwd(), 'src', 'translations');
if (!fs.existsSync(translationsDir)) {
  fs.mkdirSync(translationsDir, { recursive: true });
}

// Create basic translation files
const viTranslations = {
  common: {
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    loading: 'Đang tải...',
    success: 'Thành công',
    error: 'Lỗi',
    confirm: 'Xác nhận'
  },
  navigation: {
    dashboard: 'Bảng điều khiển',
    agents: 'Quản lý Agent',
    chat: 'Trò chuyện',
    knowledge: 'Kiến thức',
    settings: 'Cài đặt'
  }
};

const enTranslations = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    loading: 'Loading...',
    success: 'Success',
    error: 'Error',
    confirm: 'Confirm'
  },
  navigation: {
    dashboard: 'Dashboard',
    agents: 'Agent Management',
    chat: 'Chat',
    knowledge: 'Knowledge',
    settings: 'Settings'
  }
};

// Write translation files
fs.writeFileSync(
  path.join(translationsDir, 'vi.json'),
  JSON.stringify(viTranslations, null, 2)
);

fs.writeFileSync(
  path.join(translationsDir, 'en.json'),
  JSON.stringify(enTranslations, null, 2)
);

console.log('✅ I18n setup completed!');
console.log('📁 Translation files created in src/translations/');
console.log('🔄 Next steps:');
console.log('1. Create TranslationContext');
console.log('2. Update layout.tsx');
console.log('3. Add LanguageSwitcher component');
console.log('4. Update components to use translations');
```

---

## 📊 **COST ANALYSIS**

### **💰 Chi phí = $0**
- ✅ **No external services**: Không cần Google Translate API
- ✅ **No additional libraries**: Chỉ dùng React Context
- ✅ **No database changes**: Đã có sẵn language field
- ✅ **No hosting costs**: Static JSON files
- ✅ **No maintenance fees**: Self-managed

### **⏱️ Time Investment**
- **Setup**: 2-3 hours
- **Component updates**: 4-6 hours  
- **Testing**: 1-2 hours
- **Total**: 7-11 hours

### **📈 Benefits**
- ✅ **Better user experience** cho international users
- ✅ **SEO improvement** với multiple languages
- ✅ **Market expansion** potential
- ✅ **Professional appearance**
- ✅ **Competitive advantage**

---

## 🎯 **EXECUTION CHECKLIST**

### **Immediate Actions (Next 2 hours)**
- [ ] Run setup script: `node scripts/setup-i18n.js`
- [ ] Create TranslationContext
- [ ] Update layout.tsx
- [ ] Test basic functionality

### **Short-term (This week)**
- [ ] Update all dashboard components
- [ ] Add LanguageSwitcher to header
- [ ] Test user language persistence
- [ ] Update settings page

### **Long-term (Next week)**
- [ ] Add more languages (Japanese, Korean)
- [ ] Implement RTL support
- [ ] Add translation management tools
- [ ] Performance optimization

---

## 🔮 **FUTURE ENHANCEMENTS**

### **Advanced Features (Optional)**
1. **Translation Management Panel**: Admin interface để manage translations
2. **Auto-translation**: Tích hợp free translation APIs
3. **User Contributions**: Cho phép users contribute translations
4. **A/B Testing**: Test different translations
5. **Analytics**: Track language usage

### **Technical Improvements**
1. **Lazy Loading**: Load translations on demand
2. **Caching**: Cache translations in localStorage
3. **Tree Shaking**: Remove unused translations
4. **TypeScript**: Strong typing cho translation keys

---

**🎯 Result: Hoàn toàn miễn phí, professional i18n system trong 1 ngày!**

**💡 Key Advantage: Sử dụng React Context thay vì expensive i18n libraries**

**📈 ROI: $0 cost, significant UX improvement, market expansion potential** 