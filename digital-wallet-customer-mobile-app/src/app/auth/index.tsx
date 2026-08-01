// app/auth/index.tsx
import { useState, useRef, useEffect } from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { useLanguage } from '../../providers/LanguageProvider';
import { requestOtp, setPendingAuthRoute } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../../../assets/images/logo.png';

export default function RequestOtpScreen() {
  const [phone, setPhone] = useState('');
  const { theme, colors } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const STEPS = [t('auth.step_phone'), t('auth.step_otp'), t('auth.step_pin')];
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  const router = useRouter();

  const handleSubmit = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Toast.show({ type: 'error', text1: t('common.error'), text2: t('auth.enter_phone_error') });
      return;
    }

    setLoading(true);
    const response = await requestOtp(trimmedPhone);
    if (isMounted.current) setLoading(false);

    if (response.status === 200 && response.body?.success) {
      const expiresAt = response.body?.data?.expires_at ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
      if (isMounted.current) {
        await setPendingAuthRoute({
          path: '/auth/verify-otp',
          params: { phone: trimmedPhone, expiresAt },
          expiresAt,
        });
        Toast.show({ type: 'success', text1: t('auth.otp_sent_title'), text2: t('auth.otp_sent_desc') });
        router.push({ pathname: '/auth/verify-otp', params: { phone: trimmedPhone, expiresAt } });
      }
    } else {
      const serverMessage = response.body?.message ?? 'Could not request OTP';

      // If backend indicates the phone is already registered as admin/agent, show a localized message
      const isRoleConflict = typeof serverMessage === 'string' && /already registered as/i.test(serverMessage);
      if (isRoleConflict) {
        Toast.show({
          type: 'error',
          text1: t('auth.role_conflict_title'),
          text2: t('auth.role_conflict_desc'),
        });
      } else {
        Toast.show({
          type: 'error',
          text1: t('auth.failed'),
          text2: serverMessage,
        });
      }
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
            colors={[colors.primary, `${colors.primary}`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingTop: 48, paddingBottom: 40, paddingHorizontal: 24 }}
          >

            {/* Logo / App Name */}
            <View style={{ marginBottom: 24 }}>
              <View style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                width:100,height: 100
              }}>
                <Image source={Logo} style={{width: 100, height: 100, borderRadius: 8, resizeMode: 'contain' }} />
              </View>
              <Text style={{ fontSize: 26, fontWeight: '800', color: colors.secondary, letterSpacing: -0.5 }}>
                Digital Wallet
              </Text>
              <Text style={{ fontSize: 14, color: `${colors.secondary}99`, marginTop: 2 }}>
                Customer Portal
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
              {t('auth.welcome')} 
            </Text>
            <Text style={{
              fontSize: 14,
              color: colors.textSecondary,
              marginBottom: 28,
              lineHeight: 20,
            }}>
              {t('auth.login_subtitle')}
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
                {t('auth.enter_phone')}
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
                      {t('auth.register_now')}
                    </Text>
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