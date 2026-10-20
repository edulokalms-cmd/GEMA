import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { HamzanwadiLogo } from './HamzanwadiLogo';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  logoUrl?: string | null;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-9 h-9',
  size,
  logoUrl: propLogoUrl,
}) => {
  const { appLogo } = useSettings();
  const [loadError, setLoadError] = useState(false);

  // If specific prop provided, use it; otherwise use global settings logo
  const effectiveUrl = propLogoUrl !== undefined ? propLogoUrl : appLogo;

  useEffect(() => {
    setLoadError(false);
  }, [effectiveUrl]);

  if (effectiveUrl && effectiveUrl.trim().length > 0 && !loadError) {
    return (
      <img
        src={effectiveUrl}
        alt="Logo Universitas Hamzanwadi"
        className={`object-contain ${className}`}
        style={size ? { width: size, height: size } : undefined}
        onError={() => setLoadError(true)}
      />
    );
  }

  return <HamzanwadiLogo className={className} size={size} />;
};
