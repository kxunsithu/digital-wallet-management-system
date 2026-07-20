// app/auth/_layout.tsx
import { Stack } from 'expo-router';
import { View, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../providers/ThemeProvider';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../../global.css';

export default function AuthLayout() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View className="flex-1 bg-background">
      <SafeAreaView className="absolute right-4 top-4 z-10">
        <TouchableOpacity
          onPress={toggleTheme}
          className="px-3 py-1 rounded"
          accessibilityLabel="Toggle theme"
        >
          <Feather name={isDark ? 'sun' : 'moon'} size={18} color="#D5E726" />
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