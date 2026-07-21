// app/auth/verify-otp.tsx
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { verifyOtp, requestOtp, setPendingAuthRoute, clearPendingAuthRoute } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

// Constants
const OTP_LENGTH = 6;
const MAX_RESEND_ATTEMPTS = 3;
const DEFAULT_EXPIRY_SECONDS = 120;

const STEPS = ['Phone', 'OTP', 'PIN'];

export default function VerifyOtpScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const expiresAt = params.expiresAt as string | undefined;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(() => {
    if (expiresAt) {
      return Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
    }
    return DEFAULT_EXPIRY_SECONDS;
  });
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) {
      clearPendingAuthRoute();
    }
  }, [timeLeft]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (text: string, index: number): void => {
    if (text.length > 1) {
      const pasted = text.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => { if (i < OTP_LENGTH) newOtp[i] = char; });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      }
      return;
    }
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number): void => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async (): Promise<void> => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number not found' });
      return;
    }
    if (resendCount >= MAX_RESEND_ATTEMPTS) {
      Toast.show({ type: 'error', text1: 'Maximum Attempts Reached', text2: 'Please try again later' });
      return;
    }
    setResendLoading(true);
    const response = await requestOtp(phone);
    setResendLoading(false);
    if (response.status === 200 && response.body?.success) {
      const newExpiresAt = response.body?.data?.expires_at ?? new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const remaining = Math.max(0, Math.round((new Date(newExpiresAt).getTime() - Date.now()) / 1000));
      await setPendingAuthRoute({
        path: '/auth/verify-otp',
        params: { phone, expiresAt: newExpiresAt },
        expiresAt: newExpiresAt,
      });
      setTimeLeft(remaining);
      setCanResend(false);
      setResendCount((prev) => prev + 1);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      Toast.show({ type: 'success', text1: 'OTP Resent', text2: `New code sent (${resendCount + 1}/${MAX_RESEND_ATTEMPTS})` });
    } else {
      Toast.show({ type: 'error', text1: 'Failed to Resend', text2: response.body?.message ?? 'Please try again' });
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const otpString = otp.join('');
    if (!phone) { Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number not found' }); return; }
    if (otpString.length !== OTP_LENGTH) { Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Please enter a 6-digit OTP' }); return; }

    setLoading(true);
    const response = await verifyOtp(phone, otpString);
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      const data = response.body.data || {};
      const userId = data.user_id;
      const nextStep = data.next_step === 'create_pin' ? '/auth/create-pin' : '/auth/verify-pin';

      // Both create-pin and verify-pin pending routes are persistent (expiresAt: null) once OTP is verified
      await setPendingAuthRoute({
        path: nextStep as '/auth/create-pin' | '/auth/verify-pin',
        params: { user_id: userId, phone },
        expiresAt: null, // Persistent — no expiry once OTP is verified
      });

      Toast.show({ type: 'success', text1: 'OTP Verified', text2: 'Code verified successfully!' });
      router.push({ pathname: nextStep, params: { user_id: userId, phone } });
    } else {
      if (response.status === 422 && response.body?.message?.toLowerCase().includes('expired')) {
        await clearPendingAuthRoute();
        Toast.show({ type: 'error', text1: 'OTP Expired', text2: 'Please request a new OTP' });
      } else {
        Toast.show({ type: 'error', text1: 'Verification Failed', text2: response.body?.message ?? 'Invalid OTP' });
      }
    }
  };

  const otpString = otp.join('');
  const isOtpComplete = otpString.length === OTP_LENGTH;
  const isOtpExpired = timeLeft <= 0;
  const isButtonDisabled = loading || !isOtpComplete || isOtpExpired;

  return (
    <SafeAreaView
      edges={['top', 'bottom']}
      style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <LinearGradient
          colors={['#D5E726', '#A8B81A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24 }}
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: 'rgba(0,0,0,0.15)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color="#0A0B09" />
          </TouchableOpacity>

          {/* Step Indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            {STEPS.map((step, i) => (
              <View key={step} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: i <= 1 ? '#0A0B09' : 'rgba(0,0,0,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {i < 1
                    ? <Feather name="check" size={13} color="#D5E726" />
                    : i === 1
                      ? <Feather name="message-circle" size={13} color="#D5E726" />
                      : <Text style={{ fontSize: 11, fontWeight: '700', color: 'rgba(0,0,0,0.5)' }}>{i + 1}</Text>
                  }
                </View>
                <Text style={{
                  fontSize: 12, fontWeight: i === 1 ? '700' : '500',
                  color: i <= 1 ? '#0A0B09' : 'rgba(0,0,0,0.5)',
                  marginLeft: 6,
                }}>
                  {step}
                </Text>
                {i < STEPS.length - 1 && (
                  <View style={{
                    width: 24, height: 1.5,
                    backgroundColor: i < 1 ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)',
                    marginHorizontal: 8,
                  }} />
                )}
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0A0B09', letterSpacing: -0.5 }}>
            Verify Code
          </Text>
          <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
            6-digit code sent to{' '}
            <Text style={{ fontWeight: '700' }}>{phone}</Text>
          </Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>

            {/* OTP Boxes */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {otp.map((digit, index) => {
                const isFilled = digit !== '';
                const isFoc = focusedIndex === index;
                return (
                  <View key={index} style={{ flex: 1 }}>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      maxLength={1}
                      keyboardType="number-pad"
                      editable={!loading && !resendLoading}
                      selectionColor="#D5E726"
                      style={{
                        height: 56,
                        textAlign: 'center',
                        fontSize: 22,
                        fontWeight: '800',
                        borderRadius: 14,
                        borderWidth: 2,
                        borderColor: isFoc ? '#D5E726' : isFilled ? 'rgba(213,231,38,0.4)' : (isDark ? '#2F332B' : '#E2E8F0'),
                        backgroundColor: isFoc
                          ? (isDark ? '#1A1E10' : '#FAFFF0')
                          : isFilled
                            ? (isDark ? '#1A1E10' : '#F8FFE0')
                            : (isDark ? '#161814' : '#FFFFFF'),
                        color: isDark ? '#FFFFFF' : '#0A0B09',
                      }}
                    />
                  </View>
                );
              })}
            </View>

            {/* Timer & Resend */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Feather
                  name="clock"
                  size={13}
                  color={isOtpExpired ? '#EF4444' : '#D5E726'}
                />
                <Text style={{
                  fontSize: 12,
                  marginLeft: 5,
                  color: isOtpExpired ? '#EF4444' : (isDark ? '#6B7280' : '#9CA3AF'),
                  fontWeight: isOtpExpired ? '600' : '400',
                }}>
                  {isOtpExpired ? 'Code expired' : `Expires in ${formatTime(timeLeft)}`}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {resendCount > 0 && (
                  <Text style={{ fontSize: 11, color: isDark ? '#4B5563' : '#9CA3AF', marginRight: 6 }}>
                    ({resendCount}/{MAX_RESEND_ATTEMPTS})
                  </Text>
                )}
                {canResend ? (
                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendLoading || resendCount >= MAX_RESEND_ATTEMPTS}
                    activeOpacity={0.7}
                  >
                    {resendLoading ? (
                      <ActivityIndicator size="small" color="#D5E726" />
                    ) : (
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: resendCount >= MAX_RESEND_ATTEMPTS ? (isDark ? '#4B5563' : '#CBD5E1') : '#D5E726',
                      }}>
                        {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts' : 'Resend OTP'}
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={{ fontSize: 12, color: isDark ? '#4B5563' : '#CBD5E1' }}>
                    {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts reached' : 'Wait to resend'}
                  </Text>
                )}
              </View>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isButtonDisabled}
              activeOpacity={0.85}
              style={{ marginBottom: 16, opacity: isButtonDisabled ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={['#D5E726', '#C4D420']}
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
                  <>
                    <ActivityIndicator color="#0A0B09" size="small" />
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0B09', marginLeft: 8 }}>
                      Verifying...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0B09', marginRight: 8 }}>
                      {isOtpExpired ? 'Code Expired' : isOtpComplete ? 'Verify & Continue' : 'Enter OTP'}
                    </Text>
                    {isOtpComplete && !isOtpExpired && (
                      <Feather name="arrow-right" size={18} color="#0A0B09" />
                    )}
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Security Note */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyURI: 'center', justifyContent: 'center' }}>
              <Feather name="lock" size={12} color={isDark ? '#4B5563' : '#CBD5E1'} />
              <Text style={{ fontSize: 11, marginLeft: 6, color: isDark ? '#4B5563' : '#9CA3AF' }}>
                Your code is encrypted and secure
              </Text>
            </View>

            {/* Max attempts warning */}
            {resendCount >= MAX_RESEND_ATTEMPTS && (
              <View style={{
                marginTop: 16,
                padding: 12,
                borderRadius: 12,
                backgroundColor: 'rgba(239,68,68,0.1)',
                borderWidth: 1,
                borderColor: 'rgba(239,68,68,0.2)',
              }}>
                <Text style={{ fontSize: 12, color: '#EF4444', textAlign: 'center' }}>
                  Maximum resend attempts reached. Please try again later.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}