// app/qr-code.tsx
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
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import apiFetch from "../lib/api";

export default function QrCodeScreen() {
  const router = useRouter();
  const { colors } = useTheme();

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
        Toast.show({ type: "error", text1: "QR Error", text2: res.body?.message ?? "Failed to retrieve QR" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Could not load QR code" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR();
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
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
          My QR Code
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

      {/* Content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        {loading ? (
          <View style={{ alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: 16, fontSize: 14, color: colors.textSecondary }}>
              Loading QR code...
            </Text>
          </View>
        ) : (
          <View style={{
            width: '100%', maxWidth: 360, padding: 24, borderRadius: 28,
            alignItems: 'center',
          }}>
            {/* QR Container */}
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

            {/* Agent Info */}
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 20 }}>
              {profile?.agent_profile?.shop_name ?? profile?.full_name ?? "Agent Shop"}
            </Text>

            {/* Wallet Number Badge */}
            <View style={{
              marginTop: 12, paddingHorizontal: 16, paddingVertical: 6,
              borderRadius: 20, backgroundColor: `${colors.primary}1A`,
              borderWidth: 1, borderColor: `${colors.primary}33`,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, letterSpacing: 1 }}>
                {profile?.wallet?.wallet_number ?? "WAL-XXXX"}
              </Text>
            </View>

            {/* Divider */}
            <View style={{ width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 16 }} />

            {/* Scan hint */}
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 16, lineHeight: 18 }}>
              Scan this QR code to receive payments or float returns
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}