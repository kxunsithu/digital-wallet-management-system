// app/auth/verify-pin.tsx
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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { verifyPin, clearPendingAuthRoute } from '../../services/auth';
import AppLogo from '../../components/AppLogo';

export default function VerifyPinScreen() {
  const params = useLocalSearchParams();
  const userId = Number(params.user_id || params.userId || 0);
  
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showPin, setShowPin] = useState(false);
  
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing user ID' });
      return;
    }

    if (!pin.trim() || pin.length !== 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be exactly 4 digits' });
      return;
    }

    setLoading(true);
    const response = await verifyPin(userId, pin, 'mobile-app');
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      Toast.show({ type: 'success', text1: 'Welcome Back', text2: 'You are now signed in.' });
      await clearPendingAuthRoute();
      router.replace('/');
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: response.body?.message ?? 'Invalid PIN' });
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={isDark ? 'flex-1 bg-background' : 'flex-1 bg-white'}
    >
      <View className={`flex-row items-center justify-between px-6 pt-12 pb-4 ${isDark ? 'bg-background' : 'bg-white'}`}>
        <TouchableOpacity 
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-full ${
            isDark ? 'bg-surface' : 'bg-slate-100'
          }`}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0A0B09'} />
        </TouchableOpacity>
        <Text className={isDark ? 'text-text font-medium' : 'text-gray-900 font-medium'}>
          Verify PIN
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-surface border-border' : 'bg-white border-slate-200'}`}>
            <View className="items-center mb-6">
              <View className="scale-75">
                <AppLogo />
              </View>
            </View>

            <View className="w-full mb-6">
              <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
                Verify Security PIN
              </Text>
              <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
                Please enter your 4-digit PIN to authenticate
              </Text>
            </View>

            <View className="w-full mb-6">
              <View className="flex-row items-center relative">
                <View className="absolute left-4 z-10">
                  <Feather 
                    name="lock" 
                    size={20} 
                    color={isFocused ? '#D5E726' : (isDark ? '#6B7280' : '#9CA3AF')} 
                  />
                </View>
                <TextInput
                  placeholder="• • • •"
                  placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                  className={`w-full bg-surface text-text p-4 rounded-xl border text-base text-center font-bold tracking-widest pl-12 pr-12 ${
                    isFocused ? 'border-primary' : (isDark ? 'border-border' : 'border-slate-200')
                  } ${isDark ? 'bg-surface text-text' : 'bg-slate-50 text-black'}`}
                  value={pin}
                  onChangeText={setPin}
                  maxLength={4}
                  secureTextEntry={!showPin}
                  keyboardType="number-pad"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  editable={!loading}
                  autoFocus
                />
                <TouchableOpacity
                  className="absolute right-4 z-10"
                  onPress={() => setShowPin((prev) => !prev)}
                  activeOpacity={0.7}
                >
                  <Feather
                    name={showPin ? 'eye' : 'eye-off'}
                    size={20}
                    color={isDark ? '#D5E726' : '#6B7280'}
                  />
                </TouchableOpacity>
              </View>
              <Text className={`text-xs mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'} text-center`}>
                Enter your secure wallet PIN
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
                  <Text className="text-secondary font-semibold text-base mr-2">
                    Sign In
                  </Text>
                  <Feather name="log-in" size={20} color="#10110E" />
                </View>
              )}
            </TouchableOpacity>

            <View className="flex-row items-center justify-center mt-6">
              <Feather name="lock" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <Text className={`text-xs ml-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'}`}>
                Your PIN is encrypted and secure
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}