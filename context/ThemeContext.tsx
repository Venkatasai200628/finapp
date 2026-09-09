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
        const norm = text.replace(/\s+/g, '');

        // NEVER touch transparent backgrounds (opacity 0)
        if (
          norm.includes('rgba(0,0,0,0)') ||
          norm.includes('rgba(0,0,0,0.00)') ||
          norm.includes('transparent')
        ) {
          continue;
        }

        // Never override accent orange (#FF6A00 / rgb(255,106,0))
        if (norm.includes('255,106,0') || norm.includes('ff6a00') || norm.includes('FF6A00')) {
          continue;
        }

        // Dark background -> Pure white background in light theme (ONLY solid backgrounds)
        if (
          norm.includes('background-color:rgba(0,0,0,1') ||
          norm.includes('background-color:rgb(0,0,0)') ||
          norm.includes('background-color:#000000') ||
          norm.includes('background-color:rgba(10,10,10,1') ||
          norm.includes('background-color:rgb(10,10,10)') ||
          norm.includes('background-color:rgba(18,18,18,1') ||
          norm.includes('background-color:rgb(18,18,18)') ||
          norm.includes('background-color:rgba(21,21,21,1') ||
          norm.includes('background-color:rgb(21,21,21)')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText}:not([data-orange="true"]):not(.fin-orange) { background-color: #FFFFFF !important; }\n`;
        } else if (
          norm.includes('background-color:rgba(24,24,24,1') ||
          norm.includes('background-color:rgba(30,30,30,1') ||
          norm.includes('background-color:rgba(38,38,38,1') ||
          norm.includes('background-color:rgba(48,48,48,1')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText}:not([data-orange="true"]):not(.fin-orange) { background-color: #F3F4F6 !important; }\n`;
        }

        // White text -> Black text in light theme, BUT NEVER on orange elements!
        if (
          norm.includes('color:rgba(255,255,255,1') ||
          norm.includes('color:rgb(255,255,255)') ||
          norm.includes('color:#ffffff') ||
          norm.includes('color:#fff')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText}:not([data-orange="true"]):not([data-orange="true"] *):not(.fin-orange):not(.fin-orange *) { color: #000000 !important; }\n`;
        } else if (
          norm.includes('color:rgba(160,160,160') ||
          norm.includes('color:rgba(112,112,112') ||
          norm.includes('color:rgba(153,153,153') ||
          norm.includes('color:rgba(102,102,102')
        ) {
          rnwOverrides += `.light-theme ${rule.selectorText}:not([data-orange="true"]):not([data-orange="true"] *):not(.fin-orange):not(.fin-orange *) { color: #4B5563 !important; }\n`;
        }

        // White borders -> Subtle dark borders in light theme
        if (norm.includes('border-color:rgba(255,255,255') || norm.includes('border-bottom-color:rgba(255,255,255')) {
          rnwOverrides += `.light-theme ${rule.selectorText}:not([data-orange="true"]) { border-color: rgba(0,0,0,0.08) !important; }\n`;
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

    /* LIGHT MODE: completely white background, black text */
    body.light-theme, #root.light-theme {
      background-color: #FFFFFF !important;
      color: #000000 !important;
    }
    .light-theme div:not([style*="color"]):not([style*="background"]):not([data-orange="true"]):not([data-orange="true"] *) {
      color: #000000;
    }
    .light-theme input, .light-theme textarea {
      color: #000000 !important;
      background-color: #F9FAFB !important;
      border-color: rgba(0, 0, 0, 0.12) !important;
    }

    /* Fallback solid dark backgrounds -> pure white in Light Mode */
    .light-theme [style*="background-color: rgb(0, 0, 0)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #000000"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(10, 10, 10)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #0A0A0A"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(18, 18, 18)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #121212"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(21, 21, 21)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #151515"]:not([data-orange="true"]) {
      background-color: #FFFFFF !important;
    }

    .light-theme [style*="background-color: rgb(24, 24, 24)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #181818"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(30, 30, 30)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #1E1E1E"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(38, 38, 38)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #262626"]:not([data-orange="true"]),
    .light-theme [style*="background-color: rgb(48, 48, 48)"]:not([data-orange="true"]),
    .light-theme [style*="background-color: #303030"]:not([data-orange="true"]) {
      background-color: #F3F4F6 !important;
    }

    /* ORANGE ACCENTS: GUARANTEED TO REMAIN VIBRANT ORANGE IN BOTH DARK AND LIGHT THEMES */
    .fin-orange,
    [data-orange="true"],
    .r-1xck43y,
    .light-theme .fin-orange,
    .light-theme [data-orange="true"],
    .light-theme .r-1xck43y,
    .light-theme [style*="background-color: rgb(255, 106, 0)"],
    .light-theme [style*="background-color: #FF6A00"],
    .light-theme [style*="background-color: #ff6a00"],
    .light-theme [style*="background-color:#FF6A00"],
    .light-theme [style*="background-color:#ff6a00"] {
      background-color: #FF6A00 !important;
      border-color: #FF6A00 !important;
    }

    /* ALL TEXT AND ICONS ON ORANGE ACCENTS MUST ALWAYS BE CRISP WHITE */
    .fin-orange *,
    [data-orange="true"] *,
    .r-1xck43y *,
    .light-theme .fin-orange *,
    .light-theme [data-orange="true"] *,
    .light-theme .r-1xck43y *,
    .light-theme [style*="background-color: rgb(255, 106, 0)"] *,
    .light-theme [style*="background-color: #FF6A00"] *,
    .light-theme [style*="background-color: #ff6a00"] *,
    .light-theme [style*="background-color:#FF6A00"] *,
    .light-theme [style*="background-color:#ff6a00"] * {
      color: #FFFFFF !important;
      fill: #FFFFFF !important;
    }

    /* Dynamic React Native Web overrides */
    ${rnwOverrides}
  `;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('fin.theme');
      if (saved === 'light' || saved === 'dark') return saved;
    }
    return 'dark';
  });
  const [phoneView, setPhoneView] = useState<boolean>(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('fin.phoneView');
      if (saved === 'false') return false;
      if (saved === 'true') return true;
    }
    // Default to true on web as requested so the mobile experience is front and center
    return true;
  });

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      injectOrUpdateThemeStyles();

      if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.documentElement.classList.add('light-theme');
        document.body.style.backgroundColor = '#FFFFFF';
        document.documentElement.style.backgroundColor = '#FFFFFF';
        const root = document.getElementById('root');
        if (root) {
          root.classList.add('light-theme');
          root.style.backgroundColor = '#FFFFFF';
        }
      } else {
        document.body.classList.remove('light-theme');
        document.documentElement.classList.remove('light-theme');
        document.body.style.backgroundColor = '#000000';
        document.documentElement.style.backgroundColor = '#000000';
        const root = document.getElementById('root');
        if (root) {
          root.classList.remove('light-theme');
          root.style.backgroundColor = '#000000';
        }
      }

      try {
        localStorage.setItem('fin.theme', theme);
      } catch {}

      const timer = setTimeout(injectOrUpdateThemeStyles, 200);
      return () => clearTimeout(timer);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const togglePhoneView = () => {
    setPhoneView((prev) => {
      const next = !prev;
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('fin.phoneView', String(next));
        } catch {}
      }
      return next;
    });
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