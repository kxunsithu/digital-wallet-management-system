// app/auth/_layout.tsx
import { Stack } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../../global.css';

export default function AuthLayout() {
  const { theme, colors, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ position: 'absolute', right: 16, top: 8, zIndex: 10 }}>
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            backgroundColor: `${colors.secondary}26`,
            borderWidth: 1,
            borderColor: `${colors.secondary}33`,
          }}
          accessibilityLabel="Toggle theme"
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={18} color={colors.secondary} />
        </TouchableOpacity>
      </SafeAreaView>
      <Stack 
        screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }} 
      />
    </View>
  );
}