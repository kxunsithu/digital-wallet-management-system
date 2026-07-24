// app/(tabs)/_layout.tsx
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { Platform, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          borderRadius: 30,
          height: 74,
          borderTopWidth: 0,
          borderWidth: isDark ? 0 : 1,
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.35)',
          backgroundColor: isDark ? 'rgba(10, 14, 24, 0.7)' : 'rgba(255,255,255,0.72)',
          overflow: 'hidden',
          shadowColor: isDark ? colors.primary : '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: isDark ? 0.22 : 0.14,
          shadowRadius: 18,
          elevation: 16,
          paddingBottom: 0,
          paddingTop: 0,
          marginHorizontal: 8,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={isDark ? 30 : 45}
            tint={isDark ? 'dark' : 'light'}
            style={{ flex: 1 }}
          />
        ),
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
          letterSpacing: 0.3,
        },
        tabBarItemStyle: {
          paddingVertical: 10,
          borderRadius: 18,
        },
      }}
    >

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 42, height: 34,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? `${colors.primary}16` : 'transparent',
            }}>
              <Feather name="clock" size={22} color={color} />
            </View>
          ),
        }}
      />

      {/* Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={{
              width: 42, height: 34,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? `${colors.primary}16` : 'transparent',
            }}>
              <Feather name="home" size={22} color={color} />
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
              width: 42, height: 34,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: focused ? `${colors.primary}16` : 'transparent',
            }}>
              <Feather name="user" size={22} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}