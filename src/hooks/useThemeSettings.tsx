import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeSettingsContextType {
  themeToggleVisible: boolean;
  loading: boolean;
  setThemeToggleVisible: (visible: boolean) => Promise<void>;
  refetchSettings: () => Promise<void>;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  // Default to null (unknown state) instead of true to prevent flash
  const [themeToggleVisible, setThemeToggleVisibleState] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'theme_toggle_visible')
        .maybeSingle();

      if (!error && data?.value && typeof data.value === 'object' && 'visible' in data.value) {
        setThemeToggleVisibleState((data.value as { visible: boolean }).visible);
      } else {
        // Default to true only if no setting exists in DB
        setThemeToggleVisibleState(true);
      }
    } catch (err) {
      console.error('Error fetching theme settings:', err);
      setThemeToggleVisibleState(true);
    }
    setLoading(false);
  };

  const refetchSettings = async () => {
    await fetchSettings();
  };

  const setThemeToggleVisible = async (visible: boolean) => {
    setThemeToggleVisibleState(visible);

    // Try to update existing record
    const { error: updateError } = await supabase
      .from('system_settings')
      .update({ 
        value: { visible },
        updated_at: new Date().toISOString()
      })
      .eq('key', 'theme_toggle_visible');

    // If no record exists, insert one
    if (updateError) {
      await supabase
        .from('system_settings')
        .insert({
          key: 'theme_toggle_visible',
          value: { visible }
        });
    }
  };

  return (
    <ThemeSettingsContext.Provider value={{ 
      themeToggleVisible: themeToggleVisible ?? true, 
      loading, 
      setThemeToggleVisible,
      refetchSettings
    }}>
      {children}
    </ThemeSettingsContext.Provider>
  );
}

export function useThemeSettings() {
  const context = useContext(ThemeSettingsContext);
  if (context === undefined) {
    throw new Error('useThemeSettings must be used within a ThemeSettingsProvider');
  }
  return context;
}
