import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

export default function ScreenGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.glow1, 'transparent']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.7, y: 0.55 }}
        style={styles.topLeft}
      />
      <LinearGradient
        colors={[colors.glow2, 'transparent']}
        start={{ x: 1, y: 0.1 }}
        end={{ x: 0.3, y: 0.7 }}
        style={styles.topRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topLeft: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  topRight: {
    position: 'absolute',
    top: 80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
});
