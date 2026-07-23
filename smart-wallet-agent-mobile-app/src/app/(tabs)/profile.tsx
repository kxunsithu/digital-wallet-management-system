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
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import { logout } from "../../services/auth";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { getAutoSaveReceipt, setAutoSaveReceipt } from "../../services/settingsStore";

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
  nrc_number: string | null;
  status: string;
  role?: string;
  images?: {
    id: number;
    image_type: string;
    image_url: string | null;
    original_name: string | null;
    image_size: number | null;
  }[];
  agent_profile: {
    id: number;
    agent_code: string;
    shop_name: string | null;
    shop_address: string | null;
  } | null;
  wallet: {
    id: number;
    wallet_number: string;
    balance: number;
    status: string;
  } | null;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changePinModal, setChangePinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Edit state
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editProfileImageUri, setEditProfileImageUri] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Receipt Setting state
  const [autoSaveReceipt, setAutoSaveReceiptState] = useState(false);

  // Logout Modal state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchProfile = useCallback(async (isRefresh = false) => {
    if (!isRefresh && !profile) setLoading(true);
    try {
      const res = await apiFetch("/profile");
      if (res.status === 200 && res.body?.success) {
        setProfile(res.body.data);
      } else if (res.status === 401) {
        router.replace("/auth");
      }
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => { fetchProfile(); }, []);

  // Load Auto-Save setting on mount and focus
  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
      getAutoSaveReceipt().then(setAutoSaveReceiptState);
    }, [fetchProfile])
  );

  const handleOpenEditProfile = () => {
    setEditFullName(profile?.full_name ?? "");
    setEditProfileImageUri(profile?.images?.find(img => img.image_type === 'profile_image')?.image_url ?? null);
    setEditProfileModal(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: 'Permission Denied',
        text2: 'Photos permission is required to change profile picture.',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setEditProfileImageUri(result.assets[0].uri);
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFullName.trim()) {
      Toast.show({ type: "error", text1: "Error", text2: "Full name is required" });
      return;
    }
    setUpdatingProfile(true);
    try {
      let uploadSuccess = true;
      const isLocalUri = editProfileImageUri && (editProfileImageUri.startsWith("file://") || editProfileImageUri.startsWith("content://") || !editProfileImageUri.startsWith("http"));

      if (isLocalUri && editProfileImageUri) {
        const filename = editProfileImageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        const formData = new FormData();
        // @ts-ignore
        formData.append('profile_image', {
          uri: Platform.OS === 'android' ? editProfileImageUri : editProfileImageUri.replace('file://', ''),
          name: filename,
          type,
        });

        const imgRes = await apiFetch("/profile/upload-profile-picture", {
          method: "POST",
          body: formData,
        });

        if (imgRes.status !== 200 || !imgRes.body?.success) {
          uploadSuccess = false;
          Toast.show({ type: "error", text1: "Upload Failed", text2: imgRes.body?.message ?? "Failed to upload image" });
        }
      }

      if (uploadSuccess) {
        const res = await apiFetch("/profile", {
          method: "PUT",
          body: JSON.stringify({
            full_name: editFullName.trim(),
          }),
        });
        if (res.status === 200 && res.body?.success) {
          Toast.show({ type: "success", text1: "Success", text2: "Profile updated successfully" });
          setEditProfileModal(false);
          await fetchProfile(true);
        } else {
          Toast.show({ type: "error", text1: "Error", text2: res.body?.message ?? "Failed to update profile" });
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Network error" });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleToggleAutoSaveReceipt = async () => {
    const newVal = !autoSaveReceipt;
    setAutoSaveReceiptState(newVal);
    await setAutoSaveReceipt(newVal);
    Toast.show({
      type: "info",
      text1: "Receipt Settings Updated",
      text2: newVal ? "Auto-Save Receipt enabled" : "Auto-Save Receipt disabled",
    });
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
      Toast.show({ type: "success", text1: "Logged Out", text2: "Successfully signed out" });
      router.replace("/auth");
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to sign out" });
    } finally {
      setLoggingOut(false);
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

  if (loading && !profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const avatarImage = profile?.images?.find(img => img.image_type === 'profile_image')?.image_url;
  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A';

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{
      padding: 20,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
    }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
        {title}
      </Text>
      {children}
    </View>
  );

  const InfoRow = ({ label, value, icon }: { label: string; value: string; icon: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: `${colors.border}4D` }}>
      <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
        <Feather name={icon as any} size={13} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: colors.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text, marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );

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
          ? `${colors.error}14`
          : (colors.surface),
        borderWidth: 1,
        borderColor: danger
          ? `${colors.error}33`
          : colors.border,
        marginBottom: 10,
      }}
    >
      <View style={{
        width: 38, height: 38, borderRadius: 12,
        backgroundColor: danger ? `${colors.error}1A` : `${colors.primary}1A`,
        alignItems: 'center', justifyContent: 'center',
        marginRight: 14,
      }}>
        <Feather name={icon} size={17} color={danger ? colors.error : colors.primary} />
      </View>
      <Text style={{
        flex: 1, fontSize: 14, fontWeight: '600',
        color: danger ? colors.error : (colors.text),
      }}>
        {label}
      </Text>
      {rightElement ?? <Feather name="chevron-right" size={18} color={danger ? colors.error : colors.textSecondary} />}
    </TouchableOpacity>
  );

  const PinInput = ({
    label, value, onChange,
  }: { label: string; value: string; onChange: (t: string) => void }) => (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
        {label}
      </Text>
      <TextInput
        placeholder="• • • •"
        placeholderTextColor={colors.textSecondary}
        style={{
          padding: 14, borderRadius: 14,
          borderWidth: 1.5,
          borderColor: colors.border,
          backgroundColor: isDark ? colors.background : `${colors.border}22`,
          fontSize: 20,
          textAlign: 'center',
          letterSpacing: 12,
          fontWeight: '800',
          color: colors.text,
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
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            Profile
          </Text>
        </View>

        {/* Profile Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <LinearGradient
            colors={isDark ? [colors.surface, `${colors.primary}14`] : [`${colors.primary}14`, `${colors.primary}28`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24, padding: 24,
              borderWidth: 1,
              borderColor: `${colors.primary}33`,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              {avatarImage ? (
                <Image
                  source={{ uri: avatarImage }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 20,
                    marginRight: 16,
                  }}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}99`]}
                  style={{
                    width: 64, height: 64, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Text style={{ fontSize: 28, fontWeight: '900', color: colors.background }}>
                    {avatarLetter}
                  </Text>
                </LinearGradient>
              )}

              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, letterSpacing: -0.3 }}>
                  {profile?.full_name ?? 'User'}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                  {profile?.phone_number}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.success, marginRight: 5 }} />
                  <Text style={{ fontSize: 10, fontWeight: '600', color: colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
              borderTopColor: `${colors.primary}33`,
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  Agent Code
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  {profile?.agent_profile?.agent_code ?? 'N/A'}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: `${colors.primary}33` }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  Wallet No.
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  {profile?.wallet?.wallet_number ?? 'N/A'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Personal Details */}
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <InfoCard title="Personal Details">
            <InfoRow label="Full Name" value={profile?.full_name ?? '—'} icon="user" />
            <InfoRow label="Phone Number" value={profile?.phone_number ?? '—'} icon="phone" />
            <InfoRow label="NRC Number" value={profile?.nrc_number ?? '—'} icon="credit-card" />
            <InfoRow label="Account Status" value={profile?.status ?? '—'} icon="check-circle" />
          </InfoCard>
        </View>

        {/* Shop Details */}
        {profile?.agent_profile && (
          <View style={{ paddingHorizontal: 24 }}>
            <InfoCard title="Shop & Agent Details">
              <InfoRow label="Shop Name" value={profile.agent_profile.shop_name ?? '—'} icon="shopping-bag" />
              <InfoRow label="Shop Address" value={profile.agent_profile.shop_address ?? '—'} icon="map-pin" />
              <InfoRow label="Agent Code" value={profile.agent_profile.agent_code ?? '—'} icon="hash" />
            </InfoCard>
          </View>
        )}

        {/* Wallet Details */}
        {profile?.wallet && (
          <View style={{ paddingHorizontal: 24 }}>
            <InfoCard title="Wallet Details">
              <InfoRow label="Wallet Number" value={profile.wallet.wallet_number ?? '—'} icon="pocket" />
              <InfoRow label="Wallet Balance" value={`${profile.wallet.balance.toLocaleString()} MMK`} icon="dollar-sign" />
              <InfoRow label="Wallet Status" value={profile.wallet.status ?? '—'} icon="info" />
            </InfoCard>
          </View>
        )}

        {/* Settings Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Account Settings
          </Text>

          <SettingRow
            icon="edit-3"
            label="Edit Profile"
            onPress={handleOpenEditProfile}
          />
          <SettingRow
            icon="lock"
            label="Change PIN"
            onPress={() => setChangePinModal(true)}
          />
          <SettingRow
            icon="file-text"
            label="Auto-Save & Download Receipt"
            onPress={handleToggleAutoSaveReceipt}
            rightElement={
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: autoSaveReceipt ? colors.primary : colors.border,
                alignItems: autoSaveReceipt ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: autoSaveReceipt ? colors.background : colors.text,
                }} />
              </View>
            }
          />
          <SettingRow
            icon={isDark ? 'sun' : 'moon'}
            label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onPress={toggleTheme}
            rightElement={
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: isDark ? colors.primary : colors.border,
                alignItems: isDark ? 'flex-end' : 'flex-start',
                justifyContent: 'center',
                paddingHorizontal: 3,
              }}>
                <View style={{
                  width: 20, height: 20, borderRadius: 10,
                  backgroundColor: isDark ? colors.background : colors.text,
                }} />
              </View>
            }
          />
        </View>

        {/* Danger Zone */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Account
          </Text>
          <SettingRow
            icon="log-out"
            label="Sign Out"
            onPress={() => setLogoutModalVisible(true)}
            danger
          />
        </View>
      </ScrollView>
      {/* Edit Profile Modal */}
      <Modal visible={editProfileModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: colors.border,
                }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  Edit Profile
                </Text>
                <TouchableOpacity onPress={() => setEditProfileModal(false)} activeOpacity={0.7}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: isDark ? colors.background : `${colors.border}33`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Profile Image Picker */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={{ position: 'relative' }}>
                  {editProfileImageUri ? (
                    <Image
                      source={{ uri: editProfileImageUri }}
                      style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primary }}
                    />
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                      <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>
                        {avatarLetter}
                      </Text>
                    </View>
                  )}
                  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface }}>
                    <Feather name="camera" size={12} color={colors.background} />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>
                  Tap photo to change
                </Text>
              </View>

              {/* Full Name Input */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  Full Name
                </Text>
                <TextInput
                  placeholder="Your full name"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    padding: 14, borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : `${colors.border}22`,
                    fontSize: 15,
                    fontWeight: '600',
                    color: colors.text,
                  }}
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
              </View>

              <TouchableOpacity
                onPress={handleUpdateProfile}
                disabled={updatingProfile}
                activeOpacity={0.85}
                style={{ marginTop: 8, opacity: updatingProfile ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {updatingProfile
                    ? <ActivityIndicator size="small" color={colors.background} />
                    : <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>Save Changes</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
      {/* Change PIN Modal */}
      <Modal visible={changePinModal} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={{
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 40, height: 4, borderRadius: 2,
                  backgroundColor: colors.border,
                }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  Change PIN
                </Text>
                <TouchableOpacity onPress={() => setChangePinModal(false)} activeOpacity={0.7}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: isDark ? colors.background : `${colors.border}33`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name="x" size={18} color={colors.text} />
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
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={colors.background} />
                    : <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>Update PIN</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* ── LOGOUT CONFIRMATION MODAL BOX ── */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24 }}>
          <View style={{
            width: '100%', maxWidth: 340, borderRadius: 24, padding: 24,
            backgroundColor: colors.surface,
            borderWidth: 1, borderColor: colors.border,
            alignItems: 'center',
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: `${colors.error}1F`,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Feather name="log-out" size={24} color={colors.error} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
              Sign Out
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
              Are you sure you want to sign out of your account?
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                disabled={loggingOut}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.border,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleConfirmLogout}
                disabled={loggingOut}
                style={{ flex: 1 }}
              >
                <View style={{
                  paddingVertical: 14, borderRadius: 14,
                  backgroundColor: colors.error,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {loggingOut ? (
                    <ActivityIndicator size="small" color={colors.text} />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                      Sign Out
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}