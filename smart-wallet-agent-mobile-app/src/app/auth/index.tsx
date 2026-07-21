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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const STEPS = ['Phone', 'OTP', 'PIN'];

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
        text2: response.body?.message ?? 'Could not request OTP',
      });
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Gradient Hero */}
          <LinearGradient
            colors={['#D5E726', '#A8B81A']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24 }}
          >
            {/* Logo / App Name */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                width: 52, height: 52,
                borderRadius: 16,
                backgroundColor: 'rgba(0,0,0,0.15)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Feather name="zap" size={26} color="#000" />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: '#0A0B09', letterSpacing: -0.5 }}>
                Smart Wallet
              </Text>
              <Text style={{ fontSize: 14, color: 'rgba(0,0,0,0.6)', marginTop: 2 }}>
                Agent Portal
              </Text>
            </View>

            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {STEPS.map((step, i) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: i === 0 ? '#0A0B09' : 'rgba(0,0,0,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i === 0
                      ? <Feather name="phone" size={13} color="#D5E726" />
                      : <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)' }}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={{
                    fontSize: 12, fontWeight: i === 0 ? '700' : '500',
                    color: i === 0 ? '#0A0B09' : 'rgba(0,0,0,0.5)',
                    marginLeft: 6,
                  }}>
                    {step}
                  </Text>
                  {i < STEPS.length - 1 && (
                    <View style={{
                      width: 24, height: 1.5,
                      backgroundColor: 'rgba(0,0,0,0.2)',
                      marginHorizontal: 8,
                    }} />
                  )}
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Form Card */}
          <View style={{
            flex: 1,
            paddingHorizontal: 24,
            paddingTop: 32,
          }}>
            <Text style={{
              fontSize: 22, fontWeight: '800',
              color: isDark ? '#FFFFFF' : '#0A0B09',
              letterSpacing: -0.5,
              marginBottom: 6,
            }}>
              Welcome Back 👋
            </Text>
            <Text style={{
              fontSize: 14,
              color: isDark ? '#9CA3AF' : '#6B7280',
              marginBottom: 28,
              lineHeight: 20,
            }}>
              Enter your registered phone number to{'\n'}receive a one-time verification code.
            </Text>

            {/* Phone Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 11, fontWeight: '600',
                color: isDark ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                marginBottom: 8,
              }}>
                Phone Number
              </Text>
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 16,
                borderWidth: 1.5,
                borderColor: isFocused ? '#D5E726' : (isDark ? '#2F332B' : '#E2E8F0'),
                backgroundColor: isDark ? '#161814' : '#FFFFFF',
                paddingHorizontal: 16,
              }}>
                <View style={{
                  paddingRight: 12,
                  borderRightWidth: 1,
                  borderRightColor: isDark ? '#2F332B' : '#E2E8F0',
                  marginRight: 12,
                  paddingVertical: 16,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#D5E726' : '#475569' }}>
                    🇲🇲 +95
                  </Text>
                </View>
                <TextInput
                  placeholder="09xxxxxxxx"
                  placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    fontSize: 16,
                    fontWeight: '500',
                    color: isDark ? '#FFFFFF' : '#0A0B09',
                  }}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  editable={!loading}
                  autoFocus
                />
              </View>
              <Text style={{
                fontSize: 11,
                color: isDark ? '#6B7280' : '#9CA3AF',
                marginTop: 6,
                marginLeft: 4,
              }}>
                We'll send a 6-digit OTP to this number
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient
                colors={loading ? ['#B0BC1A', '#B0BC1A'] : ['#D5E726', '#C4D420']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 16,
                  borderRadius: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#0A0B09" size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0B09', marginRight: 8 }}>
                      Send OTP
                    </Text>
                    <Feather name="arrow-right" size={18} color="#0A0B09" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: isDark ? '#4B5563' : '#9CA3AF', textAlign: 'center' }}>
                By continuing, you agree to our{' '}
                <Text style={{ color: '#D5E726' }}>Terms of Service</Text>
                {'\n'}and{' '}
                <Text style={{ color: '#D5E726' }}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}