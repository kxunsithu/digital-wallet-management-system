// app/auth/forgot-pin.tsx
import { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { useTheme } from '../../providers/ThemeProvider';
import { forgotPin } from '../../services/auth';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPinScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const handleSubmit = async () => {
    const trimmedPhone = phone.trim();
    if (!trimmedPhone) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your phone number' });
      return;
    }

    setLoading(true);
    const response = await forgotPin(trimmedPhone);
    setLoading(false);

    if (response.status === 200 && response.body?.success) {
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: 'A verification code has been sent to your phone number.'
      });
      router.push({ pathname: '/auth/reset-pin', params: { phone: trimmedPhone } });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: response.body?.message ?? 'Failed to send OTP. Please try again.'
      });
    }
  };

  return (
    <View
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
            Forgot PIN
          </Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 16 }}>

            {/* Icon */}
            <View style={{
              width: 72, height: 72, borderRadius: 24,
              backgroundColor: `${colors.primary}1A`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              <Feather name="lock" size={32} color={colors.primary} />
            </View>

            <View style={{ width: '100%', marginBottom: 32 }}>
              <Text style={{
                fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', letterSpacing: -0.5,
              }}>
                Forgot PIN
              </Text>
              <Text style={{
                textAlign: 'center', marginTop: 10,
                color: colors.textSecondary, fontSize: 14, lineHeight: 22,
              }}>
                Enter your phone number to receive a verification code
              </Text>
            </View>

            {/* Phone Input */}
            <View style={{ width: '100%', marginBottom: 24 }}>
              <Text style={{
                fontSize: 11, fontWeight: '700', color: colors.textSecondary,
                textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8,
              }}>
                Phone Number
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1.5,
                borderColor: isFocused ? colors.primary : colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}>
                <Feather
                  name="phone"
                  size={20}
                  color={isFocused ? colors.primary : colors.textSecondary}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  placeholder="09xxxxxxxx"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1, paddingVertical: 16,
                    fontSize: 16, fontWeight: '500',
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
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 6, marginLeft: 4 }}>
                Enter your registered phone number
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={{ width: '100%', opacity: loading ? 0.7 : 1 }}
              onPress={handleSubmit}
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
                      Send OTP
                    </Text>
                    <Feather name="send" size={18} color={colors.secondary} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Back to Sign In */}
            <TouchableOpacity
              onPress={() => router.push('/auth')}
              style={{ marginTop: 24 }}
            >
              <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                Remember your PIN?{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>Sign In</Text>
              </Text>
            </TouchableOpacity>

            <View style={{ marginTop: 32 }}>
              <Text style={{ fontSize: 11, textAlign: 'center', color: colors.textSecondary }}>
                A verification code will be sent to your registered phone number
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}