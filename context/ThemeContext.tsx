import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { darkColors, lightColors } from '../constants/theme';

type ThemeMode = 'dark' | 'light';

type ThemeContextType = {
  theme: ThemeMode;
  colors: typeof darkColors;
  toggleTheme: () => void;
  phoneView: boolean;
  togglePhoneView: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: 'dark',
  colors: darkColors,
  toggleTheme: () => {},
  phoneView: false,
  togglePhoneView: () => {},
});

function injectOrUpdateThemeStyles() {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;

  let styleEl = document.getElementById('fin-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'fin-theme-styles';
    document.head.appendChild(styleEl);
  }

  // Scan react-native-stylesheet for compiled rules
  let rnwOverrides = '';
  const rnwSheet = document.getElementById('react-native-stylesheet') as HTMLStyleElement | null;
  if (rnwSheet && rnwSheet.sheet) {
    try {
      const rules = rnwSheet.sheet.cssRules;
      for (let i = 0; i < rules.length; i++) {
        const rule = rules[i] as CSSStyleRule;
        if (!rule.selectorText || !rule.cssText) continue;
        const text = rule.cssText;

        // Never override accent orange (#FF6A00 / rgb(255,106,0))
        if (text.includes('255,106,0') || text.includes('255, 106, 0') || text.includes('ff6a00') || text.includes('FF6A00')) {
          continue;
        }

        // Dark background -> Pure white background in light theme
        if (
          text.includes('background-color:rgba(0,0,0,1') ||
          text.includes('background-color:rgba(5,5,5,1') ||
          text.includes('background-color:rgba(8,8,8,1') ||
          text.includes('background-color:rgba(10,10,10,1') ||
          text.includes('background-color:rgba(12,12,12,1') ||
          text.includes('background-color:rgba(14,14,14,1') ||
          text.includes('background-color:rgba(17,17,17,1') ||
          text.includes('background-color:rgba(20,20,20,1')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText} { background-color: #FFFFFF !important; }\n`;
        } else if (
          text.includes('background-color:rgba(24,24,24,1') ||
          text.includes('background-color:rgba(28,28,28,1') ||
          text.includes('background-color:rgba(31,31,31,1') ||
          text.includes('background-color:rgba(34,34,34,1')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText} { background-color: #F3F4F6 !important; }\n`;
        }

        // White text -> Black text in light theme
        if (text.includes('color:rgba(255,255,255,1')) {
          rnwOverrides += `.light-theme ${rule.selectorText} { color: #000000 !important; }\n`;
        } else if (
          text.includes('color:rgba(153,153,153,1') ||
          text.includes('color:rgba(92,92,92,1') ||
          text.includes('color:rgba(102,102,102,1')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText} { color: #4B5563 !important; }\n`;
        }

        // White borders -> Subtle dark borders in light theme
        if (text.includes('border-bottom-color:rgba(255,255,255') || text.includes('border-color:rgba(255,255,255')) {
          rnwOverrides += `.light-theme ${rule.selectorText} { border-color: rgba(0,0,0,0.08) !important; }\n`;
        }
      }
    } catch {}
  }

  styleEl.textContent = `
    /* DARK MODE: completely black background, white text */
    body:not(.light-theme), #root:not(.light-theme) {
      background-color: #000000 !important;
      color: #FFFFFF !important;
    }
    body:not(.light-theme) div {
      border-color: rgba(255, 255, 255, 0.08);
    }

    /* LIGHT MODE: completely white background, black text, orange mix */
    body.light-theme, #root.light-theme {
      background-color: #FFFFFF !important;
      color: #000000 !important;
    }
    .light-theme div:not([style*="color"]):not([style*="background"]) {
      color: #000000;
    }
    .light-theme input, .light-theme textarea {
      color: #000000 !important;
      background-color: #F9FAFB !important;
      border-color: rgba(0, 0, 0, 0.12) !important;
    }

    /* Attribute-based fallback overrides for Light Mode */
    .light-theme [style*="background-color: rgb(0, 0, 0)"],
    .light-theme [style*="background-color: #000000"],
    .light-theme [style*="background-color: rgb(5, 5, 5)"],
    .light-theme [style*="background-color: #050505"],
    .light-theme [style*="background-color: rgb(8, 8, 8)"],
    .light-theme [style*="background-color: #080808"],
    .light-theme [style*="background-color: rgb(10, 10, 10)"],
    .light-theme [style*="background-color: #0A0A0A"],
    .light-theme [style*="background-color: rgb(12, 12, 12)"],
    .light-theme [style*="background-color: #0C0C0C"],
    .light-theme [style*="background-color: rgb(17, 17, 17)"],
    .light-theme [style*="background-color: #111111"],
    .light-theme [style*="background-color: rgb(20, 20, 20)"],
    .light-theme [style*="background-color: #141414"] {
      background-color: #FFFFFF !important;
    }

    .light-theme [style*="background-color: rgb(24, 24, 24)"],
    .light-theme [style*="background-color: #181818"],
    .light-theme [style*="background-color: rgb(28, 28, 28)"],
    .light-theme [style*="background-color: #1C1C1C"],
    .light-theme [style*="background-color: rgb(31, 31, 31)"],
    .light-theme [style*="background-color: #1F1F1F"],
    .light-theme [style*="background-color: rgb(34, 34, 34)"],
    .light-theme [style*="background-color: #222222"] {
      background-color: #F3F4F6 !important;
    }

    .light-theme [style*="color: rgb(255, 255, 255)"],
    .light-theme [style*="color: #FFFFFF"],
    .light-theme [style*="color: #fff"] {
      color: #000000 !important;
    }

    .light-theme [style*="color: rgb(153, 153, 153)"],
    .light-theme [style*="color: #999999"] {
      color: #4B5563 !important;
    }

    .light-theme [style*="color: rgb(92, 92, 92)"],
    .light-theme [style*="color: #5C5C5C"],
    .light-theme [style*="color: rgb(102, 102, 102)"],
    .light-theme [style*="color: #666666"] {
      color: #6B7280 !important;
    }

    .light-theme [style*="border-color: rgba(255, 255, 255"],
    .light-theme [style*="border-top-color: rgba(255, 255, 255"],
    .light-theme [style*="border-bottom-color: rgba(255, 255, 255"],
    .light-theme [style*="border-left-color: rgba(255, 255, 255"],
    .light-theme [style*="border-right-color: rgba(255, 255, 255"] {
      border-color: rgba(0, 0, 0, 0.08) !important;
    }

    /* Orange accent: preserved across both dark & light themes */
    .light-theme [style*="background-color: rgb(255, 106, 0)"],
    .light-theme [style*="background-color: #FF6A00"],
    .light-theme [style*="background-color: #ff6a00"] {
      background-color: #FF6A00 !important;
    }
    .light-theme [style*="background-color: rgb(255, 106, 0)"] *,
    .light-theme [style*="background-color: #FF6A00"] *,
    .light-theme [style*="background-color: #ff6a00"] * {
      color: #FFFFFF !important;
    }

    /* Dynamic React Native Web overrides */
    ${rnwOverrides}
  `;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [phoneView, setPhoneView] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      injectOrUpdateThemeStyles();

      if (theme === 'light') {
        document.body.classList.add('light-theme');
        const root = document.getElementById('root');
        if (root) root.classList.add('light-theme');
      } else {
        document.body.classList.remove('light-theme');
        const root = document.getElementById('root');
        if (root) root.classList.remove('light-theme');
      }

      // Re-scan after short delay to catch any late-injected component styles
      const timer = setTimeout(injectOrUpdateThemeStyles, 300);
      return () => clearTimeout(timer);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const togglePhoneView = () => {
    setPhoneView((prev) => !prev);
  };

  const activeColors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors: activeColors, toggleTheme, phoneView, togglePhoneView }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}