// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

function TabIcon({
  name,
  focused,
  isDark,
  primaryColor,
}: {
  name: string;
  focused: boolean;
  isDark: boolean;
  primaryColor: string;
}) {
  return (
    <View style={styles.iconBox}>
      {focused && (
        <View
          style={[
            styles.activeCircle,
            {
              backgroundColor: isDark
                ? 'rgba(255,255,255,0.09)'
                : '#EBEBEB',
            },
          ]}
        />
      )}
      <Ionicons
        name={name as any}
        size={22}
        color={
          focused
            ? primaryColor
            : isDark
              ? 'rgba(255,255,255,0.30)'
              : '#ADADAD'
        }
      />
    </View>
  );
}

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 36 : 22,
          left: 32,
          right: 32,
          borderRadius: 40,
          height: 64,
          borderTopWidth: 0,
          borderWidth: 0,
          backgroundColor: isDark ? '#1C1F1B' : '#FFFFFF',
          overflow: 'hidden',
          shadowColor: isDark ? '#000' : '#B0B8C1',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: isDark ? 0.55 : 0.35,
          shadowRadius: 20,
          elevation: 16,
          paddingBottom: 0,
          paddingTop: 0,
        },
        // KEY FIX: override React Navigation's internal icon margin
        // that reserves space for the label even when label is hidden
        tabBarIconStyle: {
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: 64,
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'document-text' : 'document-text-outline'}
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconBox: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCircle: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
});