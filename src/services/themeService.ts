export type ThemeMode = 'dark' | 'light' | 'system';

const STORAGE_KEY = 'mockmitra_theme';

export function getResolvedTheme(mode: ThemeMode): 'dark' | 'light' {
  if (mode === 'system') {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  }
  return mode;
}

export function applyTheme(mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const resolved = getResolvedTheme(mode);

  if (resolved === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';
  }
}

export function getSavedTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark' || saved === 'system') {
      return saved;
    }
  } catch (e) {
    console.warn("Could not read theme from localStorage", e);
  }
  return 'dark'; // Dark theme is the default
}

export function saveThemePreference(mode: ThemeMode) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch (e) {
      console.warn("Could not save theme to localStorage", e);
    }
  }
  applyTheme(mode);
}
