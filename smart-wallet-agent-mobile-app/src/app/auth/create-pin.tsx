// app/auth/create-pin.tsx
import { Text, View, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { createPin } from '../../services/auth';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import AppLogo from '../../components/AppLogo';
import { Feather } from '@expo/vector-icons';

export default function CreatePinScreen() {
  const params = useLocalSearchParams();
  const userId = Number(params.user_id || params.userId || 0);
  const [pin, setPin] = useState(['', '', '', '']);
  const [confirmPin, setConfirmPin] = useState(['', '', '', '']);
  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [confirmFocusedIndex, setConfirmFocusedIndex] = useState<number | null>(null);
  const pinRefs = useRef<(TextInput | null)[]>([]);
  const confirmRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { theme } = useTheme();

  const isDark = theme === 'dark';

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => {
      if (step === 'pin') {
        pinRefs.current[0]?.focus();
      } else {
        confirmRefs.current[0]?.focus();
      }
    }, 100);
  }, [step]);

  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 4).split('');
      const newPin = [...pin];
      pasted.forEach((char, i) => {
        if (i < 4) newPin[i] = char;
      });
      setPin(newPin);
      const nextEmpty = newPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        pinRefs.current[nextEmpty]?.focus();
      } else {
        pinRefs.current[3]?.focus();
        // Auto proceed to confirm step
        setTimeout(() => {
          setStep('confirm');
          setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        }, 300);
      }
      return;
    }

    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);

    if (text && index < 3) {
      pinRefs.current[index + 1]?.focus();
    } else if (text && index === 3) {
      // Auto proceed to confirm step when all filled
      setTimeout(() => {
        setStep('confirm');
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
      }, 300);
    }
  };

  const handleConfirmChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, 4).split('');
      const newPin = [...confirmPin];
      pasted.forEach((char, i) => {
        if (i < 4) newPin[i] = char;
      });
      setConfirmPin(newPin);
      const nextEmpty = newPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        confirmRefs.current[nextEmpty]?.focus();
      } else {
        confirmRefs.current[3]?.focus();
      }
      return;
    }

    const newPin = [...confirmPin];
    newPin[index] = text;
    setConfirmPin(newPin);

    if (text && index < 3) {
      confirmRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number, type: 'pin' | 'confirm') => {
    if (e.nativeEvent.key === 'Backspace') {
      if (type === 'pin') {
        if (!pin[index] && index > 0) {
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

  async function onSubmit() {
    const pinString = pin.join('');
    const confirmString = confirmPin.join('');
    
    if (!userId) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Missing user ID' });
      return;
    }
    if (pinString.length !== 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'Please enter a 4-digit PIN' });
      return;
    }
    if (confirmString.length !== 4) {
      Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'Please confirm your PIN' });
      return;
    }
    if (pinString !== confirmString) {
      Toast.show({ type: 'error', text1: 'PIN Mismatch', text2: 'PIN and confirm PIN do not match' });
      // Reset confirm PIN
      setConfirmPin(['', '', '', '']);
      setStep('pin');
      setTimeout(() => {
        pinRefs.current[0]?.focus();
      }, 100);
      return;
    }
    
    setLoading(true);
    const res = await createPin(userId, pinString);
    setLoading(false);
    
    if ((res.status === 201 || res.status === 200) && res.body?.success) {
      Toast.show({ type: 'success', text1: 'PIN Created', text2: 'Your PIN was created successfully.' });
      router.push({ pathname: '/auth/verify-pin', params: { user_id: userId } });
      return;
    }

    Toast.show({ type: 'error', text1: 'Error', text2: res.body?.message ?? 'Failed to create PIN' });
  }

  const getInputStyle = (index: number, type: 'pin' | 'confirm') => {
    const currentPin = type === 'pin' ? pin : confirmPin;
    const isFilled = currentPin[index] !== '';
    const isFocused = type === 'pin' ? focusedIndex === index : confirmFocusedIndex === index;
    
    let borderColor = isDark ? 'border-border' : 'border-slate-200';
    if (isFocused) borderColor = 'border-primary';
    if (isFilled && !isFocused) borderColor = isDark ? 'border-primary/50' : 'border-primary/50';
    
    let bgColor = isDark ? 'bg-surface' : 'bg-slate-50';
    if (isFocused) bgColor = isDark ? 'bg-surface/80' : 'bg-white';
    
    return `${borderColor} ${bgColor}`;
  };

  const isPinComplete = pin.every(digit => digit !== '');
  const isConfirmComplete = confirmPin.every(digit => digit !== '');

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
          Create PIN
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

            {step === 'pin' ? (
              <>
                <View className="w-full mb-6">
                  <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
                    Create Your PIN
                  </Text>
                  <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
                    Enter a 4-digit PIN to secure your wallet
                  </Text>
                </View>

                <View className="w-full mb-6">
                  <View className="flex-row justify-between gap-2">
                    {pin.map((digit, index) => (
                      <View key={index} className="flex-1 aspect-square">
                        <TextInput
                          ref={(ref) => { pinRefs.current[index] = ref; }}
                          className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                            getInputStyle(index, 'pin')
                          } ${isDark ? 'text-text' : 'text-gray-900'}`}
                          value={digit}
                          onChangeText={(text) => handlePinChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index, 'pin')}
                          onFocus={() => setFocusedIndex(index)}
                          onBlur={() => setFocusedIndex(null)}
                          maxLength={1}
                          keyboardType="number-pad"
                          editable={!loading}
                          autoFocus={index === 0}
                          selectionColor="#D5E726"
                          textAlign="center"
                          textAlignVertical="center"
                          secureTextEntry
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
                  <Text className={`text-xs mt-4 text-center ${isDark ? 'text-textSecondary' : 'text-gray-400'}`}>
                    Enter your 4-digit PIN
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View className="w-full mb-6">
                  <Text className={`text-2xl font-bold ${isDark ? 'text-text' : 'text-gray-900'} text-center`}>
                    Confirm Your PIN
                  </Text>
                  <Text className={`text-center mt-3 ${isDark ? 'text-textSecondary' : 'text-gray-500'} text-base leading-6`}>
                    Re-enter your PIN to confirm
                  </Text>
                </View>

                <View className="w-full mb-6">
                  <View className="flex-row justify-between gap-2">
                    {confirmPin.map((digit, index) => (
                      <View key={index} className="flex-1 aspect-square">
                        <TextInput
                          ref={(ref) => { confirmRefs.current[index] = ref; }}
                          className={`w-full h-full text-center text-2xl font-bold rounded-xl border-2 transition-all duration-200 ${
                            getInputStyle(index, 'confirm')
                          } ${isDark ? 'text-text' : 'text-gray-900'}`}
                          value={digit}
                          onChangeText={(text) => handleConfirmChange(text, index)}
                          onKeyPress={(e) => handleKeyPress(e, index, 'confirm')}
                          onFocus={() => setConfirmFocusedIndex(index)}
                          onBlur={() => setConfirmFocusedIndex(null)}
                          maxLength={1}
                          keyboardType="number-pad"
                          editable={!loading}
                          selectionColor="#D5E726"
                          textAlign="center"
                          textAlignVertical="center"
                          secureTextEntry
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
                  <Text className={`text-xs mt-4 text-center ${isDark ? 'text-textSecondary' : 'text-gray-400'}`}>
                    Confirm your 4-digit PIN
                  </Text>
                </View>
              </>
            )}

            {step === 'confirm' && (
              <TouchableOpacity
                className={`w-full py-4 rounded-xl ${
                  loading || !isConfirmComplete ? 'opacity-60' : 'opacity-100'
                }`}
                style={{ backgroundColor: '#D5E726' }}
                onPress={onSubmit}
                disabled={loading || !isConfirmComplete}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center space-x-2">
                  {loading ? (
                    <>
                      <ActivityIndicator color="#10110E" size="small" />
                      <Text className="text-secondary font-semibold text-base ml-2">
                        Creating...
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text className="text-secondary font-semibold text-base">
                        {isConfirmComplete ? 'Create PIN' : 'Enter confirm PIN'}
                      </Text>
                      {isConfirmComplete && (
                        <Feather name="check" size={18} color="#10110E" />
                      )}
                    </>
                  )}
                </View>
              </TouchableOpacity>
            )}

            {step === 'pin' && isPinComplete && (
              <TouchableOpacity
                className={`w-full py-4 rounded-xl`}
                style={{ backgroundColor: '#D5E726' }}
                onPress={() => {
                  setStep('confirm');
                  setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                }}
                activeOpacity={0.8}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-secondary font-semibold text-base mr-2">
                    Continue to Confirm
                  </Text>
                  <Feather name="arrow-right" size={18} color="#10110E" />
                </View>
              </TouchableOpacity>
            )}

            {!isPinComplete && step === 'pin' && (
              <View className="w-full py-4 rounded-xl bg-primary/20">
                <Text className="text-secondary font-semibold text-base text-center">
                  Enter 4-digit PIN
                </Text>
              </View>
            )}

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