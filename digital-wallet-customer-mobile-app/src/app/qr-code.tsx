import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import apiFetch from "../lib/api";

export default function QrCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const fetchQR = async () => {
    setLoading(true);
    try {
      const profileRes = await apiFetch("/profile");
      if (profileRes.status === 200 && profileRes.body?.success) {
        setProfile(profileRes.body.data);
      }

      const res = await apiFetch("/qr-codes/me");
      if (res.status === 200 && res.body?.success) {
        setQrPayload(res.body.data.qr_payload ?? res.body.data.qr_code_value);
      } else {
        Toast.show({
          type: "error",
          text1: t("transfer.qr_error"),
          text2: res.body?.message ?? t("transfer.qr_load_failed"),
        });
      }
    } catch {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("transfer.qr_load_failed") });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Feather name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: colors.text }}>
          {t("qr.title")}
        </Text>
        <TouchableOpacity
          onPress={fetchQR}
          activeOpacity={0.7}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.border,
          }}
        >
          <Feather name="refresh-cw" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, fontSize: 14, color: colors.textSecondary }}>
              {t("qr.loading")}
            </Text>
          </View>
        ) : (
          <View style={{
            width: '100%', maxWidth: 360, padding: 24, borderRadius: 28,
            borderWidth: 1, borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            shadowColor: colors.primary, shadowOpacity: 0.08,
            shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
            elevation: 6,
          }}>
            <View style={{
              width: 224, height: 224, borderRadius: 20,
              alignItems: 'center', justifyContent: 'center',
              padding: 16, backgroundColor: '#FFFFFF',
              borderWidth: 2, borderColor: colors.primary,
              marginBottom: 8,
            }}>
              {qrPayload ? (
                <QRCode value={qrPayload} size={192} backgroundColor="#FFFFFF" color="#0A0B09" />
              ) : (
                <MaterialCommunityIcons name="qrcode" size={150} color={colors.secondary} />
              )}
            </View>

            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 20 }}>
              {profile?.full_name ?? t("qr.default_user")}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', marginTop: 4 }}>
              {t("qr.customer_id")}: {profile?.customer_profile?.referral_code ?? profile?.id ?? "N/A"}
            </Text>

            <View style={{
              marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
              borderRadius: 20, backgroundColor: `${colors.primary}1A`,
              borderWidth: 1, borderColor: `${colors.primary}33`,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 1 }}>
                {profile?.wallet?.wallet_number ?? "WAL-XXXX"}
              </Text>
            </View>

            <View style={{ width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 }}>
              {t("qr.subtitle")}
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
