import 'react-native';

declare module 'react-native' {
  interface ViewProps {
    dataSet?: Record<string, any>;
  }
  interface PressableProps {
    dataSet?: Record<string, any>;
  }
}
