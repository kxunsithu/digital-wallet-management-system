// app/auth/forgot-pin.tsx
import { useState } from 'react';
import { 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { forgotPin } from '../../services/auth';
import AppLogo from '../../components/AppLogo';

export default function ForgotPinScreen() {
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
    const response = await forgotPin(trimmedPhone);
    setLoading(false);
    
    if (response.status === 200 && response.body?.success) {
      Toast.show({ 
        type: 'success', 
        text1: 'OTP Sent', 
        text2: 'A verification code has been sent to your phone number.' 
      });
      router.push({ pathname: '/auth/reset-pin', params: { phone: trimmedPhone } });
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Error', 
        text2: response.body?.message ?? 'Failed to send OTP. Please try again.' 
      });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={isDark ? 'flex-1 bg-background' : 'flex-1 bg-white'}
    >
      <View className="flex-row items-center justify-between px-6 pt-12 pb-2">
        <TouchableOpacity 
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? 'bg-surface' : 'bg-slate-100'}`}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0A0B09'} />
        </TouchableOpacity>
        <Text className={isDark ? 'text-text font-medium' : 'text-gray-900 font-medium'}>
          Forgot PIN
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-4">
          <View className="w-full mb-8">
            <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
              Forgot PIN
            </Text>
            <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
              Enter your phone number to receive a verification code
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
                autoFocus
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
                <Text className="text-secondary font-semibold text-base mr-2">Send OTP</Text>
                <Feather name="send" size={20} color="#10110E" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/auth')}
            className="mt-6"
          >
            <Text className={`text-sm ${isDark ? 'text-textSecondary' : 'text-gray-500'}`}>
              Remember your PIN? <Text className="text-primary font-semibold">Sign In</Text>
            </Text>
          </TouchableOpacity>

          <View className="mt-8">
            <Text className={`text-xs text-center ${isDark ? 'text-textSecondary/50' : 'text-gray-400'}`}>
              A verification code will be sent to your registered phone number
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}