import { useEffect } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeSettings } from '@/hooks/useThemeSettings';

export function ConditionalThemeToggle() {
  const { themeToggleVisible, loading, refetchSettings } = useThemeSettings();

  // Refetch settings on mount to ensure we have the latest value after page refresh
  useEffect(() => {
    refetchSettings();
  }, []);

  // Don't show anything while loading to prevent flash
  if (loading) {
    return null;
  }

  // Only show if explicitly enabled
  if (!themeToggleVisible) {
    return null;
  }

  return <ThemeToggle />;
}
