import { ThemeToggle } from '@/components/ThemeToggle';
import { useThemeSettings } from '@/hooks/useThemeSettings';

export function ConditionalThemeToggle() {
  const { themeToggleVisible, loading } = useThemeSettings();

  if (loading || !themeToggleVisible) {
    return null;
  }

  return <ThemeToggle />;
}
