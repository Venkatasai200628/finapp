import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';

type ThemeMode = 'dark' | 'light';

type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: () => void;
  phoneView: boolean;
  togglePhoneView: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  toggleTheme: () => {},
  phoneView: false,
  togglePhoneView: () => {},
});

const LIGHT_THEME_CSS = `
  body.light-theme, #root.light-theme {
    background-color: #F8F9FA !important;
    color: #0F172A !important;
  }
  .light-theme [style*="background-color: rgb(5, 5, 5)"],
  .light-theme [style*="background-color: #050505"] {
    background-color: #F8F9FA !important;
  }
  .light-theme [style*="background-color: rgb(10, 10, 10)"],
  .light-theme [style*="background-color: #0A0A0A"],
  .light-theme [style*="background-color: rgb(12, 12, 12)"],
  .light-theme [style*="background-color: #0C0C0C"] {
    background-color: #FFFFFF !important;
  }
  .light-theme [style*="background-color: rgb(17, 17, 17)"],
  .light-theme [style*="background-color: #111111"] {
    background-color: #FFFFFF !important;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important;
  }
  .light-theme [style*="background-color: rgb(24, 24, 24)"],
  .light-theme [style*="background-color: #181818"],
  .light-theme [style*="background-color: rgb(20, 20, 20)"],
  .light-theme [style*="background-color: #141414"],
  .light-theme [style*="background-color: rgb(28, 28, 28)"],
  .light-theme [style*="background-color: #1C1C1C"] {
    background-color: #F1F3F5 !important;
  }
  .light-theme [style*="color: rgb(255, 255, 255)"],
  .light-theme [style*="color: #FFFFFF"],
  .light-theme [style*="color: #fff"] {
    color: #0F172A !important;
  }
  .light-theme [style*="color: rgb(153, 153, 153)"],
  .light-theme [style*="color: #999999"] {
    color: #475569 !important;
  }
  .light-theme [style*="color: rgb(92, 92, 92)"],
  .light-theme [style*="color: #5C5C5C"] {
    color: #64748B !important;
  }
  .light-theme [style*="border-color: rgba(255, 255, 255"],
  .light-theme [style*="border-top-color: rgba(255, 255, 255"],
  .light-theme [style*="border-bottom-color: rgba(255, 255, 255"],
  .light-theme [style*="border-left-color: rgba(255, 255, 255"],
  .light-theme [style*="border-right-color: rgba(255, 255, 255"] {
    border-color: rgba(0, 0, 0, 0.08) !important;
  }
`;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [phoneView, setPhoneView] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      let styleEl = document.getElementById('fin-theme-styles');
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'fin-theme-styles';
        styleEl.textContent = LIGHT_THEME_CSS;
        document.head.appendChild(styleEl);
      }

      if (theme === 'light') {
        document.body.classList.add('light-theme');
        const root = document.getElementById('root');
        if (root) root.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
        const root = document.getElementById('root');
        if (root) root.classList.remove('light-theme');
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const togglePhoneView = () => {
    setPhoneView((prev) => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, phoneView, togglePhoneView }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}