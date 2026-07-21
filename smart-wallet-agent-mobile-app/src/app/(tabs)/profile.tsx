// app/(tabs)/profile.tsx
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import { logout } from "../../services/auth";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  status: string;
  role?: string;
  agent_profile: {
    agent_code: string;
    shop_name: string | null;
    shop_address: string | null;
    float_balance: number;
  } | null;
  wallet: {
    wallet_number: string;
    balance: number;
  } | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changePinModal, setChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/profile");
      if (res.status === 200 && res.body?.success) {
        setProfile(res.body.data);
      } else if (res.status === 401) {
        router.replace("/auth");
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: "success", text1: "Logged Out", text2: "Successfully signed out" });
      router.replace("/auth");
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to sign out" });
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || currentPin.length !== 4) { Toast.show({ type: "error", text1: "Error", text2: "Please enter current PIN (4 digits)" }); return; }
    if (!newPin || newPin.length !== 4) { Toast.show({ type: "error", text1: "Error", text2: "New PIN must be 4 digits" }); return; }
    if (newPin !== confirmPin) { Toast.show({ type: "error", text1: "Error", text2: "PINs do not match" }); return; }

    setSubmitting(true);
    try {
      const res = await apiFetch("/profile/change-pin", {
        method: "POST",
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin, new_pin_confirmation: confirmPin }),
      });
      if (res.status === 200 && res.body?.success) {
        Toast.show({ type: "success", text1: "Success", text2: "PIN changed successfully" });
        setChangePinModal(false);
        setCurrentPin(""); setNewPin(""); setConfirmPin("");
      } else {
        Toast.show({ type: "error", text1: "Error", text2: res.body?.message ?? "Failed to change PIN" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#D5E726" />
      </View>
    );
  }

  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A';

  const SettingRow = ({
    icon, label, onPress, danger = false, rightElement,
  }: {
    icon: any; label: string; onPress: () => void; danger?: boolean; rightElement?: React.ReactNode;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        flexDirection: 'row', alignItems: 'center',
        padding: 16, borderRadius: 16,
        backgroundColor: danger
          ? (isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)')
          : (isDark ? '#161814' : '#FFFFFF'),
        borderWidth: 1,
        borderColor: danger
          ? 'rgba(239,68,68,0.2)'
          : (isDark ? '#2F332B' : '#E2E8F0'),
        marginBottom: 10,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: danger ? 'rgba(239,68,68,0.1)' : 'rgba(213,231,38,0.1)',
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
      }}>
        <Feather name={icon} size={17} color={danger ? '#EF4444' : '#D5E726'} />
      </View>
      <Text style={{
        flex: 1, fontSize: 14, fontWeight: '600',
        color: danger ? '#EF4444' : (isDark ? '#FFFFFF' : '#0A0B09'),
      }}>
        {label}
      </Text>
      {rightElement ?? <Feather name="chevron-right" size={18} color={danger ? '#EF4444' : (isDark ? '#4B5563' : '#CBD5E1')} />}
    </TouchableOpacity>
  );

  const PinInput = ({
    label, value, onChange,
  }: { label: string; value: string; onChange: (t: string) => void }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        placeholder="• • • •"
        placeholderTextColor={isDark ? '#4B5563' : '#9CA3AF'}
        style={{
          padding: 14, borderRadius: 14,
          borderWidth: 1.5,
          borderColor: isDark ? '#2F332B' : '#E2E8F0',
          backgroundColor: isDark ? '#0A0B09' : '#F8FAFC',
          fontSize: 20,
          textAlign: 'center',
          letterSpacing: 12,
          fontWeight: '800',
          color: isDark ? '#FFFFFF' : '#0A0B09',
        }}
        value={value}
        onChangeText={onChange}
        keyboardType="numeric"
        maxLength={4}
        secureTextEntry
      />
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.5 }}>
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <LinearGradient
            colors={isDark ? ['#161A0F', '#1A1E12'] : ['#FAFFF0', '#F5FAD8']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24, padding: 24,
              borderWidth: 1,
              borderColor: isDark ? '#2F3A10' : '#DDE826',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              <LinearGradient
                colors={['#D5E726', '#A8B81A']}
                style={{
                  width: 64, height: 64, borderRadius: 20,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#0A0B09' }}>
                  {avatarLetter}
                </Text>
              </LinearGradient>

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.3 }}>
                  {profile?.full_name ?? 'User'}
                </Text>
                <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', marginTop: 2 }}>
                  {profile?.phone_number}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981', marginRight: 5 }} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {profile?.status ?? 'Active'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={{
              flexDirection: 'row',
              marginTop: 20, paddingTop: 20,
              borderTopWidth: 1,
              borderTopColor: isDark ? '#2F3A10' : '#DDE826',
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  Agent Code
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 4 }}>
                  {profile?.agent_profile?.agent_code ?? 'N/A'}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: isDark ? '#2F3A10' : '#DDE826' }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  Wallet No.
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 4 }}>
                  {profile?.wallet?.wallet_number ?? 'N/A'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Settings Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Account Settings
          </Text>

          <SettingRow
            icon="lock"
            label="Change PIN"
            onPress={() => setChangePinModal(true)}
          />
          <SettingRow
            icon={isDark ? 'sun' : 'moon'}
            label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onPress={toggleTheme}
            rightElement={
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: isDark ? '#D5E726' : '#E2E8F0',
                alignItems: isDark ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: isDark ? '#0A0B09' : '#FFFFFF',
                }} />
              </View>
            }
          />
        </View>

        {/* Danger Zone */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Account
          </Text>
          <SettingRow
            icon="log-out"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>
      </ScrollView>

      {/* Change PIN Modal */}
      <Modal visible={changePinModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28,
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              borderTopWidth: 1,
              borderTopColor: isDark ? '#2F332B' : '#E2E8F0',
            }}>
              {/* Handle Bar */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: isDark ? '#2F332B' : '#E2E8F0',
                }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                  Change PIN
                </Text>
                <TouchableOpacity onPress={() => setChangePinModal(false)} activeOpacity={0.7}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: isDark ? '#0A0B09' : '#F8FAFC',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name="x" size={18} color={isDark ? '#FFFFFF' : '#0A0B09'} />
                  </View>
                </TouchableOpacity>
              </View>

              <PinInput label="Current PIN" value={currentPin} onChange={setCurrentPin} />
              <PinInput label="New PIN" value={newPin} onChange={setNewPin} />
              <PinInput label="Confirm New PIN" value={confirmPin} onChange={setConfirmPin} />

              <TouchableOpacity
                onPress={handleChangePin}
                disabled={submitting}
                activeOpacity={0.85}
                style={{ marginTop: 8, opacity: submitting ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={['#D5E726', '#C4D420']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color="#0A0B09" />
                    : <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A0B09' }}>Update PIN</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}