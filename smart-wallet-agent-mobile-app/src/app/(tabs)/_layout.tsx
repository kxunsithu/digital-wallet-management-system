// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { View, Platform } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 28 : 20,
          left: 20,
          right: 20,
          borderRadius: 28,
          height: 68,
          backgroundColor: isDark ? '#111210' : '#FFFFFF',
          borderTopWidth: 0,
          shadowColor: isDark ? '#D5E726' : '#000000',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.12 : 0.12,
          shadowRadius: 24,
          elevation: 16,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarActiveTintColor: '#D5E726',
        tabBarInactiveTintColor: isDark ? '#4B5563' : '#94A3B8',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 40, height: 32,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(213,231,38,0.15)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Feather name={focused ? 'home' : 'home'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 40, height: 32,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(213,231,38,0.15)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Feather name="clock" size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 40, height: 32,
              borderRadius: 16,
              backgroundColor: focused ? 'rgba(213,231,38,0.15)' : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Feather name="user" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}