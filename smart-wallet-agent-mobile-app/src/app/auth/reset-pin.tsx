// app/auth/reset-pin.tsx
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/AppLogo';
import { Feather } from '@expo/vector-icons';
import apiFetch from '../../lib/api';
import { forgotPin } from '../../services/auth';

export default function ResetPinScreen() {
  const params = useLocalSearchParams();
  const phone = params.phone as string | undefined;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPin, setNewPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [step, setStep] = useState<'otp' | 'pin'>('otp');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const pinRefs = useRef<(TextInput | null)[]>([]);
  const confirmRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const MAX_RESEND_ATTEMPTS = 3;

  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
    } else if (step === 'pin') {
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

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

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 6).split('');
      const newOtp = [...otp];
      pasted.forEach((char, i) => {
        if (i < 6) newOtp[i] = char;
      });
      setOtp(newOtp);
      const nextEmpty = newOtp.findIndex((val: string) => val === '');
      if (nextEmpty !== -1) {
        otpRefs.current[nextEmpty]?.focus();
      } else {
        otpRefs.current[5]?.focus();
      }
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 4).split('');
      const updatedPin = [...newPin];
      pasted.forEach((char, i) => {
        if (i < 4) updatedPin[i] = char;
      });
      setNewPin(updatedPin);
      const nextEmpty = updatedPin.findIndex((val: string) => val === '');
      if (nextEmpty !== -1) {
        pinRefs.current[nextEmpty]?.focus();
      } else {
        pinRefs.current[3]?.focus();
        setTimeout(() => confirmRefs.current[0]?.focus(), 200);
      }
      return;
    }

    const updatedPin = [...newPin];
    updatedPin[index] = text;
    setNewPin(updatedPin);

    if (text && index < 3) {
      pinRefs.current[index + 1]?.focus();
    } else if (text && index === 3) {
      setTimeout(() => confirmRefs.current[0]?.focus(), 200);
    }
  };

  const handleConfirmChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 4).split('');
      const updatedPin = [...confirmPin];
      pasted.forEach((char, i) => {
        if (i < 4) updatedPin[i] = char;
      });
      setConfirmPin(updatedPin);
      const nextEmpty = updatedPin.findIndex((val: string) => val === '');
      if (nextEmpty !== -1) {
        confirmRefs.current[nextEmpty]?.focus();
      } else {
        confirmRefs.current[3]?.focus();
      }
      return;
    }

    const updatedPin = [...confirmPin];
    updatedPin[index] = text;
    setConfirmPin(updatedPin);

    if (text && index < 3) {
      confirmRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyPress = (e: any, index: number, type: 'pin' | 'confirm') => {
    if (e.nativeEvent.key === 'Backspace') {
      if (type === 'pin') {
        if (!newPin[index] && index > 0) {
          pinRefs.current[index - 1]?.focus();
        }
      } else {
        if (!confirmPin[index] && index > 0) {
          confirmRefs.current[index - 1]?.focus();
        } else if (!confirmPin[index] && index === 0) {
          setStep('pin');
          setTimeout(() => pinRefs.current[3]?.focus(), 100);
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
    const res = await forgotPin(phone);
    setResendLoading(false);
    
    if (res.status === 200 && res.body?.success) {
      setTimeLeft(120);
      setCanResend(false);
      setResendCount(prev => prev + 1);
      setOtp(['', '', '', '', '', '']);
      setTimeout(() => {
        otpRefs.current[0]?.focus();
      }, 100);
      Toast.show({ 
        type: 'success', 
        text1: 'OTP Resent', 
        text2: `New code sent (${resendCount + 1}/${MAX_RESEND_ATTEMPTS})` 
      });
    } else {
      Toast.show({ 
        type: 'error', 
        text1: 'Failed to resend', 
        text2: res.body?.message ?? 'Please try again' 
      });
    }
  };

  const verifyOtp = async () => {
    const otpString = otp.join('');
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing phone number' });
      return;
    }
    if (!otpString || otpString.length < 6) {
      Toast.show({ type: 'error', text1: 'Invalid OTP', text2: 'Please enter a 6-digit OTP' });
      return;
    }

    setLoading(true);
    const res = await apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ phone_number: phone, otp_code: otpString }),
    });
    setLoading(false);

    if (res.status === 200 && res.body?.success) {
      Toast.show({ type: 'success', text1: 'OTP Verified', text2: 'You can now reset your PIN.' });
      setStep('pin');
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: res.body?.message ?? 'Invalid OTP' });
    }
  };

  const resetPin = async () => {
    const pinString = newPin.join('');
    const confirmString = confirmPin.join('');
    
    if (pinString.length !== 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be exactly 4 digits' });
      return;
    }
    if (pinString !== confirmString) {
      Toast.show({ type: 'error', text1: 'PIN Mismatch', text2: 'PIN and confirm PIN do not match' });
      setConfirmPin(['', '', '', '']);
      setStep('pin');
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }

    const otpString = otp.join('');
    setLoading(true);
    const res = await apiFetch('/auth/reset-pin', {
      method: 'POST',
      body: JSON.stringify({
        phone_number: phone,
        otp_code: otpString,
        new_pin: pinString,
      }),
    });
    setLoading(false);

    if (res.status === 200 && res.body?.success) {
      Toast.show({ type: 'success', text1: 'PIN Reset', text2: 'Your PIN has been reset successfully.' });
      router.push('/auth');
    } else {
      Toast.show({ type: 'error', text1: 'Error', text2: res.body?.message ?? 'Failed to reset PIN' });
    }
  };

  const containerClass = isDark ? 'flex-1 bg-background' : 'flex-1 bg-white';
  const inputClass = isDark 
    ? 'w-full bg-surface text-text p-4 rounded-xl border text-base' 
    : 'w-full bg-slate-50 text-black p-4 rounded-xl border text-base';

  const getBorderClass = (fieldName: string) => {
    return focusedField === fieldName
      ? 'border-primary'
      : (isDark ? 'border-border' : 'border-slate-200');
  };

  const getOtpInputStyle = (index: number) => {
    const isFilled = otp[index] !== '';
    const isFocused = focusedField === `otp${index}`;
    
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
        <Text className={isDark ? 'text-text font-medium' : 'text-gray-900 font-medium'}>
          {step === 'otp' ? 'Verify OTP' : 'Reset PIN'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 items-center justify-center px-6 py-4">
          <AppLogo />

          {step === 'otp' ? (
            <>
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
                        ref={(ref) => { otpRefs.current[index] = ref; }}
                        className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                          getOtpInputStyle(index)
                        } ${isDark ? 'text-text' : 'text-gray-900'}`}
                        value={digit}
                        onChangeText={(text) => handleOtpChange(text, index)}
                        onKeyPress={(e) => handleOtpKeyPress(e, index)}
                        onFocus={() => setFocusedField(`otp${index}`)}
                        onBlur={() => setFocusedField(null)}
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
                onPress={verifyOtp}
                disabled={loading || !isOtpComplete || isOtpExpired}
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
                      <Text className="text-secondary font-semibold text-base mr-2">Verify OTP</Text>
                      <Feather name="check" size={20} color="#10110E" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View className="w-full mb-6">
                <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
                  Reset PIN
                </Text>
                <Text className={`text-center mt-2 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base`}>
                  Create a new 4-digit PIN for your account
                </Text>
              </View>

              <View className="w-full mb-6">
                <Text className={`text-sm font-medium ${isDark ? 'text-textSecondary' : 'text-gray-600'} mb-2`}>
                  New PIN
                </Text>
                <View className="flex-row justify-between gap-2 mb-4">
                  {newPin.map((digit, index) => (
                    <View key={index} className="flex-1 aspect-square">
                      <TextInput
                        ref={(ref) => { pinRefs.current[index] = ref; }}
                        className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                          getBorderClass(`pin${index}`)
                        } ${isDark ? 'bg-surface text-text' : 'bg-slate-50 text-gray-900'}`}
                        value={digit}
                        onChangeText={(text) => handlePinChange(text, index)}
                        onKeyPress={(e) => handlePinKeyPress(e, index, 'pin')}
                        onFocus={() => setFocusedField(`pin${index}`)}
                        onBlur={() => setFocusedField(null)}
                        maxLength={1}
                        keyboardType="number-pad"
                        secureTextEntry
                        editable={!loading}
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

                <Text className={`text-sm font-medium ${isDark ? 'text-textSecondary' : 'text-gray-600'} mb-2`}>
                  Confirm PIN
                </Text>
                <View className="flex-row justify-between gap-2">
                  {confirmPin.map((digit, index) => (
                    <View key={index} className="flex-1 aspect-square">
                      <TextInput
                        ref={(ref) => { confirmRefs.current[index] = ref; }}
                        className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                          getBorderClass(`confirm${index}`)
                        } ${isDark ? 'bg-surface text-text' : 'bg-slate-50 text-gray-900'}`}
                        value={digit}
                        onChangeText={(text) => handleConfirmChange(text, index)}
                        onKeyPress={(e) => handlePinKeyPress(e, index, 'confirm')}
                        onFocus={() => setFocusedField(`confirm${index}`)}
                        onBlur={() => setFocusedField(null)}
                        maxLength={1}
                        keyboardType="number-pad"
                        secureTextEntry
                        editable={!loading}
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
              </View>

              <TouchableOpacity
                className={`w-full py-4 rounded-xl ${loading ? 'opacity-70' : ''}`}
                style={{ backgroundColor: '#D5E726' }}
                onPress={resetPin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  {loading ? (
                    <View className="flex-row items-center">
                      <Text className="text-secondary font-semibold text-base mr-2">Resetting...</Text>
                      <View className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
                    </View>
                  ) : (
                    <>
                      <Text className="text-secondary font-semibold text-base mr-2">Reset PIN</Text>
                      <Feather name="refresh-cw" size={20} color="#10110E" />
                    </>
                  )}
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}