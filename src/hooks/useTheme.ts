import { useState, useEffect, useCallback } from 'react';
import { 
  ThemeMode, 
  getSavedTheme, 
  saveThemePreference, 
  applyTheme, 
  getResolvedTheme 
} from '../services/themeService';

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>(() => getSavedTheme());
  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>(() => getResolvedTheme(getSavedTheme()));

  // Listen to system changes if theme is set to 'system'
  useEffect(() => {
    applyTheme(theme);
    setResolvedTheme(getResolvedTheme(theme));

    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
        setResolvedTheme(getResolvedTheme('system'));
      }
    };

    try {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    saveThemePreference(newTheme);
    setResolvedTheme(getResolvedTheme(newTheme));
  }, []);

  return {
    theme,
    resolvedTheme,
    setTheme
  };
}
