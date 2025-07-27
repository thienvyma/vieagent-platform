interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  loading = false,
}: ConfirmationDialogProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'danger':
        return {
          icon: '⚠️',
          confirmButton: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
          iconColor: 'text-red-400',
        };
      case 'warning':
        return {
          icon: '⚠️',
          confirmButton: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
          iconColor: 'text-yellow-400',
        };
      default:
        return {
          icon: 'ℹ️',
          confirmButton: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
          iconColor: 'text-blue-400',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50'>
      <div className='bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 border border-gray-700'>
        <div className='flex items-start space-x-4'>
          <div className={`text-2xl ${styles.iconColor}`}>{styles.icon}</div>
          <div className='flex-1'>
            <h3 className='text-lg font-semibold text-white mb-2'>{title}</h3>
            <p className='text-gray-300 mb-6'>{message}</p>
            <div className='flex items-center justify-end space-x-3'>
              <button
                onClick={onClose}
                disabled={loading}
                className='px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50'
              >
                {cancelText}
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 ${styles.confirmButton}`}
              >
                {loading ? (
                  <div className='flex items-center space-x-2'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  confirmText
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
