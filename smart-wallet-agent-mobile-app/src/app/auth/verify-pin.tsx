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
import { verifyPin, clearPendingAuthRoute, logout } from '../../services/auth';
import apiFetch from '../../lib/api';
import { LinearGradient } from 'expo-linear-gradient';

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
  const { theme, colors } = useTheme();
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
      // ── Role guard: only allow 'agent' accounts ──────────────────────────
      try {
        const profileRes = await apiFetch('/profile');
        const userRole = profileRes.body?.data?.role;
        if (userRole && userRole !== 'agent') {
          await logout(); // clear token immediately
          Toast.show({
            type: 'error',
            text1: 'Access Denied',
            text2: 'This app is only for Agent accounts.',
          });
          router.replace('/auth');
          return;
        }
      } catch {
        // If profile fetch fails let it through — backend will guard on next request
      }
      // ─────────────────────────────────────────────────────────────────────
      Toast.show({ type: 'success', text1: 'Welcome Back!', text2: 'You are now signed in.' });
      await clearPendingAuthRoute();
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
    <View
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Header */}
        <LinearGradient
          colors={[colors.primary, `${colors.primary}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 20, paddingBottom: 40, paddingHorizontal: 24 }}
        >
          {/* Logo */}
          <View style={{ marginBottom: 24 }}>
            <View style={{
              width: 52, height: 52, borderRadius: 16,
              backgroundColor: `${colors.secondary}26`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 12,
            }}>
              <Feather name="shield" size={24} color={colors.secondary} />
            </View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.secondary, letterSpacing: -0.5 }}>
              Enter Your PIN
            </Text>
            <Text style={{ fontSize: 13, color: `${colors.secondary}99`, marginTop: 4 }}>
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
                  backgroundColor: pin[i] !== '' ? colors.secondary : `${colors.secondary}33`,
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
                backgroundColor: failCount >= 3 ? `${colors.error}26` : `${colors.primary}1A`,
                borderWidth: 1,
                borderColor: failCount >= 3 ? `${colors.error}4D` : `${colors.primary}33`,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                <Feather
                  name="alert-triangle"
                  size={14}
                  color={failCount >= 3 ? colors.error : colors.primary}
                />
                <Text style={{
                  fontSize: 12,
                  marginLeft: 8,
                  color: failCount >= 3 ? colors.error : colors.primary,
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
                      selectionColor={colors.primary}
                      secureTextEntry={!showPin}
                      style={{
                        height: 64,
                        textAlign: 'center',
                        fontSize: 24,
                        fontWeight: '900',
                        borderRadius: 16,
                        borderWidth: 2.5,
                        borderColor: failCount > 0
                          ? `${colors.error}66`
                          : isFoc ? colors.primary : isFilled ? `${colors.primary}66` : colors.border,
                        backgroundColor: failCount > 0
                          ? `${colors.error}0D`
                          : isFoc
                            ? `${colors.primary}1A`
                            : isFilled
                              ? `${colors.primary}14`
                              : (colors.surface),
                        color: colors.text,
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
              <Feather name={showPin ? 'eye-off' : 'eye'} size={15} color={colors.primary} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: colors.primary, marginLeft: 6 }}>
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
                colors={[colors.primary, `${colors.primary}CC`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {loading ? (
                  <ActivityIndicator color={colors.secondary} size="small" />
                ) : (
                  <>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.secondary, marginRight: 8 }}>
                      {isPinComplete ? 'Sign In' : 'Enter your PIN'}
                    </Text>
                    {isPinComplete && <Feather name="log-in" size={18} color={colors.secondary} />}
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
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Forgot your PIN?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Reset Now</Text>
              </Text>
            </TouchableOpacity>

            {/* Security Note */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="lock" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: 11, marginLeft: 6, color: colors.textSecondary }}>
                Your PIN is encrypted and secure
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}