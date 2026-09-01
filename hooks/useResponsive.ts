import { useWindowDimensions } from 'react-native';

export const SIDEBAR_WIDTH = 232;
export const DESKTOP_BREAKPOINT = 900;
export const CONTENT_MAX_WIDTH = 860;

export function useResponsive() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  return { isDesktop, width };
}
