import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { SystemSettings } from '../types';

interface SettingsContextType {
  settings: SystemSettings | null;
  appLogo: string;
  updateAppLogo: (logo: string) => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [appLogo, setAppLogo] = useState<string>(() => {
    try {
      return localStorage.getItem('gema_bio_app_logo') || '';
    } catch {
      return '';
    }
  });

  const loadSettings = async () => {
    try {
      const data = await api.settings.get();
      setSettings(data);
      if (data && data.app_logo) {
        setAppLogo(data.app_logo);
        try {
          localStorage.setItem('gema_bio_app_logo', data.app_logo);
        } catch {
          // ignore storage error
        }
      } else {
        // If server has no logo, check if localStorage has one and sync to server
        const localLogo = localStorage.getItem('gema_bio_app_logo');
        if (localLogo) {
          setAppLogo(localLogo);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'gema_bio_app_logo') {
        setAppLogo(e.newValue || '');
      }
    };

    const handleCustomLogoChange = (e: any) => {
      if (e.detail !== undefined) {
        setAppLogo(e.detail || '');
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('app_logo_updated', handleCustomLogoChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('app_logo_updated', handleCustomLogoChange);
    };
  }, []);

  const updateAppLogo = async (newLogo: string) => {
    setAppLogo(newLogo);
    try {
      if (newLogo) {
        localStorage.setItem('gema_bio_app_logo', newLogo);
      } else {
        localStorage.removeItem('gema_bio_app_logo');
      }
      window.dispatchEvent(new CustomEvent('app_logo_updated', { detail: newLogo }));
    } catch {
      // ignore
    }

    try {
      const updated = await api.settings.update({ app_logo: newLogo });
      setSettings(updated);
    } catch (err) {
      console.error('Failed to update app logo on server:', err);
      // Even if server request fails, local state & localStorage is already preserved
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        appLogo,
        updateAppLogo,
        refreshSettings: loadSettings,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    // Graceful fallback if rendered outside provider
    return {
      settings: null,
      appLogo: typeof window !== 'undefined' ? localStorage.getItem('gema_bio_app_logo') || '' : '',
      updateAppLogo: async () => {},
      refreshSettings: async () => {},
    };
  }
  return context;
};
