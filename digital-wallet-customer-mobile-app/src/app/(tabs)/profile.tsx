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
  Pressable,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import { logout } from "../../services/auth";
import { useRouter, useFocusEffect } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { getAutoSaveReceipt, setAutoSaveReceipt } from "../../services/settingsStore";
import NrcImagePreviewModal from "../../components/NrcImagePreviewModal";
import NRCInput from "../../components/NRCInput";

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
  nrc_number: string | null;
  state_region?: string | null;
  township?: string | null;
  status: string;
  role?: string;
  kyc_status?: string | null;
  nrc_verification?: {
    id: number;
    status: string;
    rejection_reason: string | null;
  } | null;
  images?: {
    id: number;
    image_type: string;
    image_url: string | null;
    original_name: string | null;
    image_size: number | null;
  }[];
  nrc_images?: {
    id: number;
    image_type: string;
    image_url: string | null;
    original_name: string | null;
    image_size: number | null;
  }[];
  agent_profile: {
    agent_code: string;
    shop_name: string | null;
    shop_address: string | null;
  } | null;
  wallet: {
    wallet_number: string;
    balance: number;
    status?: string;
  } | null;
}

type ProfileColors = ReturnType<typeof useTheme>["colors"];

const NrcDocumentCard = ({
  label,
  uri,
  colors,
  isDark,
  onPress,
}: {
  label: string;
  uri: string;
  colors: ProfileColors;
  isDark: boolean;
  onPress: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={{
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: isDark ? colors.background : `${colors.border}14`,
      overflow: 'hidden',
    }}
  >
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginRight: 8 }} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 0.8 }}>
        {label}
      </Text>
    </View>
    <View>
      <Image
        source={{ uri }}
        style={{ width: '100%', height: 150, backgroundColor: `${colors.border}22` }}
        resizeMode="cover"
      />
      <View style={{
        position: 'absolute', right: 8, bottom: 8,
        width: 30, height: 30, borderRadius: 15,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Feather name="maximize-2" size={14} color="#FFFFFF" />
      </View>
    </View>
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [changePinModal, setChangePinModal] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Profile Edit state
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [editFullName, setEditFullName] = useState("");
  const [editNrcNumber, setEditNrcNumber] = useState("");
  const [editStateRegion, setEditStateRegion] = useState("");
  const [editTownship, setEditTownship] = useState("");
  const [editProfileImageUri, setEditProfileImageUri] = useState<string | null>(null);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // NRC image preview state
  const [previewImage, setPreviewImage] = useState<{ uri: string; label: string } | null>(null);

  // NRC Verification state
  const [nrcModalVisible, setNrcModalVisible] = useState(false);
  const [nrcFrontUri, setNrcFrontUri] = useState<string | null>(null);
  const [nrcBackUri, setNrcBackUri] = useState<string | null>(null);
  const [submittingNrc, setSubmittingNrc] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      fetchProfile(true);
      getAutoSaveReceipt().then(setAutoSaveReceiptState);
    }, [fetchProfile])
  );

  const handleOpenEditProfile = () => {
    setEditFullName(profile?.full_name ?? "");
    setEditNrcNumber(profile?.nrc_number ?? "");
    setEditStateRegion(profile?.state_region ?? "");
    setEditTownship(profile?.township ?? "");
    setEditProfileImageUri(
      profile?.images?.find(img => img.image_type === 'profile_image')?.image_url ?? null
    );
    setEditProfileModal(true);
  };

  const handleOpenNrcModal = () => {
    setNrcFrontUri(profile?.nrc_images?.find(img => img.image_type === 'nrc_front_image')?.image_url ?? null);
    setNrcBackUri(profile?.nrc_images?.find(img => img.image_type === 'nrc_back_image')?.image_url ?? null);
    setNrcModalVisible(true);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: t('profile.permission_denied_title'),
        text2: t('profile.permission_denied_desc'),
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
      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 4.5 * 1024 * 1024) {
        Toast.show({
          type: 'error',
          text1: t('profile.image_too_large_title'),
          text2: t('profile.image_too_large_desc'),
        });
        return;
      }
      setEditProfileImageUri(asset.uri);
    }
  };

  const pickNrcImage = async (side: 'front' | 'back') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: t('profile.permission_denied_title'),
        text2: t('profile.permission_denied_desc'),
      });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (side === 'front') {
        setNrcFrontUri(result.assets[0].uri);
      } else {
        setNrcBackUri(result.assets[0].uri);
      }
    }
  };

  const handleUpdateProfile = async () => {
    if (!editFullName.trim()) {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("profile.full_name_required") });
      return;
    }
    setUpdatingProfile(true);
    try {
      let uploadSuccess = true;
      const isLocalUri = editProfileImageUri &&
        (editProfileImageUri.startsWith("file://") ||
          editProfileImageUri.startsWith("content://") ||
          !editProfileImageUri.startsWith("http"));

      if (isLocalUri && editProfileImageUri) {
        const cleanUri = editProfileImageUri.split('?')[0];
        const ext = cleanUri.split('.').pop()?.toLowerCase();
        const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
        const filename = `profile_${Date.now()}.${ext === 'png' ? 'png' : 'jpg'}`;

        const formData = new FormData();
        // @ts-ignore
        formData.append('profile_image', { uri: editProfileImageUri, name: filename, type: mimeType });
        const imgRes = await apiFetch("/profile/upload-profile-picture", {
          method: "POST",
          body: formData,
        });
        if (imgRes.status !== 200 || !imgRes.body?.success) {
          uploadSuccess = false;
          Toast.show({ type: "error", text1: t('common.error'), text2: imgRes.body?.message ?? t('profile.upload_image_failed') });
        }
      }

      if (uploadSuccess) {
        const res = await apiFetch("/profile", {
          method: "PUT",
          body: JSON.stringify({
            full_name: editFullName.trim(),
            nrc_number: editNrcNumber.trim(),
            state_region: editStateRegion.trim() || null,
            township: editTownship.trim() || null,
          }),
        });
        if (res.status === 200 && res.body?.success) {
          Toast.show({ type: "success", text1: t("common.success"), text2: t("profile.profile_updated") });
          setEditProfileModal(false);
          await fetchProfile(true);
        } else {
          Toast.show({ type: "error", text1: t('common.error'), text2: res.body?.message ?? t('profile.update_profile_failed') });
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleSubmitNrc = async () => {
    if (!nrcFrontUri || !nrcBackUri) {
      Toast.show({ type: "error", text1: t("common.required"), text2: t("profile.select_nrc_images") });
      return;
    }
    setSubmittingNrc(true);
    try {
      const formData = new FormData();

      const frontClean = nrcFrontUri.split('?')[0];
      const frontExt = frontClean.split('.').pop()?.toLowerCase();
      const frontMime = frontExt === 'png' ? 'image/png' : 'image/jpeg';
      const frontFilename = `nrc_front_${Date.now()}.${frontExt === 'png' ? 'png' : 'jpg'}`;

      const backClean = nrcBackUri.split('?')[0];
      const backExt = backClean.split('.').pop()?.toLowerCase();
      const backMime = backExt === 'png' ? 'image/png' : 'image/jpeg';
      const backFilename = `nrc_back_${Date.now()}.${backExt === 'png' ? 'png' : 'jpg'}`;

      // @ts-ignore
      formData.append('nrc_front_image', { uri: nrcFrontUri, name: frontFilename, type: frontMime });
      // @ts-ignore
      formData.append('nrc_back_image', { uri: nrcBackUri, name: backFilename, type: backMime });

      const res = await apiFetch("/customer/nrc-verifications/submit", {
        method: "POST",
        body: formData,
      });

      if (res.status === 200 && res.body?.success) {
        const isEdit = (profile?.nrc_images?.length ?? 0) > 0;
        Toast.show({ type: "success", text1: t("common.success"), text2: t(isEdit ? "profile.nrc_updated" : "profile.nrc_submitted") });
        setNrcModalVisible(false);
        setNrcFrontUri(null);
        setNrcBackUri(null);
        await fetchProfile(true);
      } else {
        Toast.show({ type: "error", text1: t('common.error'), text2: res.body?.message ?? t('profile.submit_verification_failed') });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setSubmittingNrc(false);
    }
  };

  const handleToggleAutoSaveReceipt = async () => {
    const newVal = !autoSaveReceipt;
    setAutoSaveReceiptState(newVal);
    await setAutoSaveReceipt(newVal);
    Toast.show({
      type: "info",
      text1: t("profile.receipt_settings"),
      text2: newVal ? t("profile.receipt_enabled") : t("profile.receipt_disabled"),
    });
  };

  const handleConfirmLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      setLogoutModalVisible(false);
      Toast.show({ type: "success", text1: t("profile.logged_out"), text2: t("profile.logged_out_desc") });
      router.replace("/auth");
    } catch (e) {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("profile.logout_failed") });
    } finally {
      setLoggingOut(false);
    }
  };

  const handleChangePin = async () => {
    if (!currentPin || currentPin.length !== 4) { Toast.show({ type: "error", text1: t("common.error"), text2: t("profile.enter_current_pin") }); return; }
    if (!newPin || newPin.length !== 4) { Toast.show({ type: "error", text1: t("common.error"), text2: t("profile.pin_must_4") }); return; }
    if (newPin !== confirmPin) { Toast.show({ type: "error", text1: t("common.error"), text2: t("profile.pin_mismatch") }); return; }

    setSubmitting(true);
    try {
      const res = await apiFetch("/profile/change-pin", {
        method: "POST",
        body: JSON.stringify({ current_pin: currentPin, new_pin: newPin, new_pin_confirmation: confirmPin }),
      });
      if (res.status === 200 && res.body?.success) {
        Toast.show({ type: "success", text1: t("common.success"), text2: t("profile.pin_changed") });
        setChangePinModal(false);
        setCurrentPin(""); setNewPin(""); setConfirmPin("");
      } else {
        Toast.show({ type: "error", text1: t('common.error'), text2: res.body?.message ?? t('profile.change_pin_failed') });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: t('common.error'), text2: t('common.network_error') });
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
  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U';

  const nrcVerification = profile?.nrc_verification?.status ?? null;
  const nrcStatusConfig: Record<string, { label: string; color: string }> = {
    verified: { label: t('profile.kyc_identity_verified'), color: colors.success },
    pending: { label: t('profile.kyc_pending_title'), color: '#F59E0B' },
    rejected: { label: t('profile.kyc_rejected_title'), color: colors.error },
  };
  const nrcStatus = nrcVerification
    ? nrcStatusConfig[nrcVerification] ?? { label: nrcVerification, color: colors.textSecondary }
    : { label: t('profile.nrc_status_not_submitted'), color: colors.textSecondary };
  const nrcRejectionReason = profile?.nrc_verification?.rejection_reason ?? null;
  const nrcFrontImage = profile?.nrc_images?.find(img => img.image_type === 'nrc_front_image')?.image_url ?? null;
  const nrcBackImage = profile?.nrc_images?.find(img => img.image_type === 'nrc_back_image')?.image_url ?? null;

  const InfoCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{
      padding: 20, borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
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
        backgroundColor: danger ? `${colors.error}14` : colors.surface,
        borderWidth: 1,
        borderColor: danger ? `${colors.error}33` : colors.border,
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
      <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: danger ? colors.error : colors.text }}>
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
          borderWidth: 1.5, borderColor: colors.border,
          backgroundColor: isDark ? colors.background : `${colors.border}22`,
          fontSize: 20, textAlign: 'center',
          letterSpacing: 12, fontWeight: '800', color: colors.text,
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
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 }}>
            {t('profile.title')}
          </Text>
        </View>

        {/* Profile Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <LinearGradient
            colors={isDark ? [colors.surface, `${colors.primary}14`] : [`${colors.primary}14`, `${colors.primary}28`]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: `${colors.primary}33` }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Avatar */}
              {avatarImage ? (
                <Image
                  source={{ uri: avatarImage }}
                  style={{ width: 64, height: 64, borderRadius: 20, marginRight: 16 }}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}99`]}
                  style={{ width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}
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
                    {profile?.status ?? t('profile.status_active')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Row */}
            <View style={{
              flexDirection: 'row', marginTop: 20, paddingTop: 20,
              borderTopWidth: 1, borderTopColor: `${colors.primary}33`,
            }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  {t('profile.customer_id')}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  {profile?.agent_profile?.agent_code ?? String(profile?.id ?? 'N/A')}
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: `${colors.primary}33` }} />
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: '600' }}>
                  {t('profile.wallet_no')}
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text, marginTop: 4 }}>
                  {profile?.wallet?.wallet_number ?? 'N/A'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* KYC Details Card */}
        <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
          {profile?.kyc_status === 'verified' || profile?.kyc_status === 'approved' ? (
            <View style={{
              padding: 16, borderRadius: 20,
              backgroundColor: isDark ? 'rgba(82,196,26,0.08)' : '#F6FFED',
              borderWidth: 1, borderColor: '#B7EB8F',
              flexDirection: 'row', alignItems: 'center',
            }}>
              <View style={{
                width: 38, height: 38, borderRadius: 12,
                backgroundColor: '#52C41A',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 14,
              }}>
                <Feather name="shield" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#52C41A' : '#389E0D' }}>
                  {t('profile.kyc_identity_verified')}
                </Text>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {t('profile.kyc_verified_desc')}
                </Text>
              </View>
            </View>
          ) : profile?.kyc_status === 'pending' ? (
            <View style={{
              padding: 16, borderRadius: 20,
              backgroundColor: isDark ? 'rgba(250,173,20,0.08)' : '#FFFBE6',
              borderWidth: 1, borderColor: '#FFE58F',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 38, height: 38, borderRadius: 12,
                  backgroundColor: '#FAAD14',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Feather name="clock" size={18} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FAAD14' : '#D46B08' }}>
                    {t('profile.kyc_pending_title')}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    {t('profile.kyc_pending_desc')}
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                    {t('profile.nrc_pending_edit_hint')}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleOpenNrcModal} activeOpacity={0.85} style={{ marginTop: 14 }}>
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.background }}>
                    {t('profile.edit_nrc_documents')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{
              padding: 20, borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: profile?.kyc_status === 'rejected' ? `${colors.error}33` : colors.border,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: profile?.kyc_status === 'rejected' ? `${colors.error}14` : `${colors.primary}14`,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Feather
                    name={profile?.kyc_status === 'rejected' ? "alert-triangle" : "shield-off"}
                    size={20}
                    color={profile?.kyc_status === 'rejected' ? colors.error : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: profile?.kyc_status === 'rejected' ? colors.error : colors.text }}>
                    {profile?.kyc_status === 'rejected' ? t('profile.kyc_rejected_title') : t('profile.kyc_verify_identity')}
                  </Text>
                  {profile?.kyc_status === 'rejected' && profile?.nrc_verification?.rejection_reason ? (
                    <Text style={{ fontSize: 12, color: colors.text, marginTop: 4, lineHeight: 16 }}>
                      {t('profile.kyc_rejection_reason', { reason: profile.nrc_verification.rejection_reason })}
                    </Text>
                  ) : null}
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }}>
                    {t('profile.kyc_unverified_desc')}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleOpenNrcModal}
                activeOpacity={0.85}
                style={{ marginTop: 16 }}
              >
                <LinearGradient
                  colors={profile?.kyc_status === 'rejected' ? [colors.error, `${colors.error}CC`] : [colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.background }}>
                    {profile?.kyc_status === 'rejected' ? t('profile.resubmit_nrc') : t('profile.upload_nrc')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Personal Details */}
        <View style={{ paddingHorizontal: 24, marginTop: 20 }}>
          <InfoCard title={t('profile.personal_details')}>
            <InfoRow label={t('profile.full_name')} value={profile?.full_name ?? '—'} icon="user" />
            <InfoRow label={t('profile.phone')} value={profile?.phone_number ?? '—'} icon="phone" />
            <InfoRow label={t('profile.nrc')} value={profile?.nrc_number ?? '—'} icon="credit-card" />
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: `${colors.border}4D` }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: `${colors.primary}12`, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Feather name="shield" size={13} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: colors.textSecondary }}>{t('profile.nrc_status')}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: nrcStatus.color, marginRight: 6 }} />
                  <Text style={{ fontSize: 13, fontWeight: '700', color: nrcStatus.color }}>{nrcStatus.label}</Text>
                </View>
                {nrcStatus.label === t('profile.kyc_rejected_title') && nrcRejectionReason ? (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 3 }}>
                    {t('profile.kyc_rejection_reason', { reason: nrcRejectionReason })}
                  </Text>
                ) : null}
              </View>
            </View>
            <InfoRow label={t('profile.state_region')} value={profile?.state_region ?? '—'} icon="map" />
            <InfoRow label={t('profile.township')} value={profile?.township ?? '—'} icon="map-pin" />
            <InfoRow label={t('profile.account_status')} value={profile?.status ?? '—'} icon="check-circle" />
          </InfoCard>
        </View>

        {/* NRC Documents */}
        <View style={{ paddingHorizontal: 24 }}>
          <InfoCard title={t('profile.nrc_documents')}>
            {nrcFrontImage || nrcBackImage ? (
              <View>
                <View style={{ flexDirection: 'row', marginHorizontal: -5 }}>
                  {nrcFrontImage ? (
                    <View style={{ flex: 1, marginHorizontal: 5 }}>
                      <NrcDocumentCard
                        label={t('profile.front')}
                        uri={nrcFrontImage}
                        colors={colors}
                        isDark={isDark}
                        onPress={() => setPreviewImage({ uri: nrcFrontImage, label: t('profile.front_side') })}
                      />
                    </View>
                  ) : null}
                  {nrcBackImage ? (
                    <View style={{ flex: 1, marginHorizontal: 5 }}>
                      <NrcDocumentCard
                        label={t('profile.back')}
                        uri={nrcBackImage}
                        colors={colors}
                        isDark={isDark}
                        onPress={() => setPreviewImage({ uri: nrcBackImage, label: t('profile.back_side') })}
                      />
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 }}>
                  <Feather name="maximize" size={12} color={colors.textSecondary} />
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginLeft: 6 }}>
                    {t('profile.tap_to_preview')}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <View style={{
                  width: 52, height: 52, borderRadius: 26,
                  backgroundColor: `${colors.border}33`,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Feather name="file-text" size={24} color={colors.textSecondary} />
                </View>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 12 }}>
                  {t('profile.no_nrc_images')}
                </Text>
              </View>
            )}
          </InfoCard>
        </View>

        {/* Wallet Details */}
        {profile?.wallet && (
          <View style={{ paddingHorizontal: 24 }}>
            <InfoCard title={t('profile.wallet_details')}>
              <InfoRow label={t('profile.wallet_number')} value={profile.wallet.wallet_number ?? '—'} icon="pocket" />
              <InfoRow label={t('profile.wallet_balance')} value={`${Number(profile.wallet.balance).toLocaleString()} ${t('common.mmk')}`} icon="dollar-sign" />
              <InfoRow label={t('profile.wallet_status')} value={profile.wallet.status ?? t('profile.status_active')} icon="info" />
            </InfoCard>
          </View>
        )}

        {/* Settings Section */}
        <View style={{ paddingHorizontal: 24, marginTop: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            {t('profile.account_settings')}
          </Text>

          <SettingRow icon="edit-3" label={t('profile.edit_profile')} onPress={handleOpenEditProfile} />
          <SettingRow icon="lock" label={t('profile.change_pin')} onPress={() => setChangePinModal(true)} />
          <SettingRow
            icon="globe"
            label={t('profile.language_setting')}
            onPress={() => setLanguageModalVisible(true)}
            rightElement={
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                  {language === 'en' ? 'English' : 'မြန်မာ'}
                </Text>
                <Feather name="chevron-right" size={18} color={colors.textSecondary} />
              </View>
            }
          />
          <SettingRow
            icon="file-text"
            label={t('profile.auto_save_receipt')}
            onPress={handleToggleAutoSaveReceipt}
            rightElement={
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: autoSaveReceipt ? colors.primary : colors.border,
                alignItems: autoSaveReceipt ? 'flex-end' : 'flex-start',
                justifyContent: 'center', paddingHorizontal: 3,
              }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: autoSaveReceipt ? colors.background : colors.text }} />
              </View>
            }
          />
          <SettingRow
            icon={isDark ? 'sun' : 'moon'}
            label={isDark ? t('profile.theme_toggle_light') : t('profile.theme_toggle_dark')}
            onPress={toggleTheme}
            rightElement={
              <View style={{
                width: 44, height: 26, borderRadius: 13,
                backgroundColor: isDark ? colors.primary : colors.border,
                alignItems: isDark ? 'flex-end' : 'flex-start',
                justifyContent: 'center', paddingHorizontal: 3,
              }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: isDark ? colors.background : colors.text }} />
              </View>
            }
          />
        </View>

        {/* Danger Zone */}
        <View style={{ paddingHorizontal: 24, marginTop: 8 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            {t('profile.title')}
          </Text>
          <SettingRow icon="log-out" label={t('common.sign_out')} onPress={() => setLogoutModalVisible(true)} danger />
        </View>
      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal visible={editProfileModal} animationType="slide" transparent onRequestClose={() => setEditProfileModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setEditProfileModal(false)} />
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
            maxHeight: '90%',
          }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{t('profile.edit_profile')}</Text>
                <TouchableOpacity onPress={() => setEditProfileModal(false)} activeOpacity={0.7}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? colors.background : `${colors.border}33`, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Profile Image Picker */}
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <TouchableOpacity onPress={pickImage} activeOpacity={0.8} style={{ position: 'relative' }}>
                  {editProfileImageUri ? (
                    <Image source={{ uri: editProfileImageUri }} style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primary }} />
                  ) : (
                    <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.primary }}>
                      <Text style={{ fontSize: 32, fontWeight: '800', color: colors.primary }}>{avatarLetter}</Text>
                    </View>
                  )}
                  <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surface }}>
                    <Feather name="camera" size={12} color={colors.background} />
                  </View>
                </TouchableOpacity>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 8 }}>{t('profile.tap_photo_to_change')}</Text>
              </View>

              {/* Full Name */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  {t('profile.full_name')}
                </Text>
                <TextInput
                  placeholder={t('profile.placeholder_full_name')}
                  placeholderTextColor={colors.textSecondary}
                  style={{ padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: isDark ? colors.background : `${colors.border}22`, fontSize: 15, fontWeight: '600', color: colors.text }}
                  value={editFullName}
                  onChangeText={setEditFullName}
                />
              </View>

              {/* NRC Number */}
              <NRCInput
                value={editNrcNumber}
                onChange={setEditNrcNumber}
                label={t('profile.nrc')}
                required={false}
              />

              {/* State / Region */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  {t('profile.state_region')}
                </Text>
                <TextInput
                  placeholder={t('profile.placeholder_state_region')}
                  placeholderTextColor={colors.textSecondary}
                  style={{ padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: isDark ? colors.background : `${colors.border}22`, fontSize: 15, fontWeight: '600', color: colors.text }}
                  value={editStateRegion}
                  onChangeText={setEditStateRegion}
                />
              </View>

              {/* Township */}
              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                  {t('profile.township')}
                </Text>
                <TextInput
                  placeholder={t('profile.placeholder_township')}
                  placeholderTextColor={colors.textSecondary}
                  style={{ padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, backgroundColor: isDark ? colors.background : `${colors.border}22`, fontSize: 15, fontWeight: '600', color: colors.text }}
                  value={editTownship}
                  onChangeText={setEditTownship}
                />
              </View>

              <TouchableOpacity onPress={handleUpdateProfile} disabled={updatingProfile} activeOpacity={0.85} style={{ marginTop: 8, opacity: updatingProfile ? 0.7 : 1 }}>
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {updatingProfile
                    ? <ActivityIndicator size="small" color={colors.background} />
                    : <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>{t('profile.save_changes')}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── NRC Verification Modal ── */}
      <Modal visible={nrcModalVisible} animationType="slide" transparent onRequestClose={() => setNrcModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setNrcModalVisible(false)} />
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
            maxHeight: '90%',
          }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  {nrcFrontImage || nrcBackImage ? t('profile.edit_nrc_documents') : t('profile.submit_nrc_title')}
                </Text>
                <TouchableOpacity onPress={() => setNrcModalVisible(false)} activeOpacity={0.7}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? colors.background : `${colors.border}33`, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Front and Back Images Picker */}
              <View style={{ flexDirection: 'row', gap: 16, marginBottom: 28 }}>
                {/* Front Image */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    {t('profile.nrc_front')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => pickNrcImage('front')}
                    activeOpacity={0.8}
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : `${colors.border}11`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {nrcFrontUri ? (
                      <Image source={{ uri: nrcFrontUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Feather name="camera" size={24} color={colors.textSecondary} />
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 6 }}>{t('profile.upload_front')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Back Image */}
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                    {t('profile.nrc_back')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => pickNrcImage('back')}
                    activeOpacity={0.8}
                    style={{
                      width: '100%',
                      height: 120,
                      borderRadius: 16,
                      borderWidth: 1.5,
                      borderColor: colors.border,
                      backgroundColor: isDark ? colors.background : `${colors.border}11`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {nrcBackUri ? (
                      <Image source={{ uri: nrcBackUri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Feather name="camera" size={24} color={colors.textSecondary} />
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 6 }}>{t('profile.upload_back')}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleSubmitNrc}
                disabled={submittingNrc || !nrcFrontUri || !nrcBackUri}
                activeOpacity={0.85}
                style={{ opacity: submittingNrc || !nrcFrontUri || !nrcBackUri ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submittingNrc ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>{t('profile.submit_verification')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Change PIN Modal ── */}
      <Modal visible={changePinModal} animationType="slide" transparent onRequestClose={() => setChangePinModal(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setChangePinModal(false)} />
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
            maxHeight: '90%',
          }}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{t('profile.change_pin')}</Text>
                <TouchableOpacity onPress={() => setChangePinModal(false)} activeOpacity={0.7}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? colors.background : `${colors.border}33`, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>
              <PinInput label={t('profile.current_pin')} value={currentPin} onChange={setCurrentPin} />
              <PinInput label={t('profile.new_pin')} value={newPin} onChange={setNewPin} />
              <PinInput label={t('profile.confirm_new_pin')} value={confirmPin} onChange={setConfirmPin} />
              <TouchableOpacity onPress={handleChangePin} disabled={submitting} activeOpacity={0.85} style={{ marginTop: 8, opacity: submitting ? 0.7 : 1 }}>
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={colors.background} />
                    : <Text style={{ fontSize: 16, fontWeight: '700', color: colors.background }}>{t('profile.update_pin')}</Text>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Logout Confirmation Modal ── */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24 }}>
          <View style={{ width: '100%', maxWidth: 340, borderRadius: 24, padding: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: `${colors.error}1F`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="log-out" size={24} color={colors.error} />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' }}>{t('profile.logout_title')}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
              {t('profile.logout_desc')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity onPress={() => setLogoutModalVisible(false)} disabled={loggingOut} style={{ flex: 1, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.border, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleConfirmLogout} disabled={loggingOut} style={{ flex: 1 }}>
                <View style={{ paddingVertical: 14, borderRadius: 14, backgroundColor: colors.error, alignItems: 'center', justifyContent: 'center' }}>
                  {loggingOut
                    ? <ActivityIndicator size="small" color={colors.text} />
                    : <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>{t('common.sign_out')}</Text>
                  }
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Language Selection Modal ── */}
      <Modal visible={languageModalVisible} animationType="slide" transparent onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.65)' }}>
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                  {t('language.select_title')}
                </Text>
                <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                  {t('language.select_subtitle')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} activeOpacity={0.7}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDark ? colors.background : `${colors.border}33`, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="x" size={18} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Language Options */}
            {[
              { code: 'en', label: 'English 🇬🇧' },
              { code: 'my', label: 'မြန်မာ (Myanmar) 🇲🇲' },
            ].map((item) => {
              const isSelected = language === item.code;
              return (
                <TouchableOpacity
                  key={item.code}
                  onPress={async () => {
                    await setLanguage(item.code as any);
                    setLanguageModalVisible(false);
                  }}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, borderRadius: 16,
                    backgroundColor: isSelected ? `${colors.primary}1F` : isDark ? colors.background : `${colors.border}22`,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.primary : colors.border,
                    marginBottom: 12,
                  }}
                >
                  <Text style={{ fontSize: 15, fontWeight: '700', color: isSelected ? colors.primary : colors.text }}>
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="check" size={14} color={colors.secondary} />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ── NRC Image Preview ── */}
      <NrcImagePreviewModal
        key={previewImage ? `${previewImage.uri}|${previewImage.label}` : 'closed'}
        visible={!!previewImage}
        uri={previewImage?.uri ?? null}
        label={previewImage?.label ?? ''}
        onClose={() => setPreviewImage(null)}
      />
    </SafeAreaView>
  );
}