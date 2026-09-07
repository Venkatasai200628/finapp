import { useWindowDimensions } from 'react-native';

export const SIDEBAR_WIDTH = 228;
export const DESKTOP_BREAKPOINT = 900;
export const CONTENT_MAX_WIDTH = 1040;
export const TWO_COL_BREAKPOINT = 760;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const twoCol = width >= TWO_COL_BREAKPOINT;
  const contentWidth = Math.min(width - (isDesktop ? SIDEBAR_WIDTH : 0), CONTENT_MAX_WIDTH) - 32;
  return { isDesktop, twoCol, width, contentWidth };
}
