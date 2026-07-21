// app/auth/verify-pin.tsx
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
import { verifyPin, clearPendingAuthRoute } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const PIN_LENGTH = 4;

export default function VerifyPinScreen() {
  const params = useLocalSearchParams();
  const userId = Number(params.user_id || params.userId || 0);

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);
  const [failCount, setFailCount] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setTimeout(() => { inputRefs.current[0]?.focus(); }, 300);
  }, []);

  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, PIN_LENGTH).split('');
      const newPin = [...pin];
      pasted.forEach((char, i) => { if (i < PIN_LENGTH) newPin[i] = char; });
      setPin(newPin);
      const nextEmpty = newPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        inputRefs.current[nextEmpty]?.focus();
      } else {
        inputRefs.current[PIN_LENGTH - 1]?.focus();
      }
      return;
    }
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    if (text && index < PIN_LENGTH - 1) { inputRefs.current[index + 1]?.focus(); }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async () => {
    const pinString = pin.join('');
    if (!userId) { Toast.show({ type: 'error', text1: 'Error', text2: 'Missing user ID' }); return; }
    if (pinString.length !== PIN_LENGTH) { Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'PIN must be exactly 4 digits' }); return; }

    setLoading(true);
    const response = await verifyPin(userId, pinString, 'smart-wallet-agent-app');
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      Toast.show({ type: 'success', text1: 'Welcome Back!', text2: 'You are now signed in.' });
      await clearPendingAuthRoute(); // Clear persistent route on successful login
      router.replace('/');
    } else {
      setFailCount((prev) => prev + 1);
      setPin(Array(PIN_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
      Toast.show({ type: 'error', text1: 'Wrong PIN', text2: response.body?.message ?? 'Invalid PIN. Please try again.' });
    }
  };

  const isPinComplete = pin.every((digit) => digit !== '');

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
          style={{ paddingTop: 20, paddingBottom: 40, paddingHorizontal: 24 }}
        >
          {/* Logo */}
          <View style={{ marginBottom: 24 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: 'rgba(0,0,0,0.15)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Feather name="shield" size={24} color="#0A0B09" />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0A0B09', letterSpacing: -0.5 }}>
              Enter Your PIN
            </Text>
            <Text style={{ fontSize: 13, color: 'rgba(0,0,0,0.6)', marginTop: 4 }}>
              Enter your 4-digit security PIN to access your account
            </Text>
          </View>

          {/* PIN Dots Preview */}
          <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center' }}>
            {Array(PIN_LENGTH).fill(0).map((_, i) => (
              <View
                key={i}
                style={{
                  width: 16, height: 16, borderRadius: 8,
                  backgroundColor: pin[i] !== '' ? '#0A0B09' : 'rgba(0,0,0,0.2)',
                }}
              />
            ))}
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>

            {/* Fail count warning */}
            {failCount > 0 && (
              <View style={{
                marginBottom: 20,
                padding: 12,
                borderRadius: 12,
                backgroundColor: failCount >= 3 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.1)',
                borderWidth: 1,
                borderColor: failCount >= 3 ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.2)',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Feather
                  name="alert-triangle"
                  size={14}
                  color={failCount >= 3 ? '#EF4444' : '#F59E0B'}
                />
                <Text style={{
                  fontSize: 12,
                  marginLeft: 8,
                  color: failCount >= 3 ? '#EF4444' : '#F59E0B',
                  fontWeight: '500',
                }}>
                  {failCount >= 3
                    ? 'Too many failed attempts. Your account may be locked.'
                    : `Incorrect PIN. ${failCount} failed attempt${failCount > 1 ? 's' : ''}.`
                  }
                </Text>
              </View>
            )}

            {/* PIN Input Boxes */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {pin.map((digit, index) => {
                const isFoc = focusedIndex === index;
                const isFilled = digit !== '';
                return (
                  <View key={index} style={{ flex: 1 }}>
                    <TextInput
                      ref={(ref) => { inputRefs.current[index] = ref; }}
                      value={digit}
                      onChangeText={(text) => handlePinChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      onFocus={() => setFocusedIndex(index)}
                      onBlur={() => setFocusedIndex(null)}
                      maxLength={1}
                      keyboardType="number-pad"
                      editable={!loading}
                      selectionColor="#D5E726"
                      secureTextEntry={!showPin}
                      style={{
                        height: 64,
                        textAlign: 'center',
                        fontSize: 24,
                        fontWeight: '900',
                        borderRadius: 16,
                        borderWidth: 2.5,
                        borderColor: failCount > 0
                          ? 'rgba(239,68,68,0.4)'
                          : isFoc ? '#D5E726' : isFilled ? 'rgba(213,231,38,0.4)' : (isDark ? '#2F332B' : '#E2E8F0'),
                        backgroundColor: failCount > 0
                          ? 'rgba(239,68,68,0.05)'
                          : isFoc
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

            {/* Show/Hide Toggle */}
            <TouchableOpacity
              onPress={() => setShowPin((prev) => !prev)}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', marginBottom: 28 }}
            >
              <Feather name={showPin ? 'eye-off' : 'eye'} size={15} color="#D5E726" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#D5E726', marginLeft: 6 }}>
                {showPin ? 'Hide PIN' : 'Show PIN'}
              </Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading || !isPinComplete}
              activeOpacity={0.85}
              style={{ opacity: loading || !isPinComplete ? 0.6 : 1, marginBottom: 16 }}
            >
              <LinearGradient
                colors={['#D5E726', '#C4D420']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <ActivityIndicator color="#0A0B09" size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0B09', marginRight: 8 }}>
                      {isPinComplete ? 'Sign In' : 'Enter your PIN'}
                    </Text>
                    {isPinComplete && <Feather name="log-in" size={18} color="#0A0B09" />}
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Forgot PIN */}
            <TouchableOpacity
              onPress={() => router.push('/auth/forgot-pin')}
              activeOpacity={0.7}
              style={{ alignItems: 'center', marginBottom: 12 }}
            >
              <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                Forgot your PIN?{' '}
                <Text style={{ color: '#D5E726', fontWeight: '700' }}>Reset Now</Text>
              </Text>
            </TouchableOpacity>

            {/* Security Note */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="lock" size={12} color={isDark ? '#4B5563' : '#CBD5E1'} />
              <Text style={{ fontSize: 11, marginLeft: 6, color: isDark ? '#4B5563' : '#9CA3AF' }}>
                Your PIN is encrypted and secure
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}