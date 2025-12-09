import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeSettings } from '@/hooks/useThemeSettings';

export function ConditionalThemeToggle() {
  const { themeToggleVisible, loading } = useThemeSettings();

  console.log('[ConditionalThemeToggle] loading:', loading, 'visible:', themeToggleVisible);

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
