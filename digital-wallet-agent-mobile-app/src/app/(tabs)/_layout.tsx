// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';

function TabIcon({
  name,
  label,
  focused,
  isDark,
  primaryColor,
}: {
  name: string;
  label: string;
  focused: boolean;
  isDark: boolean;
  primaryColor: string;
}) {
  const activeColor = primaryColor;
  const inactiveColor = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.30)';

  return (
    <View style={styles.iconBox}>
      <Ionicons
        name={name as any}
        size={23}
        color={focused ? activeColor : inactiveColor}
      />
      <Text
        style={[
          styles.label,
          { color: focused ? activeColor : inactiveColor },
          focused && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const tabBarBg = isDark ? colors.surface : '#FFFFFF';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 82 : 66,
          backgroundColor: tabBarBg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: borderColor,
          paddingTop: 0,
          paddingBottom: Platform.OS === 'ios' ? 20 : 6,
          elevation: 0,
          shadowOpacity: 0,
        },
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
          paddingTop: 0,
          paddingBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              label="Home"
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="transactions"
        options={{
          title: 'History',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'document-text' : 'document-text-outline'}
              label="History"
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="partner-services"
        options={{
          title: 'Partner Services',
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'storefront' : 'storefront-outline'}
              label="Services"
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
              label="Profile"
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 2,
    minWidth: 60,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '700',
  },

});