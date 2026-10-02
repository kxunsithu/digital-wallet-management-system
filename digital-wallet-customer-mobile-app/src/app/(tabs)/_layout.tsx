// app/(tabs)/_layout.tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../providers/ThemeProvider';
import { useLanguage } from '../../providers/LanguageProvider';

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
  const { t } = useLanguage();
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
          title: t('nav.home'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'home' : 'home-outline'}
              label={t('nav.home')}
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
          title: t('nav.history'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'document-text' : 'document-text-outline'}
              label={t('nav.history')}
              focused={focused}
              isDark={isDark}
              primaryColor={colors.primary}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="external-systems"
        options={{
          title: t('nav.services'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'storefront' : 'storefront-outline'}
              label={t('nav.services')}
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
          title: t('nav.profile'),
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={focused ? 'person' : 'person-outline'}
              label={t('nav.profile')}
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