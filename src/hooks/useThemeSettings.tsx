import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ThemeSettingsContextType {
  themeToggleVisible: boolean;
  loading: boolean;
  setThemeToggleVisible: (visible: boolean) => Promise<void>;
}

const ThemeSettingsContext = createContext<ThemeSettingsContextType | undefined>(undefined);

export function ThemeSettingsProvider({ children }: { children: ReactNode }) {
  // Start with false (hidden) until we confirm from DB it should be visible
  const [themeToggleVisible, setThemeToggleVisibleState] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchSettings = useCallback(async () => {
    console.log('[ThemeSettings] Fetching settings...');
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('key', 'theme_toggle_visible')
        .maybeSingle();

      console.log('[ThemeSettings] Data received:', data, 'Error:', error);

      if (!error && data?.value && typeof data.value === 'object' && 'visible' in data.value) {
        const isVisible = (data.value as { visible: boolean }).visible;
        console.log('[ThemeSettings] Setting visible to:', isVisible);
        setThemeToggleVisibleState(isVisible);
      } else {
        // Default to true only if no setting exists in DB
        console.log('[ThemeSettings] No setting found, defaulting to true');
        setThemeToggleVisibleState(true);
      }
    } catch (err) {
      console.error('[ThemeSettings] Error fetching settings:', err);
      setThemeToggleVisibleState(true);
    } finally {
      setLoading(false);
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setThemeToggleVisible = async (visible: boolean) => {
    console.log('[ThemeSettings] Setting theme toggle visible to:', visible);
    setThemeToggleVisibleState(visible);

    // First check if record exists
    const { data: existingData } = await supabase
      .from('system_settings')
      .select('id')
      .eq('key', 'theme_toggle_visible')
      .maybeSingle();

    if (existingData) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('system_settings')
        .update({ 
          value: { visible },
          updated_at: new Date().toISOString()
        })
        .eq('key', 'theme_toggle_visible');

      console.log('[ThemeSettings] Update result, error:', updateError);
    } else {
      // Insert new record
      console.log('[ThemeSettings] No record found, inserting...');
      const { error: insertError } = await supabase
        .from('system_settings')
        .insert({
          key: 'theme_toggle_visible',
          value: { visible }
        });
      
      console.log('[ThemeSettings] Insert result, error:', insertError);
    }
  };

  return (
    <ThemeSettingsContext.Provider value={{ 
      themeToggleVisible, 
      loading: loading || !hasFetched,
      setThemeToggleVisible,
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
