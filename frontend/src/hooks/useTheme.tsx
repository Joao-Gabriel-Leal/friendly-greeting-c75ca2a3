import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [initialized, setInitialized] = useState(false);

  // Check if theme toggle is enabled and set initial theme
  useEffect(() => {
    const initializeTheme = async () => {
      // First check if toggle is enabled
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'theme_toggle_visible')
        .maybeSingle();

      const toggleEnabled = data?.value && typeof data.value === 'object' && 'visible' in data.value
        ? (data.value as { visible: boolean }).visible
        : true;

      if (!toggleEnabled) {
        // Force light mode when toggle is disabled
        setThemeState('light');
        localStorage.removeItem('theme');
      } else {
        // Use stored preference if toggle is enabled
        const stored = localStorage.getItem('theme') as Theme;
        if (stored) {
          setThemeState(stored);
        } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setThemeState('dark');
        }
      }
      setInitialized(true);
    };

    initializeTheme();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme, initialized]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
