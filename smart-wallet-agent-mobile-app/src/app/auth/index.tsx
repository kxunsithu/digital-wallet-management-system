// app/auth/index.tsx
import { useState } from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { requestOtp, setPendingAuthRoute } from '../../services/auth';
import AppLogo from '../../components/AppLogo';

export default function RequestOtpScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your phone number' });
      return;
    }

    setLoading(true);
    const response = await requestOtp(trimmedPhone);
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      const expiresAt = response.body?.data?.expires_at ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
      await setPendingAuthRoute({
        path: '/auth/verify-otp',
        params: { phone: trimmedPhone, expiresAt },
        expiresAt,
      });
      Toast.show({ type: 'success', text1: 'OTP Sent', text2: 'A code has been sent to your phone' });
      router.push({ pathname: '/auth/verify-otp', params: { phone: trimmedPhone, expiresAt } });
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed', 
        text2: response.body?.message ?? 'Could not request OTP' 
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={isDark ? 'flex-1 bg-background' : 'flex-1 bg-white'}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-12">
          <AppLogo />

          <View className="w-full mb-8 mt-4">
            <Text className={`text-2xl font-semibold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
              Welcome Back
            </Text>
            <Text className={`text-center mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base`}>
              Enter your phone number to continue
            </Text>
          </View>

          <View className="w-full mb-6">
            <View className="flex-row items-center relative">
              <View className="absolute left-4 z-10">
                <Feather 
                  name="phone" 
                  size={20} 
                  color={isFocused ? '#D5E726' : (isDark ? '#6B7280' : '#9CA3AF')} 
                />
              </View>
              <TextInput
                placeholder="09xxxxxxxx"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                className={`w-full bg-surface text-text p-4 rounded-xl border text-base pl-12 ${
                  isFocused ? 'border-primary' : (isDark ? 'border-border' : 'border-slate-200')
                } ${isDark ? 'bg-surface text-text' : 'bg-slate-50 text-black'}`}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={!loading}
              />
            </View>
            <Text className={`text-xs mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'} ml-1`}>
              Enter your registered phone number
            </Text>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl ${loading ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#D5E726' }}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#10110E" size="small" />
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className="text-secondary font-semibold text-base mr-2">Continue</Text>
                <Feather name="arrow-right" size={20} color="#10110E" />
              </View>
            )}
          </TouchableOpacity>

          <View className="mt-8">
            <Text className={`text-xs text-center ${isDark ? 'text-textSecondary/50' : 'text-gray-400'}`}>
              By continuing, you agree to our Terms of Service
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}