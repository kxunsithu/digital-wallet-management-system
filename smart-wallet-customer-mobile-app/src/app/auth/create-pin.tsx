// app/auth/create-pin.tsx
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
import { createPin, setPendingAuthRoute } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const PIN_LENGTH = 4;
const STEPS = ['Phone', 'OTP', 'PIN'];

export default function CreatePinScreen() {
  const params = useLocalSearchParams();
  const userId = Number(params.user_id || params.userId || 0);

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [fullName, setFullName] = useState('');
  const [nrcNumber, setNrcNumber] = useState('');
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [step, setStep] = useState<'pin' | 'confirm'>('pin');
  const [loading, setLoading] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [confirmFocusedIndex, setConfirmFocusedIndex] = useState<number | null>(null);
  const [showPin, setShowPin] = useState(false);

  const pinRefs = useRef<(TextInput | null)[]>([]);
  const confirmRefs = useRef<(TextInput | null)[]>([]);
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    setTimeout(() => {
      if (step === 'pin') {
        pinRefs.current[0]?.focus();
      } else {
        confirmRefs.current[0]?.focus();
      }
    }, 300);
  }, [step]);

  const handlePinChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, PIN_LENGTH).split('');
      const newPin = [...pin];
      pasted.forEach((char, i) => { if (i < PIN_LENGTH) newPin[i] = char; });
      setPin(newPin);
      const nextEmpty = newPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) {
        pinRefs.current[nextEmpty]?.focus();
      } else {
        pinRefs.current[PIN_LENGTH - 1]?.focus();
        setTimeout(() => { setStep('confirm'); setTimeout(() => confirmRefs.current[0]?.focus(), 100); }, 300);
      }
      return;
    }
    const newPin = [...pin];
    newPin[index] = text;
    setPin(newPin);
    if (text && index < PIN_LENGTH - 1) {
      pinRefs.current[index + 1]?.focus();
    } else if (text && index === PIN_LENGTH - 1) {
      setTimeout(() => { setStep('confirm'); setTimeout(() => confirmRefs.current[0]?.focus(), 100); }, 300);
    }
  };

  const handleConfirmChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pasted = text.slice(0, PIN_LENGTH).split('');
      const newPin = [...confirmPin];
      pasted.forEach((char, i) => { if (i < PIN_LENGTH) newPin[i] = char; });
      setConfirmPin(newPin);
      const nextEmpty = newPin.findIndex((val) => val === '');
      if (nextEmpty !== -1) { confirmRefs.current[nextEmpty]?.focus(); }
      return;
    }
    const newPin = [...confirmPin];
    newPin[index] = text;
    setConfirmPin(newPin);
    if (text && index < PIN_LENGTH - 1) { confirmRefs.current[index + 1]?.focus(); }
  };

  const handleKeyPress = (event: any, index: number, type: 'pin' | 'confirm') => {
    if (event.nativeEvent.key === 'Backspace') {
      if (type === 'pin') {
        if (!pin[index] && index > 0) { pinRefs.current[index - 1]?.focus(); }
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

  const handleSubmit = async () => {
    const pinString = pin.join('');
    const confirmString = confirmPin.join('');

    if (!userId) { Toast.show({ type: 'error', text1: 'Error', text2: 'Missing user ID' }); return; }
    if (pinString.length !== PIN_LENGTH) { Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'Please enter a 4-digit PIN' }); return; }
    if (confirmString.length !== PIN_LENGTH) { Toast.show({ type: 'error', text1: 'Invalid PIN', text2: 'Please confirm your PIN' }); return; }
    if (pinString !== confirmString) {
      Toast.show({ type: 'error', text1: 'PIN Mismatch', text2: 'PINs do not match. Please try again.' });
      setConfirmPin(Array(PIN_LENGTH).fill(''));
      setStep('pin');
      setTimeout(() => pinRefs.current[0]?.focus(), 100);
      return;
    }

    setLoading(true);
    const response = await createPin(userId, pinString, fullName.trim() || undefined, nrcNumber.trim() || undefined);
    setLoading(false);

    if ((response.status === 201 || response.status === 200) && response.body?.success) {
      Toast.show({ type: 'success', text1: 'PIN Created', text2: 'Your PIN was created successfully.' });

      // ✅ BUG FIX: verify-pin pending route has null expiry = persistent (never expires)
      // This ensures if user closes app after PIN creation, they return to verify-pin
      await setPendingAuthRoute({
        path: '/auth/verify-pin',
        params: { user_id: userId },
        expiresAt: null, // Persistent — no expiry
      });

      router.push({ pathname: '/auth/verify-pin', params: { user_id: userId } });
    } else {
      // If backend responds requiring customer profile fields, show inputs
      const fieldErrors = response.body?.errors;
      const needsFullName = fieldErrors?.full_name && fieldErrors.full_name.length > 0;
      const needsNrc = fieldErrors?.nrc_number && fieldErrors.nrc_number.length > 0;
      const message = response.body?.message ?? '';

      if (needsFullName || needsNrc || (typeof message === 'string' && message.toLowerCase().includes('full name'))) {
        setShowProfileFields(true);
        Toast.show({ type: 'error', text1: 'Additional Info Required', text2: 'Please provide your full name and NRC number to complete registration.' });
        return;
      }

      Toast.show({ type: 'error', text1: 'Error', text2: response.body?.message ?? 'Failed to create PIN' });
    }
  };

  const isPinComplete = pin.every((d) => d !== '');
  const isConfirmComplete = confirmPin.every((d) => d !== '');

  const renderPinBoxes = (
    values: string[],
    refs: React.MutableRefObject<(TextInput | null)[]>,
    onChange: (text: string, index: number) => void,
    onKeyPress: (e: any, index: number) => void,
    onFocusChange: (index: number | null) => void,
    focusIdx: number | null,
    boxType: 'pin' | 'confirm',
  ) => (
    <View style={{ flexDirection: 'row', gap: 12, marginBottom: 8 }}>
      {values.map((digit, index) => {
        const isFoc = focusIdx === index;
        const isFilled = digit !== '';
        return (
          <View key={index} style={{ flex: 1 }}>
            <TextInput
              ref={(ref) => { refs.current[index] = ref; }}
              value={digit}
              onChangeText={(text) => onChange(text, index)}
              onKeyPress={(e) => onKeyPress(e, index)}
              onFocus={() => onFocusChange(index)}
              onBlur={() => onFocusChange(null)}
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
                borderColor: isFoc ? colors.primary : isFilled ? `${colors.primary}66` : colors.border,
                backgroundColor: isFoc
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
  );

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
        <LinearGradient
          colors={[colors.primary, `${colors.primary}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: 20, paddingBottom: 32, paddingHorizontal: 24 }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: `${colors.secondary}26`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 20,
            }}
            activeOpacity={0.7}
          >
            <Feather name="arrow-left" size={20} color={colors.secondary} />
          </TouchableOpacity>

          {/* Step Indicator */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            {STEPS.map((s, i) => (
              <View key={s} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 14,
                  backgroundColor: i <= 2 ? colors.secondary : `${colors.secondary}33`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {i < 2
                    ? <Feather name="check" size={13} color={colors.primary} />
                    : <Feather name="lock" size={13} color={colors.primary} />
                  }
                </View>
                <Text style={{
                  fontSize: 12, fontWeight: i === 2 ? '700' : '500',
                  color: colors.secondary,
                  marginLeft: 6,
                }}>
                  {s}
                </Text>
                {i < STEPS.length - 1 && (
                  <View style={{
                    width: 24, height: 1.5,
                    backgroundColor: `${colors.secondary}4D`,
                    marginHorizontal: 8,
                  }} />
                )}
              </View>
            ))}
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: colors.secondary, letterSpacing: -0.5 }}>
            {step === 'pin' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </Text>
          <Text style={{ fontSize: 13, color: `${colors.secondary}99`, marginTop: 4 }}>
            {step === 'pin'
              ? 'Enter a 4-digit PIN to secure your wallet'
              : 'Re-enter your PIN to confirm'}
          </Text>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 32 }}>

            {/* Step sub-indicator */}
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {['Enter PIN', 'Confirm PIN'].map((label, i) => (
                <View
                  key={label}
                  style={{
                    flex: 1,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: (step === 'pin' && i === 0) || (step === 'confirm' && i <= 1)
                      ? colors.primary
                      : colors.border,
                  }}
                />
              ))}
            </View>

            {/* PIN Boxes */}
            {step === 'pin' ? (
              renderPinBoxes(pin, pinRefs, handlePinChange, (e, i) => handleKeyPress(e, i, 'pin'), setFocusedIndex, focusedIndex, 'pin')
            ) : (
              renderPinBoxes(confirmPin, confirmRefs, handleConfirmChange, (e, i) => handleKeyPress(e, i, 'confirm'), setConfirmFocusedIndex, confirmFocusedIndex, 'confirm')
            )}

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

            {/* Action Button */}
            {step === 'confirm' ? (
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={loading || !isConfirmComplete}
                activeOpacity={0.85}
                style={{ opacity: loading || !isConfirmComplete ? 0.6 : 1, marginBottom: 16 }}
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
                        {isConfirmComplete ? 'Create PIN' : 'Enter confirm PIN'}
                      </Text>
                      {isConfirmComplete && <Feather name="check" size={18} color={colors.secondary} />}
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                onPress={() => {
                  if (isPinComplete) {
                    setStep('confirm');
                    setTimeout(() => confirmRefs.current[0]?.focus(), 100);
                  }
                }}
                disabled={!isPinComplete}
                activeOpacity={0.85}
                style={{ opacity: !isPinComplete ? 0.6 : 1, marginBottom: 16 }}
              >
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: colors.secondary, marginRight: 8 }}>
                    {isPinComplete ? 'Continue' : 'Enter 4-digit PIN'}
                  </Text>
                  {isPinComplete && <Feather name="arrow-right" size={18} color={colors.secondary} />}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Security Note */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="shield" size={12} color={colors.textSecondary} />
              <Text style={{ fontSize: 11, marginLeft: 6, color: colors.textSecondary }}>
                Your PIN is encrypted and stored securely
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}