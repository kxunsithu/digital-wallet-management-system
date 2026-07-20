// app/auth/verify-pin.tsx
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useState } from 'react';
import { verifyPin } from '../../services/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/AppLogo';
import { Feather } from '@expo/vector-icons';

export default function VerifyPinScreen() {
  const params = useLocalSearchParams();
  const userId = Number(params.user_id || params.userId || 0);
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  const containerClass = isDark 
    ? 'flex-1 bg-background' 
    : 'flex-1 bg-white';
  
  const inputClass = isDark 
    ? 'w-full bg-surface text-text p-4 rounded-xl border text-base text-center font-bold tracking-widest' 
    : 'w-full bg-slate-50 text-black p-4 rounded-xl border text-base text-center font-bold tracking-widest';

  const borderClass = isFocused 
    ? 'border-primary' 
    : (isDark ? 'border-border' : 'border-slate-200');

  async function onSubmit() {
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing user ID' });
      return;
    }
    if (!pin.trim() || pin.length !== 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be exactly 4 digits' });
      return;
    }
    setLoading(true);
    const res = await verifyPin(userId, pin, 'mobile-app');
    setLoading(false);
    if (res.status === 200 && res.body?.success) {
      Toast.show({ type: 'success', text1: 'Welcome Back', text2: 'You are now signed in.' });
      router.replace('/');
      return;
    }

    Toast.show({ type: 'error', text1: 'Error', text2: res.body?.message ?? 'Invalid PIN' });
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerClass}
    >
      <View className="flex-row items-center justify-between px-6 pt-12 pb-2">
        <TouchableOpacity 
          onPress={() => router.back()}
          className={`w-10 h-10 items-center justify-center rounded-full ${isDark ? 'bg-surface' : 'bg-slate-100'}`}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={isDark ? '#FFFFFF' : '#0A0B09'} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-6">
          <AppLogo />

          <View className="w-full mb-8">
            <Text className={`text-2xl font-semibold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
              Verify Security PIN
            </Text>
            <Text className={`text-center mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base`}>
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
                className={`${inputClass} ${borderClass} pl-12`}
                value={pin}
                onChangeText={setPin}
                maxLength={4}
                secureTextEntry
                keyboardType="number-pad"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                editable={!loading}
                autoFocus
              />
            </View>
            <Text className={`text-xs mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'} text-center`}>
              Enter your secure wallet PIN
            </Text>
          </View>

          <TouchableOpacity
            className={`w-full py-4 rounded-xl ${loading ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#D5E726' }}
            onPress={onSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center justify-center">
              {loading ? (
                <View className="flex-row items-center">
                  <Text className="text-secondary font-semibold text-base mr-2">Verifying...</Text>
                  <View className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                </View>
              ) : (
                <>
                  <Text className="text-secondary font-semibold text-base mr-2">Sign In</Text>
                  <Feather name="log-in" size={20} color="#10110E" />
                </>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}