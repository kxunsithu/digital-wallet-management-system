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
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  const containerClass = isDark ? "flex-1 bg-[#0A0B09]" : "flex-1 bg-slate-50";
  const headerTextClass = isDark ? "text-white" : "text-gray-900";
  const subTextClass = isDark ? "text-gray-400" : "text-gray-500";

  return (
    <SafeAreaView edges={["top"]} className={containerClass}>
      <View className="flex-row items-center px-6 pt-4 pb-6">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Feather name="arrow-left" size={24} color={isDark ? "#FFFFFF" : "#0A0B09"} />
        </TouchableOpacity>
        <Text className={`flex-1 text-center text-lg font-bold ${headerTextClass}`}>My QR Code</Text>
        <TouchableOpacity onPress={fetchQR} activeOpacity={0.7}>
          <Feather name="refresh-cw" size={20} color={isDark ? "#D5E726" : "#475569"} />
        </TouchableOpacity>
      </View>

      <View className="flex-1 items-center justify-center px-6">
        {loading ? (
          <View className="items-center justify-center">
            <ActivityIndicator size="large" color="#D5E726" />
            <Text className={`mt-4 text-sm ${subTextClass}`}>Loading QR code...</Text>
          </View>
        ) : (
          <View className={`w-full max-w-sm p-6 rounded-3xl border items-center ${isDark ? 'bg-[#161814] border-[#2F332B]' : 'bg-white border-slate-200'}`}>
            <View className={`w-56 h-56 rounded-2xl items-center justify-center p-4 border-2 bg-white border-primary`}>
              {qrPayload ? (
                <QRCode value={qrPayload} size={200} backgroundColor="transparent" />
              ) : (
                <MaterialCommunityIcons name="qrcode" size={150} color="#000000" />
              )}
            </View>

            <Text className={`text-lg font-bold ${headerTextClass} text-center mt-6`}>
              {profile?.agent_profile?.shop_name ?? profile?.full_name ?? "Agent Shop"}
            </Text>
            <Text className={`text-xs ${subTextClass} text-center mt-1`}>
              Agent Code: {profile?.agent_profile?.agent_code ?? "AG-XXXX"}
            </Text>
            <Text className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full mt-3 tracking-wider">
              {profile?.wallet?.wallet_number ?? "WAL-XXXX"}
            </Text>

            <View className={`w-full h-[1px] ${isDark ? 'bg-[#2F332B]' : 'bg-slate-100'} my-4`} />

            <Text className={`text-xs ${subTextClass} text-center px-4`}>
              Scan this QR code to receive payments or float returns
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}