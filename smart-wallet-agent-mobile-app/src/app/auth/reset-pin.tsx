// app/auth/reset-pin.tsx
import { useState, useRef, useEffect } from 'react';
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
import { forgotPin, resetPin } from '../../services/auth';
import apiFetch from '../../lib/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const OTP_LENGTH = 6;
const PIN_LENGTH = 4;
const MAX_RESEND_ATTEMPTS = 3;
const DEFAULT_EXPIRY_SECONDS = 120;

export default function ResetPinScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone as string | undefined;

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [newPin, setNewPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState<'otp' | 'pin'>('otp');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(DEFAULT_EXPIRY_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const otpRefs = useRef<(TextInput | null)[]>([]);
  const pinRefs = useRef<(TextInput | null)[]>([]);
  const confirmRefs = useRef<(TextInput | null)[]>([]);

  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  // Auto-focus on step change
  useEffect(() => {
    setTimeout(() => {
      if (step === 'otp') {
        otpRefs.current[0]?.focus();
      } else {
        pinRefs.current[0]?.focus();
      }
    }, 100);
  }, [step]);

  // Timer logic
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // OTP handlers
  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < OTP_LENGTH) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        otpRefs.current[nextEmpty]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // PIN handlers
  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, PIN_LENGTH).split('');
      const updatedPin = [...newPin];
      pasted.forEach((char, i) => {
        if (i < PIN_LENGTH) updatedPin[i] = char;
      });
      setNewPin(updatedPin);
      const nextEmpty = updatedPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        pinRefs.current[nextEmpty]?.focus();
      } else {
        setTimeout(() => confirmRefs.current[0]?.focus(), 200);
      }
      return;
    }

    const updatedPin = [...newPin];
    updatedPin[index] = text;
    setNewPin(updatedPin);

    if (text && index < PIN_LENGTH - 1) {
      pinRefs.current[index + 1]?.focus();
    } else if (text && index === PIN_LENGTH - 1) {
      setTimeout(() => confirmRefs.current[0]?.focus(), 200);
    }
  };

  const handleConfirmChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, PIN_LENGTH).split('');
      const updatedPin = [...confirmPin];
      pasted.forEach((char, i) => {
        if (i < PIN_LENGTH) updatedPin[i] = char;
      });
      setConfirmPin(updatedPin);
      const nextEmpty = updatedPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        confirmRefs.current[nextEmpty]?.focus();
      }
      return;
    }

    const updatedPin = [...confirmPin];
    updatedPin[index] = text;
    setConfirmPin(updatedPin);

    if (text && index < PIN_LENGTH - 1) {
      confirmRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (event: any, index: number, type: 'pin' | 'confirm') => {
    if (event.nativeEvent.key === 'Backspace') {
      if (type === 'pin') {
        if (!newPin[index] && index > 0) {
          pinRefs.current[index - 1]?.focus();
        }
      } else {
        if (!confirmPin[index] && index > 0) {
          confirmRefs.current[index - 1]?.focus();
        } else if (!confirmPin[index] && index === 0) {
          setStep('pin');
          setTimeout(() => pinRefs.current[PIN_LENGTH - 1]?.focus(), 100);
        }
      }
    }
  };

  const handleResendOtp = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number not found' });
      return;
    }

    if (resendCount >= MAX_RESEND_ATTEMPTS) {
      Toast.show({
        type: 'error',
        text1: 'Maximum attempts reached',
        text2: 'You have reached the maximum number of resend attempts.'
      });
      return;
    }

    setResendLoading(true);
    const response = await forgotPin(phone);
    setResendLoading(false);

    if (response.status === 200 && response.body?.success) {
      setTimeLeft(DEFAULT_EXPIRY_SECONDS);
      setCanResend(false);
      setResendCount((prev) => prev + 1);
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      Toast.show({
        type: 'success',
        text1: 'OTP Resent',
        text2: `New code sent (${resendCount + 1}/${MAX_RESEND_ATTEMPTS})`
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Failed to resend',
        text2: response.body?.message ?? 'Please try again'
      });
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');

    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing phone number' });
      return;
    }

    if (otpString.length !== OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter a 6-digit OTP' });
      return;
    }

    setLoading(true);
    const response = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, otp_code: otpString }),
    });
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      Toast.show({ type: 'success', text1: 'OTP Verified', text2: 'You can now reset your PIN.' });
      setStep('pin');
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: response.body?.message ?? 'Invalid OTP' });
    }
  };

  const handleResetPin = async () => {
    const pinString = newPin.join('');
    const confirmString = confirmPin.join('');

    if (pinString.length !== PIN_LENGTH) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be exactly 4 digits' });
      return;
    }

    if (pinString !== confirmString) {
      Toast.show({ type: 'error', text1: 'PIN Mismatch', text2: 'PIN and confirm PIN do not match' });
      setConfirmPin(Array(PIN_LENGTH).fill(''));
      setStep('pin');
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }

    const otpString = otp.join('');
    setLoading(true);
    const response = await apiFetch('/auth/reset-pin', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phone,
        otp_code: otpString,
        new_pin: pinString,
      }),
    });
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      Toast.show({ type: 'success', text1: 'PIN Reset', text2: 'Your PIN has been reset successfully.' });
      router.push('/auth');
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: response.body?.message ?? 'Failed to reset PIN' });
    }
  };

  const otpString = otp.join('');
  const isOtpComplete = otpString.length === OTP_LENGTH;
  const isOtpExpired = timeLeft <= 0;

  const getOtpBoxStyle = (index: number) => {
    const isFilled = otp[index] !== '';
    const isFoc = focusedField === `otp${index}`;
    return {
      height: 52,
      textAlign: 'center' as const,
      fontSize: 20,
      fontWeight: '800' as const,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: isFoc ? colors.primary : isFilled ? `${colors.primary}66` : colors.border,
      backgroundColor: isFoc
        ? `${colors.primary}1A`
        : isFilled
          ? `${colors.primary}14`
          : (colors.surface),
      color: colors.text,
    };
  };

  const getPinBoxStyle = (fieldName: string, value: string) => {
    const isFoc = focusedField === fieldName;
    const isFilled = value !== '';
    return {
      height: 56,
      textAlign: 'center' as const,
      fontSize: 22,
      fontWeight: '800' as const,
      borderRadius: 14,
      borderWidth: 2,
      borderColor: isFoc ? colors.primary : isFilled ? `${colors.primary}66` : colors.border,
      backgroundColor: isFoc
        ? `${colors.primary}1A`
        : isFilled
          ? `${colors.primary}14`
          : (colors.surface),
      color: colors.text,
    };
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
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, alignItems: 'center', justifyContent: 'center',
              borderRadius: 20,
              backgroundColor: isDark ? colors.surface : `${colors.border}33`,
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>
            {step === 'otp' ? 'Verify OTP' : 'Reset PIN'}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>

            {step === 'otp' ? (
              // OTP Step
              <>
                {/* Step icon */}
                <View style={{
                  width: 72, height: 72, borderRadius: 24,
                  backgroundColor: `${colors.primary}1A`,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Feather name="message-circle" size={32} color={colors.primary} />
                </View>

                <View style={{ width: '100%', marginBottom: 24 }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.5 }}>
                    Verify OTP
                  </Text>
                  <Text style={{ textAlign: 'center', marginTop: 10, color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>
                    Enter the 6-digit code sent to
                  </Text>
                  <Text style={{ textAlign: 'center', fontWeight: '700', color: colors.primary, marginTop: 4, fontSize: 15, letterSpacing: 1 }}>
                    {phone}
                  </Text>
                </View>

                {/* OTP Boxes */}
                <View style={{ width: '100%', marginBottom: 20 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    {otp.map((digit, index) => (
                      <View key={index} style={{ flex: 1 }}>
                        <TextInput
                          ref={(ref) => { otpRefs.current[index] = ref; }}
                          style={getOtpBoxStyle(index)}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          onFocus={() => setFocusedField(`otp${index}`)}
                          onBlur={() => setFocusedField(null)}
                          maxLength={1}
                          keyboardType="number-pad"
                          editable={!loading && !resendLoading}
                          autoFocus={index === 0}
                          selectionColor={colors.primary}
                          textAlign="center"
                        />
                      </View>
                    ))}
                  </View>

                  {/* Timer & Resend */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingHorizontal: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather
                        name="clock"
                        size={14}
                        color={isOtpExpired ? colors.error : colors.primary}
                      />
                      <Text style={{
                        fontSize: 12, marginLeft: 6,
                        color: isOtpExpired ? colors.error : colors.textSecondary,
                        fontWeight: isOtpExpired ? '600' : '400',
                      }}>
                        {!isOtpExpired ? `${formatTime(timeLeft)} remaining` : 'Code expired'}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      {resendCount > 0 && (
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginRight: 8 }}>
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
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={{
                              fontSize: 12, fontWeight: '700',
                              color: resendCount >= MAX_RESEND_ATTEMPTS ? colors.textSecondary : colors.primary,
                            }}>
                              {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts' : 'Resend OTP'}
                            </Text>
                          )}
                        </TouchableOpacity>
                      ) : (
                        <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                          {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts reached' : 'Wait to resend'}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Verify OTP Button */}
                <TouchableOpacity
                  style={{ width: '100%', opacity: loading || !isOtpComplete || isOtpExpired ? 0.6 : 1 }}
                  onPress={verifyOtp}
                  disabled={loading || !isOtpComplete || isOtpExpired}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, `${colors.primary}CC`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16, borderRadius: 16,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.secondary} size="small" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.secondary, marginRight: 8 }}>
                          Verify OTP
                        </Text>
                        <Feather name="check" size={18} color={colors.secondary} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              // PIN Reset Step
              <>
                {/* Step icon */}
                <View style={{
                  width: 72, height: 72, borderRadius: 24,
                  backgroundColor: `${colors.primary}1A`,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 20,
                }}>
                  <Feather name="lock" size={32} color={colors.primary} />
                </View>

                <View style={{ width: '100%', marginBottom: 24 }}>
                  <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.5 }}>
                    Reset PIN
                  </Text>
                  <Text style={{ textAlign: 'center', marginTop: 8, color: colors.textSecondary, fontSize: 14 }}>
                    Create a new 4-digit PIN for your account
                  </Text>
                </View>

                <View style={{ width: '100%', marginBottom: 24 }}>
                  {/* New PIN */}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    New PIN
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8, marginBottom: 20 }}>
                    {newPin.map((digit, index) => (
                      <View key={index} style={{ flex: 1 }}>
                        <TextInput
                          ref={(ref) => { pinRefs.current[index] = ref; }}
                          style={getPinBoxStyle(`pin${index}`, digit)}
                          value={digit}
                          onChangeText={(text) => handlePinChange(text, index)}
                          onKeyPress={(e) => handlePinKeyPress(e, index, 'pin')}
                          onFocus={() => setFocusedField(`pin${index}`)}
                          onBlur={() => setFocusedField(null)}
                          maxLength={1}
                          keyboardType="number-pad"
                          secureTextEntry
                          editable={!loading}
                          selectionColor={colors.primary}
                          textAlign="center"
                        />
                      </View>
                    ))}
                  </View>

                  {/* Confirm PIN */}
                  <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    Confirm PIN
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    {confirmPin.map((digit, index) => (
                      <View key={index} style={{ flex: 1 }}>
                        <TextInput
                          ref={(ref) => { confirmRefs.current[index] = ref; }}
                          style={getPinBoxStyle(`confirm${index}`, digit)}
                          value={digit}
                          onChangeText={(text) => handleConfirmChange(text, index)}
                          onKeyPress={(e) => handlePinKeyPress(e, index, 'confirm')}
                          onFocus={() => setFocusedField(`confirm${index}`)}
                          onBlur={() => setFocusedField(null)}
                          maxLength={1}
                          keyboardType="number-pad"
                          secureTextEntry
                          editable={!loading}
                          selectionColor={colors.primary}
                          textAlign="center"
                        />
                      </View>
                    ))}
                  </View>
                </View>

                {/* Reset PIN Button */}
                <TouchableOpacity
                  style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
                  onPress={handleResetPin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[colors.primary, `${colors.primary}CC`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{
                      paddingVertical: 16, borderRadius: 16,
                      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.secondary} size="small" />
                    ) : (
                      <>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.secondary, marginRight: 8 }}>
                          Reset PIN
                        </Text>
                        <Feather name="refresh-cw" size={18} color={colors.secondary} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}