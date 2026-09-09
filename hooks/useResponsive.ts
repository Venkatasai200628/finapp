import { useWindowDimensions } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export const SIDEBAR_WIDTH = 228;
export const DESKTOP_BREAKPOINT = 900;
export const CONTENT_MAX_WIDTH = 1040;
export const TWO_COL_BREAKPOINT = 760;

export function useResponsive() {
  const { phoneView } = useTheme();
  const window = useWindowDimensions();

  // If in phone mode or screen is small, enforce strictly mobile layout!
  const isPhoneMode = phoneView || window.width < DESKTOP_BREAKPOINT;
  const isDesktop = !isPhoneMode;
  const twoCol = !isPhoneMode && window.width >= TWO_COL_BREAKPOINT;
  const width = isPhoneMode ? 420 : window.width;
  const contentWidth = isPhoneMode
    ? 388
    : Math.min(width - (isDesktop ? SIDEBAR_WIDTH : 0), CONTENT_MAX_WIDTH) - 32;

  return { isDesktop, twoCol, width, contentWidth, isPhone: isPhoneMode };
}
