import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#0ea5e9' }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <Ionicons name="home" size={24} color={color} /> }} />
      <Tabs.Screen name="finance" options={{ title: 'Finance', tabBarIcon: ({ color }) => <Ionicons name="wallet" size={24} color={color} /> }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarIcon: ({ color }) => <Ionicons name="bar-chart" size={24} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <Ionicons name="settings" size={24} color={color} /> }} />
    </Tabs>
  );
}
