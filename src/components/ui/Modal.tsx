import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  className = '',
  closeOnOverlayClick = true,
  showCloseButton = true,
}) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      className='fixed inset-0 bg-black/50 backdrop-blur-sm z-[55] flex items-center justify-center p-4'
      onClick={handleOverlayClick}
    >
      <div
        className={`
          relative bg-gray-900 rounded-2xl border border-gray-700 
          w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
          ${className}
        `}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-6 border-b border-gray-800/50'>
          <div className='flex items-center space-x-3'>
            {icon && (
              <div className='w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0'>
                {icon}
              </div>
            )}
            <div className='min-w-0 flex-1'>
              <h3 className='text-xl font-bold text-white truncate'>{title}</h3>
              {subtitle && <p className='text-sm text-gray-400 truncate'>{subtitle}</p>}
            </div>
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className='text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-xl flex-shrink-0'
            >
              <X className='w-5 h-5' />
            </button>
          )}
        </div>

        {/* Content */}
        <div className='p-6 overflow-y-auto max-h-[calc(90vh-200px)]'>{children}</div>

        {/* Footer */}
        {footer && (
          <div className='flex items-center justify-between p-6 border-t border-gray-800/50 bg-gray-900/50'>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) => {
  const variantStyles = {
    danger: 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
    warning: 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
    info: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size='sm'
      footer={
        <div className='flex space-x-3 w-full'>
          <button
            onClick={onClose}
            disabled={loading}
            className='flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-50'
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              flex-1 px-4 py-2 bg-gradient-to-r ${variantStyles[variant]} 
              text-white rounded-lg transition-all disabled:opacity-50 font-medium
            `}
          >
            {loading ? (
              <span className='flex items-center justify-center space-x-2'>
                <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin'></div>
                <span>Loading...</span>
              </span>
            ) : (
              confirmText
            )}
          </button>
        </div>
      }
    >
      <p className='text-gray-300'>{message}</p>
    </Modal>
  );
};

interface TabModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  tabs: Array<{
    id: string;
    label: string;
    icon?: React.ReactNode;
    content: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const TabModal: React.FC<TabModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  tabs,
  activeTab,
  onTabChange,
  footer,
  size = 'lg',
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={icon}
      size={size}
      footer={footer}
      className='overflow-hidden'
    >
      <div className='flex flex-col h-full'>
        {/* Tabs */}
        <div className='flex border-b border-gray-800/50 -mx-6 px-6'>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-4 font-medium transition-colors
                ${
                  activeTab === tab.id
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-gray-400 hover:text-white'
                }
              `}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className='flex-1 py-6 -mx-6 px-6'>
          {tabs.find(tab => tab.id === activeTab)?.content}
        </div>
      </div>
    </Modal>
  );
};

export default Modal;
export { ConfirmModal, TabModal };
