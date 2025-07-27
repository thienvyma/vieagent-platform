import React from 'react';
import Image from 'next/image';

interface VIEAgentLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'square' | 'horizontal';
  className?: string;
}

export const VIEAgentLogo: React.FC<VIEAgentLogoProps> = ({
  size = 'medium',
  variant = 'square',
  className = '',
}) => {
  const getLogoPath = () => {
    if (variant === 'horizontal') {
      return '/images/vieagent-logo-horizontal.png';
    }
    return '/images/vieagent-logo-square.png';
  };

  const getDimensions = () => {
    if (variant === 'horizontal') {
      switch (size) {
        case 'small':
          return { width: 120, height: 40 };
        case 'large':
          return { width: 300, height: 100 };
        default:
          return { width: 200, height: 67 };
      }
    }

    switch (size) {
      case 'small':
        return { width: 32, height: 32 };
      case 'large':
        return { width: 128, height: 128 };
      default:
        return { width: 64, height: 64 };
    }
  };

  const { width, height } = getDimensions();
  const logoPath = getLogoPath();

  return (
    <div className={`flex items-center ${className}`}>
      <Image
        src={logoPath}
        alt='VIEAgent Logo'
        width={width}
        height={height}
        className='object-contain'
        priority
      />
    </div>
  );
};

export default VIEAgentLogo;
