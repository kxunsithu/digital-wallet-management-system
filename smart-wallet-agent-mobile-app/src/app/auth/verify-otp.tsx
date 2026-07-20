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
  ActivityIndicator 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { verifyOtp, requestOtp, setPendingAuthRoute, clearPendingAuthRoute } from '../../services/auth';
import AppLogo from '../../components/AppLogo';

// Constants
const OTP_LENGTH = 6;
const MAX_RESEND_ATTEMPTS = 3;
const DEFAULT_EXPIRY_SECONDS = 120;

export default function VerifyOtpScreen() {
  // ─── Router & Theme ──────────────────────────────────────────────
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // ─── Params ──────────────────────────────────────────────────────
  const params = useLocalSearchParams();
  const phone = params.phone as string;
  const expiresAt = params.expiresAt as string | undefined;

  // ─── State ──────────────────────────────────────────────────────
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

  // ─── Refs ──────────────────────────────────────────────────────
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // ─── Effects ──────────────────────────────────────────────────
  // Auto-focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Timer countdown
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

  // Clear pending route when OTP expires
  useEffect(() => {
    if (timeLeft <= 0) {
      clearPendingAuthRoute();
    }
  }, [timeLeft]);

  // ─── Helper Functions ────────────────────────────────────────
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getInputStyle = (index: number): string => {
    const isFilled = otp[index] !== '';
    const isFocused = focusedIndex === index;
    
    let borderColor = isDark ? 'border-border' : 'border-slate-200';
    if (isFocused) borderColor = 'border-primary';
    if (isFilled && !isFocused) borderColor = isDark ? 'border-primary/50' : 'border-primary/50';
    
    let bgColor = isDark ? 'bg-surface' : 'bg-slate-50';
    if (isFocused) bgColor = isDark ? 'bg-surface/80' : 'bg-white';
    
    return `${borderColor} ${bgColor}`;
  };

  // ─── Handlers ──────────────────────────────────────────────────
  const handleOtpChange = (text: string, index: number): void => {
    // Handle paste (multiple digits at once)
    if (text.length > 1) {
      const pasted = text.slice(0, OTP_LENGTH).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < OTP_LENGTH) newOtp[i] = char;
      });
      setOtp(newOtp);
      
      // Focus next empty field or last field
      const nextEmpty = newOtp.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[OTP_LENGTH - 1]?.focus();
      }
      return;
    }

    // Handle single digit input
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-advance to next input
    if (text && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (event: any, index: number): void => {
    // Handle backspace to go to previous field
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
      Toast.show({ 
        type: 'error', 
        text1: 'Maximum Attempts Reached', 
        text2: 'Please try again later' 
      });
      return;
    }

    setResendLoading(true);
    const response = await requestOtp(phone);
    setResendLoading(false);

    if (response.status === 200 && response.body?.success) {
      const newExpiresAt = response.body?.data?.expires_at ?? 
        new Date(Date.now() + 5 * 60 * 1000).toISOString();
      const remaining = Math.max(0, Math.round((new Date(newExpiresAt).getTime() - Date.now()) / 1000));
      
      // Update pending route with new expiry
      await setPendingAuthRoute({
        path: '/auth/verify-otp',
        params: { phone, expiresAt: newExpiresAt },
        expiresAt: newExpiresAt,
      });

      setTimeLeft(remaining);
      setCanResend(false);
      setResendCount((prev) => prev + 1);
      setOtp(Array(OTP_LENGTH).fill(''));
      
      // Focus first input after reset
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      
      Toast.show({ 
        type: 'success', 
        text1: 'OTP Resent', 
        text2: `New code sent (${resendCount + 1}/${MAX_RESEND_ATTEMPTS})` 
      });
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to Resend', 
        text2: response.body?.message ?? 'Please try again' 
      });
    }
  };

  const handleSubmit = async (): Promise<void> => {
    const otpString = otp.join('');
    
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number not found' });
      return;
    }

    if (otpString.length !== OTP_LENGTH) {
      Toast.show({ type: 'error', text1: 'Invalid Code', text2: 'Please enter a 6-digit OTP' });
      return;
    }

    setLoading(true);
    const response = await verifyOtp(phone, otpString);
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      const data = response.body.data || {};
      const userId = data.user_id;
      
      // Determine next step based on backend response
      const nextStep = data.next_step === 'create_pin' ? '/auth/create-pin' : '/auth/verify-pin';
      
      // Set pending route with 10 minutes expiry (enough time to create PIN)
      const pendingExpiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const nextRoute = {
        path: nextStep as '/auth/create-pin' | '/auth/verify-pin',
        params: {
          user_id: userId,
          phone,
          expiresAt: pendingExpiry,
        },
        expiresAt: pendingExpiry,
      };

      await setPendingAuthRoute(nextRoute);
      
      Toast.show({ 
        type: 'success', 
        text1: 'OTP Verified', 
        text2: 'Code verified successfully!' 
      });
      
      // Navigate to next step
      router.push({ 
        pathname: nextStep, 
        params: { user_id: userId, phone } 
      });
    } else {
      // Handle expired OTP
      if (response.status === 422 && response.body?.message?.toLowerCase().includes('expired')) {
        await clearPendingAuthRoute();
        Toast.show({ 
          type: 'error', 
          text1: 'OTP Expired', 
          text2: 'Please request a new OTP' 
        });
      } else {
        Toast.show({ 
          type: 'error', 
          text1: 'Verification Failed', 
          text2: response.body?.message ?? 'Invalid OTP' 
        });
      }
    }
  };

  // ─── Computed Values ──────────────────────────────────────────
  const otpString = otp.join('');
  const isOtpComplete = otpString.length === OTP_LENGTH;
  const isOtpExpired = timeLeft <= 0;
  const isButtonDisabled = loading || !isOtpComplete || isOtpExpired;

  // ─── Render ──────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={isDark ? 'flex-1 bg-background' : 'flex-1 bg-white'}
    >
      {/* ─── Header ────────────────────────────────────────────── */}
      <View className={`flex-row items-center justify-between px-6 pt-12 pb-4 ${
        isDark ? 'bg-background' : 'bg-white'
      }`}>
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
          Verification
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ─── Body ────────────────────────────────────────────────── */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 items-center justify-center px-4">
          <View className={`w-full max-w-md rounded-2xl p-6 ${
            isDark ? 'bg-surface border-border' : 'bg-white border-slate-200'
          }`}>
            
            {/* Logo */}
            <View className="items-center mb-6">
              <View className="scale-75">
                <AppLogo />
              </View>
            </View>

            {/* Title */}
            <View className="w-full mb-6">
              <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
                Verify OTP
              </Text>
              <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
                Enter the 6-digit code sent to
              </Text>
              <Text className="text-center font-semibold text-primary mt-1 text-lg tracking-wide">
                {phone}
              </Text>
            </View>

            {/* OTP Input */}
            <View className="w-full mb-6">
              <View className="flex-row justify-between gap-2">
                {otp.map((digit, index) => (
                  <View key={index} className="flex-1 aspect-square">
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 ${
                        getInputStyle(index)
                      } ${isDark ? 'text-text' : 'text-gray-900'}`}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      maxLength={1}
                      keyboardType="number-pad"
                      editable={!loading && !resendLoading}
                      autoFocus={index === 0}
                      selectionColor="#D5E726"
                      textAlign="center"
                      textAlignVertical="center"
                      style={{ 
                        textAlign: 'center',
                        textAlignVertical: 'center',
                        paddingVertical: 0,
                        paddingHorizontal: 0,
                      }}
                    />
                  </View>
                ))}
              </View>
              
              {/* Timer & Resend */}
              <View className="flex-row justify-between items-center mt-4 px-1">
                <View className="flex-row items-center">
                  <Feather 
                    name="clock" 
                    size={14} 
                    color={isOtpExpired ? '#EF4444' : (isDark ? '#6B7280' : '#9CA3AF')} 
                  />
                  <Text className={`text-xs ml-1.5 ${
                    isOtpExpired 
                      ? 'text-red-500 font-semibold' 
                      : (isDark ? 'text-textSecondary' : 'text-gray-400')
                  }`}>
                    {!isOtpExpired ? `${formatTime(timeLeft)} remaining` : 'Code expired'}
                  </Text>
                </View>
                
                <View className="flex-row items-center">
                  {resendCount > 0 && (
                    <Text className={`text-xs mr-2 ${isDark ? 'text-textSecondary/50' : 'text-gray-400'}`}>
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
                        <Text className={`text-xs font-semibold ${
                          resendCount >= MAX_RESEND_ATTEMPTS 
                            ? (isDark ? 'text-textSecondary/30' : 'text-gray-300') 
                            : 'text-primary'
                        }`}>
                          {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts' : 'Resend OTP'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <Text className={`text-xs ${isDark ? 'text-textSecondary/30' : 'text-gray-300'}`}>
                      {resendCount >= MAX_RESEND_ATTEMPTS ? 'Max attempts reached' : 'Wait to resend'}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              className={`w-full py-4 rounded-xl ${isButtonDisabled ? 'opacity-60' : 'opacity-100'}`}
              style={{ backgroundColor: '#D5E726' }}
              onPress={handleSubmit}
              disabled={isButtonDisabled}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center space-x-2">
                {loading ? (
                  <>
                    <ActivityIndicator color="#10110E" size="small" />
                    <Text className="text-secondary font-semibold text-base ml-2">
                      Verifying...
                    </Text>
                  </>
                ) : (
                  <>
                    <Text className="text-secondary font-semibold text-base">
                      {isOtpExpired 
                        ? 'Code Expired' 
                        : isOtpComplete 
                          ? 'Verify & Continue' 
                          : 'Enter OTP to continue'
                      }
                    </Text>
                    {isOtpComplete && !isOtpExpired && (
                      <Feather name="arrow-right" size={18} color="#10110E" />
                    )}
                  </>
                )}
              </View>
            </TouchableOpacity>

            {/* Footer */}
            <View className="flex-row items-center justify-center mt-6">
              <Feather name="lock" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <Text className={`text-xs ml-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'}`}>
                Your code is encrypted and secure
              </Text>
            </View>

            {/* Max attempts warning */}
            {resendCount >= MAX_RESEND_ATTEMPTS && (
              <View className="mt-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
                <Text className="text-xs text-red-500 text-center">
                  Maximum resend attempts reached. Please try again later.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}