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
  const { theme, colors } = useTheme();
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
      style={{ flex: 1, backgroundColor: colors.background }}
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
            colors={[colors.primary, `${colors.primary}CC`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24 }}
          >
            {/* Logo / App Name */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                width: 52, height: 52,
                borderRadius: 16,
                backgroundColor: `${colors.secondary}26`,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Feather name="zap" size={26} color={colors.secondary} />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.secondary, letterSpacing: -0.5 }}>
                Smart Wallet
              </Text>
              <Text style={{ fontSize: 14, color: `${colors.secondary}99`, marginTop: 2 }}>
                Agent Portal
              </Text>
            </View>

            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {STEPS.map((step, i) => (
                <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 28, height: 28, borderRadius: 14,
                    backgroundColor: i === 0 ? colors.secondary : `${colors.secondary}33`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i === 0
                      ? <Feather name="phone" size={13} color={colors.primary} />
                      : <Text style={{ fontSize: 11, fontWeight: '700', color: `${colors.secondary}80` }}>{i + 1}</Text>
                    }
                  </View>
                  <Text style={{
                    fontSize: 12, fontWeight: i === 0 ? '700' : '500',
                    color: i === 0 ? colors.secondary : `${colors.secondary}80`,
                    marginLeft: 6,
                  }}>
                    {step}
                  </Text>
                  {i < STEPS.length - 1 && (
                    <View style={{
                      width: 24, height: 1.5,
                      backgroundColor: `${colors.secondary}33`,
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
              color: colors.text,
              letterSpacing: -0.5,
              marginBottom: 6,
            }}>
              Welcome Back 👋
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 28,
              lineHeight: 20,
            }}>
              Enter your registered phone number to{'\n'}receive a one-time verification code.
            </Text>

            {/* Phone Input */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{
                fontSize: 11, fontWeight: '600',
                color: colors.textSecondary,
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
                borderColor: isFocused ? colors.primary : colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}>
                <View style={{
                  paddingRight: 12,
                  borderRightWidth: 1,
                  borderRightColor: colors.border,
                  marginRight: 12,
                  paddingVertical: 16,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.primary }}>
                    🇲🇲 +95
                  </Text>
                </View>
                <TextInput
                  placeholder="09xxxxxxxx"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1,
                    paddingVertical: 16,
                    fontSize: 16,
                    fontWeight: '500',
                    color: colors.text,
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
                color: colors.textSecondary,
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
                colors={loading ? [`${colors.primary}99`, `${colors.primary}99`] : [colors.primary, `${colors.primary}CC`]}
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
                  <ActivityIndicator color={colors.secondary} size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.secondary, marginRight: 8 }}>
                      Send OTP
                    </Text>
                    <Feather name="arrow-right" size={18} color={colors.secondary} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Terms */}
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontSize: 11, color: colors.textSecondary, textAlign: 'center' }}>
                By continuing, you agree to our{' '}
                <Text style={{ color: colors.primary }}>Terms of Service</Text>
                {'\n'}and{' '}
                <Text style={{ color: colors.primary }}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}