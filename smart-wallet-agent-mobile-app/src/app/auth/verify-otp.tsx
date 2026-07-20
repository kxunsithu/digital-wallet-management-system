// app/auth/verify-otp.tsx
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { verifyOtp, requestOtp } from '../../services/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/AppLogo';
import { Feather } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone as string | undefined;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const MAX_RESEND_ATTEMPTS = 3;

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
        text2: 'You have reached the maximum number of resend attempts. Please try again later.' 
      });
      return;
    }

    setResendLoading(true);
    const res = await requestOtp(phone, undefined);
    setResendLoading(false);
    
    if (res.status === 200 && res.body?.success) {
      setTimeLeft(120);
      setCanResend(false);
      setResendCount(prev => prev + 1);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
      Toast.show({ 
        type: 'success', 
        text1: 'OTP Resent', 
        text2: `A new code has been sent to your phone (${resendCount + 1}/${MAX_RESEND_ATTEMPTS})` 
      });
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to resend', 
        text2: res.body?.message ?? 'Please try again later' 
      });
    }
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[5]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  async function onSubmit() {
    const otpString = otp.join('');
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Phone number not found' });
      return;
    }
    if (!otpString || otpString.length < 6) {
      Toast.show({ type: 'error', text1: 'Invalid code', text2: 'Please enter a 6-digit OTP' });
      return;
    }
    setLoading(true);
    const res = await verifyOtp(phone, otpString);
    setLoading(false);
    if (res.status === 200 && res.body?.success) {
      const data = res.body.data || {};
      Toast.show({ type: 'success', text1: 'OTP Verified', text2: 'Code verified successfully!' });
      if (data.next_step === 'create_pin') {
        router.push({ pathname: '/auth/create-pin', params: { user_id: data.user_id } });
        return;
      }
      router.push({ pathname: '/auth/verify-pin', params: { user_id: data.user_id } });
      return;
    }
    Toast.show({ type: 'error', text1: 'Verification Failed', text2: res.body?.message ?? 'Invalid OTP' });
  }

  const getInputStyle = (index: number) => {
    const isFilled = otp[index] !== '';
    const isFocused = focusedIndex === index;
    
    let borderColor = isDark ? 'border-border' : 'border-slate-200';
    if (isFocused) borderColor = 'border-primary';
    if (isFilled && !isFocused) borderColor = isDark ? 'border-primary/50' : 'border-primary/50';
    
    let bgColor = isDark ? 'bg-surface' : 'bg-slate-50';
    if (isFocused) bgColor = isDark ? 'bg-surface/80' : 'bg-white';
    
    return `${borderColor} ${bgColor}`;
  };

  const otpString = otp.join('');
  const isOtpComplete = otpString.length === 6;
  const isOtpExpired = timeLeft <= 0;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={isDark ? 'flex-1 bg-background' : 'flex-1 bg-white'}
    >
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
                Verify OTP
              </Text>
              <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
                Enter the 6-digit code sent to
              </Text>
              <Text className="text-center font-semibold text-primary mt-1 text-lg tracking-wide">
                {phone}
              </Text>
            </View>

            <View className="w-full mb-6">
              <View className="flex-row justify-between gap-2">
                {otp.map((digit, index) => (
                  <View key={index} className="flex-1 aspect-square">
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
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

            <TouchableOpacity
              className={`w-full py-4 rounded-xl ${
                loading || !isOtpComplete || isOtpExpired ? 'opacity-60' : 'opacity-100'
              }`}
              style={{ backgroundColor: '#D5E726' }}
              onPress={onSubmit}
              disabled={loading || !isOtpComplete || isOtpExpired}
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

            <View className="flex-row items-center justify-center mt-6">
              <Feather name="lock" size={14} color={isDark ? '#6B7280' : '#9CA3AF'} />
              <Text className={`text-xs ml-2 ${isDark ? 'text-textSecondary' : 'text-gray-400'}`}>
                Your code is encrypted and secure
              </Text>
            </View>

            {/* Resend info message */}
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