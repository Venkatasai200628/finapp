import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../constants/theme';

export default function ScreenGlow() {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[colors.glow1, 'transparent']}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.75, y: 0.6 }}
        style={styles.topLeft}
      />
      <LinearGradient
        colors={[colors.glow2, 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.25, y: 0.75 }}
        style={styles.topRight}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  topLeft: {
    position: 'absolute',
    top: -80,
    left: -60,
    width: 340,
    height: 340,
    borderRadius: 170,
  },
  topRight: {
    position: 'absolute',
    top: 40,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
  },
});
