import { 
  Text, 
  View, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  ActivityIndicator, 
  Modal, 
  KeyboardAvoidingView, 
  Platform, 
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, Camera } from "expo-camera";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Toast from "react-native-toast-message";
import apiFetch from "../lib/api";
import { logout } from "../services/auth";

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  status: string;
  agent_profile: {
    id: number;
    agent_code: string;
    shop_name: string | null;
    shop_address: string | null;
    float_balance: number;
    total_volume_monthly: number;
  } | null;
  wallet: {
    id: number;
    wallet_number: string;
    balance: number;
    status: string;
  } | null;
}

type QrLookupResult = {
  id: number;
  qr_code_value: string;
  qr_payload: string;
  user?: {
    id: number;
    full_name?: string;
    phone_number?: string;
    role?: string;
  };
  wallet?: {
    id?: number;
    wallet_number?: string;
    status?: string;
  };
};

interface Transaction {
  id: number;
  transaction_number: string;
  sender_wallet_id: number;
  receiver_wallet_id: number;
  sender_phone: string;
  receiver_phone: string;
  sender_name: string | null;
  receiver_name: string | null;
  transaction_type: string;
  amount: number;
  fee: number;
  status: string;
  created_at: string;
}

export default function Index() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // App States
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);

  // Modals States
  const [cashInVisible, setCashInVisible] = useState(false);
  const [cashOutVisible, setCashOutVisible] = useState(false);
  const [qrVisible, setQrVisible] = useState(false);

  // Form Fields - Cash In
  const [customerPhone, setCustomerPhone] = useState("");
  const [cashInAmount, setCashInAmount] = useState("");
  const [cashInDesc, setCashInDesc] = useState("");
  const [cashInPin, setCashInPin] = useState("");
  const [submittingCashIn, setSubmittingCashIn] = useState(false);

  // Form Fields - Cash Out
  const [managerPhone, setManagerPhone] = useState("");
  const [cashOutAmount, setCashOutAmount] = useState("");
  const [cashOutDesc, setCashOutDesc] = useState("");
  const [cashOutPin, setCashOutPin] = useState("");
  const [submittingCashOut, setSubmittingCashOut] = useState(false);
  const [selectedManagerQr, setSelectedManagerQr] = useState<QrLookupResult | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // QR Code details
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);

  // Fetch agent dashboard data
  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      // 1. Fetch Profile details
      const profileRes = await apiFetch("/profile");
      if (profileRes.status === 200 && profileRes.body?.success) {
        setProfile(profileRes.body.data);
      } else if (profileRes.status === 401) {
        router.replace("/auth");
        return;
      } else {
        Toast.show({ type: "error", text1: "Error", text2: profileRes.body?.message ?? "Failed to fetch profile" });
      }

      // 2. Fetch Transaction History
      const txRes = await apiFetch("/transactions?per_page=10");
      if (txRes.status === 200) {
        setTransactions(txRes.body.data || []);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Connection Error", text2: "Could not connect to service" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(true);
  };

  // Perform Logout
  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: "success", text1: "Logged Out", text2: "Successfully signed out" });
      router.replace("/auth");
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to sign out" });
    }
  };

  // Cash In execution
  const handleCashIn = async () => {
    if (!customerPhone.trim()) {
      Toast.show({ type: "error", text1: "Required Field", text2: "Please enter customer phone number" });
      return;
    }
    if (!cashInAmount.trim() || Number(cashInAmount) <= 0) {
      Toast.show({ type: "error", text1: "Invalid Amount", text2: "Please enter a valid amount" });
      return;
    }
    if (!cashInPin.trim() || cashInPin.length !== 4) {
      Toast.show({ type: "error", text1: "Invalid PIN", text2: "Please enter your 4-digit secure PIN" });
      return;
    }

    setSubmittingCashIn(true);
    try {
      const res = await apiFetch("/transfers/agent", {
        method: "POST",
        body: JSON.stringify({
          receiver_phone: customerPhone,
          amount: Number(cashInAmount),
          pin: cashInPin,
          description: cashInDesc || undefined
        })
      });

      if (res.status === 200 && res.body?.success) {
        Toast.show({ type: "success", text1: "Deposit Success", text2: `Transferred ${Number(cashInAmount).toLocaleString()} MMK successfully` });
        // Reset state
        setCustomerPhone("");
        setCashInAmount("");
        setCashInDesc("");
        setCashInPin("");
        setCashInVisible(false);
        fetchData(true);
      } else {
        Toast.show({ type: "error", text1: "Transfer Failed", text2: res.body?.message ?? "Could not complete cash in" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Network Error", text2: "Transaction could not be sent" });
    } finally {
      setSubmittingCashIn(false);
    }
  };

  // Cash Out / Return Float execution
  const handleCashOut = async () => {
    if (!managerPhone.trim()) {
      Toast.show({ type: "error", text1: "Required Field", text2: "Please enter manager phone number" });
      return;
    }
    if (!cashOutAmount.trim() || Number(cashOutAmount) <= 0) {
      Toast.show({ type: "error", text1: "Invalid Amount", text2: "Please enter a valid amount" });
      return;
    }
    if (!cashOutPin.trim() || cashOutPin.length !== 4) {
      Toast.show({ type: "error", text1: "Invalid PIN", text2: "Please enter your 4-digit secure PIN" });
      return;
    }

    setSubmittingCashOut(true);
    try {
      const res = await apiFetch("/transfers/agent", {
        method: "POST",
        body: JSON.stringify({
          receiver_phone: managerPhone,
          amount: Number(cashOutAmount),
          pin: cashOutPin,
          description: cashOutDesc || undefined
        })
      });

      if (res.status === 200 && res.body?.success) {
        Toast.show({ type: "success", text1: "Return Success", text2: `Returned ${Number(cashOutAmount).toLocaleString()} MMK successfully` });
        // Reset state
        setManagerPhone("");
        setCashOutAmount("");
        setCashOutDesc("");
        setCashOutPin("");
        setCashOutVisible(false);
        fetchData(true);
      } else {
        Toast.show({ type: "error", text1: "Transfer Failed", text2: res.body?.message ?? "Could not complete cash out" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Network Error", text2: "Transaction could not be sent" });
    } finally {
      setSubmittingCashOut(false);
    }
  };

  // Show Merchant QR Code modal
  const openQrModal = async () => {
    setQrVisible(true);
    setLoadingQr(true);
    try {
      const res = await apiFetch("/qr-codes/me");
      if (res.status === 200 && res.body?.success) {
        setQrPayload(res.body.data.qr_payload ?? res.body.data.qr_code_value);
      } else {
        Toast.show({ type: "error", text1: "QR Error", text2: res.body?.message ?? "Failed to retrieve QR payload" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Could not load QR code" });
    } finally {
      setLoadingQr(false);
    }
  };

  const normalizeQrValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";

    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        if ("qr_code_value" in parsed) {
          return String((parsed as any).qr_code_value).trim();
        }
        if ("qr_payload" in parsed) {
          return String((parsed as any).qr_payload).trim();
        }
      }
    } catch {
      // not JSON
    }

    return trimmed;
  };

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (qrScanLoading) return;
    const qrValue = normalizeQrValue(data);
    if (!qrValue) {
      setScanError("Scanned QR value is invalid.");
      return;
    }

    setQrScanLoading(true);
    setScanError(null);

    try {
      const res = await apiFetch(`/qr-codes/lookup?value=${encodeURIComponent(qrValue)}`);
      if (res.status === 200 && res.body?.success) {
        const qrData = res.body.data as QrLookupResult;
        if (qrData.user?.role !== "agent_manager") {
          Toast.show({ type: "error", text1: "Invalid QR", text2: "Please scan an agent manager QR code." });
          setSelectedManagerQr(null);
          return;
        }

        setSelectedManagerQr(qrData);
        setManagerPhone(qrData.user?.phone_number ?? "");
        setScannerVisible(false);
        Toast.show({ type: "success", text1: "Manager QR scanned", text2: `${qrData.user?.full_name ?? "Agent Manager"} selected.` });
      } else {
        Toast.show({ type: "error", text1: "Lookup failed", text2: res.body?.message ?? "Could not recognize QR code." });
        setSelectedManagerQr(null);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Scan error", text2: "Unable to look up QR code." });
      setSelectedManagerQr(null);
    } finally {
      setQrScanLoading(false);
    }
  };

  useEffect(() => {
    if (!scannerVisible) return;

    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      const granted = status === "granted";
      setHasCameraPermission(granted);
      if (!granted) {
        setScanError("Camera permission is required to scan QR codes.");
      } else {
        setScanError(null);
      }
    })();
  }, [scannerVisible]);

  if (loading && !refreshing) {
    return (
      <View className={`flex-1 items-center justify-center ${isDark ? "bg-[#0A0B09]" : "bg-white"}`}>
        <ActivityIndicator size="large" color="#D5E726" />
        <Text className={`mt-4 ${isDark ? "text-gray-400" : "text-gray-600"}`}>Loading dashboard...</Text>
      </View>
    );
  }

  // Dashboard Styles
  const containerClass = isDark ? "flex-1 bg-[#0A0B09]" : "flex-1 bg-slate-50";
  const headerTextClass = isDark ? "text-white" : "text-gray-900";
  const subTextClass = isDark ? "text-gray-400" : "text-gray-500";
  const cardBgClass = isDark ? "bg-[#161814] border-[#2F332B]" : "bg-white border-slate-200";
  const modalContainerClass = isDark ? "bg-[#161814]" : "bg-white";
  const modalInputClass = isDark ? "bg-[#0A0B09] text-white border-[#2F332B]" : "bg-slate-50 text-black border-slate-200";

  return (
    <SafeAreaView edges={["top", "bottom"]} className={containerClass}>
      {/* Top Header Row */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View className="flex-row items-center">
          <View className={`w-10 h-10 rounded-full items-center justify-center ${isDark ? 'bg-primary/20' : 'bg-primary/10'} mr-3`}>
            <Text className="text-primary font-bold text-lg">
              {profile?.full_name?.charAt(0) ?? "A"}
            </Text>
          </View>
          <View>
            <Text className={`text-base font-semibold ${headerTextClass}`}>
              {profile?.full_name ?? "Agent User"}
            </Text>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
              <Text className="text-xs text-emerald-500 font-medium uppercase tracking-wider">
                {profile?.status ?? "active"}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Toggle Theme / Logout */}
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={toggleTheme} 
            className={`w-9 h-9 items-center justify-center rounded-full ${isDark ? 'bg-[#161814] border border-[#2F332B]' : 'bg-white border border-slate-200'}`}
            activeOpacity={0.7}
          >
            <Feather name={isDark ? "sun" : "moon"} size={16} color={isDark ? "#D5E726" : "#475569"} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={handleLogout} 
            className={`w-9 h-9 items-center justify-center rounded-full ${isDark ? 'bg-red-500/10' : 'bg-red-50'}`}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={16} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D5E726" colors={["#D5E726"]} />
        }
      >
        <View className="px-6 space-y-6">
          
          {/* Visual Float & Wallet Balance Card */}
          <View className={`p-6 rounded-3xl border ${cardBgClass} overflow-hidden shadow-sm`}>
            <View className="flex-row justify-between items-center mb-4">
              <Text className={`text-sm font-medium ${subTextClass}`}>Float & Wallet Accounts</Text>
              <TouchableOpacity onPress={() => setShowBalances(!showBalances)} activeOpacity={0.7}>
                <Feather name={showBalances ? "eye" : "eye-off"} size={18} color={isDark ? "#6B7280" : "#94A3B8"} />
              </TouchableOpacity>
            </View>

            {/* Float Balance */}
            <View className="mb-4">
              <Text className={`text-xs ${subTextClass} mb-1`}>FLOAT BALANCE (COMMISSION INCLUDED)</Text>
              <Text className="text-3xl font-bold text-primary tracking-tight">
                {showBalances ? `${(profile?.agent_profile?.float_balance ?? 0).toLocaleString()} MMK` : "•••••• MMK"}
              </Text>
            </View>

            {/* Wallet Balance divider */}
            <View className={`w-full h-[1px] ${isDark ? 'bg-[#2F332B]' : 'bg-slate-100'} my-3`} />

            {/* Wallet Balance */}
            <View>
              <Text className={`text-xs ${subTextClass} mb-1`}>WALLET ACCOUNT BALANCE</Text>
              <Text className={`text-xl font-bold ${headerTextClass}`}>
                {showBalances ? `${(profile?.wallet?.balance ?? 0).toLocaleString()} MMK` : "•••••• MMK"}
              </Text>
              <Text className={`text-xs ${subTextClass} mt-1`}>
                Wallet: {profile?.wallet?.wallet_number ?? "WAL-XXXX"}
              </Text>
            </View>
          </View>

          {/* Quick Actions Panel */}
          <View>
            <Text className={`text-sm font-semibold ${subTextClass} uppercase tracking-wider mb-3`}>
              Agent Operations
            </Text>
            <View className="flex-row space-x-3">
              {/* Cash In Button */}
              <TouchableOpacity 
                onPress={() => setCashInVisible(true)}
                className="flex-1 py-4 bg-primary rounded-2xl items-center justify-center flex-row shadow-sm"
                activeOpacity={0.8}
              >
                <Feather name="plus-circle" size={18} color="black" className="mr-2" />
                <Text className="text-black font-bold text-sm">Cash In</Text>
              </TouchableOpacity>

              {/* Cash Out Button */}
              <TouchableOpacity 
                onPress={() => setCashOutVisible(true)}
                className={`flex-1 py-4 rounded-2xl items-center justify-center flex-row border border-dashed ${isDark ? 'border-[#2F332B] bg-[#161814]' : 'border-slate-300 bg-white'}`}
                activeOpacity={0.8}
              >
                <Feather name="minus-circle" size={18} color={isDark ? "#D5E726" : "#475569"} className="mr-2" />
                <Text className={`font-bold text-sm ${headerTextClass}`}>Return Float</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={openQrModal}
                className={`p-4 rounded-2xl border ${isDark ? 'border-[#2F332B] bg-[#161814]' : 'border-slate-200 bg-white'}`}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={18} color={isDark ? "#D5E726" : "#475569"} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Analytics / Monthly Volume Card */}
          <View className={`p-5 rounded-2xl border ${cardBgClass} flex-row justify-between items-center`}>
            <View>
              <Text className={`text-xs ${subTextClass} uppercase tracking-wider`}>Monthly Volume</Text>
              <Text className={`text-lg font-bold ${headerTextClass} mt-0.5`}>
                {profile?.agent_profile?.total_volume_monthly ? `${profile.agent_profile.total_volume_monthly.toLocaleString()} MMK` : "0 MMK"}
              </Text>
            </View>
            <View className={`px-3 py-1.5 rounded-xl ${isDark ? 'bg-primary/10' : 'bg-primary/20'}`}>
              <Text className="text-primary font-bold text-xs uppercase">
                CODE: {profile?.agent_profile?.agent_code ?? "AG-XXXX"}
              </Text>
            </View>
          </View>

          {/* Transaction History Section */}
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className={`text-sm font-semibold ${subTextClass} uppercase tracking-wider`}>
                Recent Transactions
              </Text>
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
                <Text className="text-primary font-bold text-xs">Refresh</Text>
              </TouchableOpacity>
            </View>

            {transactions.length === 0 ? (
              <View className={`py-8 rounded-2xl border border-dashed items-center justify-center ${isDark ? 'border-[#2F332B]' : 'border-slate-200 bg-white'}`}>
                <Feather name="inbox" size={32} color={isDark ? "#2F332B" : "#CBD5E1"} />
                <Text className={`text-sm mt-2 ${subTextClass}`}>No transaction records found</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {transactions.map((tx) => {
                  const isSender = profile?.wallet?.id === tx.sender_wallet_id;
                  const isCashIn = tx.transaction_type === "agent_to_customer";
                  const isCashOut = tx.transaction_type === "customer_to_agent";

                  let symbol = "-";
                  let amountColor = "text-rose-500";
                  let typeLabel = "Transfer";

                  if (isCashIn) {
                    symbol = "-";
                    amountColor = isDark ? "text-white" : "text-gray-900";
                    typeLabel = "Cash In";
                  } else if (isCashOut) {
                    symbol = "+";
                    amountColor = "text-emerald-500";
                    typeLabel = "Cash Out";
                  } else if (!isSender) {
                    symbol = "+";
                    amountColor = "text-emerald-500";
                    typeLabel = "Received";
                  }

                  const formattedTime = new Date(tx.created_at).toLocaleDateString([], { 
                    month: 'short', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <View key={tx.id} className={`p-4 rounded-2xl border ${cardBgClass} flex-row justify-between items-center`}>
                      <View className="flex-row items-center flex-1 mr-3">
                        <View className={`w-10 h-10 rounded-xl items-center justify-center ${isCashOut ? 'bg-emerald-500/10' : (isCashIn ? 'bg-primary/10' : 'bg-slate-500/10')} mr-3`}>
                          <Feather 
                            name={isCashOut ? "arrow-down-left" : "arrow-up-right"} 
                            size={18} 
                            color={isCashOut ? "#10b981" : (isDark ? "#D5E726" : "#475569")} 
                          />
                        </View>
                        <View className="flex-1">
                          <Text className={`text-sm font-semibold ${headerTextClass}`} numberOfLines={1}>
                            {isSender ? `To: ${tx.receiver_phone}` : `From: ${tx.sender_phone}`}
                          </Text>
                          <Text className={`text-[10px] ${subTextClass} mt-0.5`}>
                            {formattedTime} • {typeLabel}
                          </Text>
                        </View>
                      </View>
                      <View className="items-end">
                        <Text className={`text-sm font-bold ${amountColor}`}>
                          {symbol}{tx.amount.toLocaleString()} Ks
                        </Text>
                        <Text className={`text-[10px] ${subTextClass}`}>
                          Ref: {tx.transaction_number.slice(0, 8)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* CASH IN MODAL */}
      <Modal visible={cashInVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className={`rounded-t-3xl p-6 ${modalContainerClass} border-t ${isDark ? 'border-[#2F332B]' : 'border-slate-100'}`}>
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className={`text-lg font-bold ${headerTextClass}`}>Cash In (Deposit)</Text>
                <TouchableOpacity onPress={() => setCashInVisible(false)} activeOpacity={0.7}>
                  <Feather name="x" size={20} color={isDark ? "#FFFFFF" : "#0A0B09"} />
                </TouchableOpacity>
              </View>

              {/* Modal Fields */}
              <View className="space-y-4">
                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>CUSTOMER PHONE NUMBER</Text>
                  <TextInput
                    placeholder="09xxxxxxxx"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass}`}
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                    keyboardType="phone-pad"
                    editable={!submittingCashIn}
                  />
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>DEPOSIT AMOUNT (MMK)</Text>
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass} font-semibold`}
                    value={cashInAmount}
                    onChangeText={setCashInAmount}
                    keyboardType="numeric"
                    editable={!submittingCashIn}
                  />
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>DESCRIPTION (OPTIONAL)</Text>
                  <TextInput
                    placeholder="e.g. Gift, payment"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass}`}
                    value={cashInDesc}
                    onChangeText={setCashInDesc}
                    editable={!submittingCashIn}
                  />
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>SECURE 4-DIGIT PIN</Text>
                  <TextInput
                    placeholder="• • • •"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass} text-center font-bold tracking-widest`}
                    value={cashInPin}
                    onChangeText={setCashInPin}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    editable={!submittingCashIn}
                  />
                </View>

                {/* Submit Deposit */}
                <TouchableOpacity
                  onPress={handleCashIn}
                  className={`w-full py-4 rounded-xl bg-primary mt-4 ${submittingCashIn ? 'opacity-70' : ''}`}
                  disabled={submittingCashIn}
                  activeOpacity={0.8}
                >
                  {submittingCashIn ? (
                    <ActivityIndicator size="small" color="black" />
                  ) : (
                    <Text className="text-black font-bold text-center text-base">Authorize Deposit</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* CASH OUT / RETURN FLOAT MODAL */}
      <Modal visible={cashOutVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View className={`rounded-t-3xl p-6 ${modalContainerClass} border-t ${isDark ? 'border-[#2F332B]' : 'border-slate-100'}`}>
              
              {/* Modal Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className={`text-lg font-bold ${headerTextClass}`}>Return Float Balance</Text>
                <TouchableOpacity onPress={() => setCashOutVisible(false)} activeOpacity={0.7}>
                  <Feather name="x" size={20} color={isDark ? "#FFFFFF" : "#0A0B09"} />
                </TouchableOpacity>
              </View>

              {/* Modal Fields */}
              <View className="space-y-4">
                <View>
                  <View className="flex-row justify-between items-center mb-1.5">
                    <Text className={`text-xs ${subTextClass} ml-1`}>MANAGER PHONE NUMBER</Text>
                    <TouchableOpacity
                      onPress={() => setScannerVisible(true)}
                      className="flex-row items-center rounded-full bg-primary/10 px-3 py-2"
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="qrcode-scan" size={14} color="#0f766e" />
                      <Text className="ml-2 text-[11px] font-semibold text-teal-700">Scan QR</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    placeholder="09xxxxxxxx"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass}`}
                    value={managerPhone}
                    onChangeText={setManagerPhone}
                    keyboardType="phone-pad"
                    editable={!submittingCashOut}
                  />
                  {selectedManagerQr ? (
                    <View className="mt-3 rounded-2xl border border-teal-200 bg-teal-50 px-3 py-3">
                      <Text className="text-xs font-semibold text-teal-900">
                        Manager: {selectedManagerQr.user?.full_name ?? selectedManagerQr.user?.phone_number}
                      </Text>
                      <Text className="text-[11px] text-teal-700">
                        {selectedManagerQr.wallet?.wallet_number ?? selectedManagerQr.qr_code_value}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          setSelectedManagerQr(null);
                          setManagerPhone("");
                        }}
                        className="mt-2 self-start rounded-full bg-white px-3 py-1"
                        activeOpacity={0.8}
                      >
                        <Text className="text-[11px] text-slate-600">Clear selection</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>RETURN AMOUNT (MMK)</Text>
                  <TextInput
                    placeholder="Enter amount"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass} font-semibold`}
                    value={cashOutAmount}
                    onChangeText={setCashOutAmount}
                    keyboardType="numeric"
                    editable={!submittingCashOut}
                  />
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>DESCRIPTION (OPTIONAL)</Text>
                  <TextInput
                    placeholder="e.g. Return, weekly settlement"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass}`}
                    value={cashOutDesc}
                    onChangeText={setCashOutDesc}
                    editable={!submittingCashOut}
                  />
                </View>

                <View>
                  <Text className={`text-xs ${subTextClass} mb-1.5 ml-1`}>SECURE 4-DIGIT PIN</Text>
                  <TextInput
                    placeholder="• • • •"
                    placeholderTextColor={isDark ? "#6B7280" : "#94A3B8"}
                    className={`p-4 rounded-xl border ${modalInputClass} text-center font-bold tracking-widest`}
                    value={cashOutPin}
                    onChangeText={setCashOutPin}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    editable={!submittingCashOut}
                  />
                </View>

                {/* Submit Float Return */}
                <TouchableOpacity
                  onPress={handleCashOut}
                  className={`w-full py-4 rounded-xl bg-primary mt-4 ${submittingCashOut ? 'opacity-70' : ''}`}
                  disabled={submittingCashOut}
                  activeOpacity={0.8}
                >
                  {submittingCashOut ? (
                    <ActivityIndicator size="small" color="black" />
                  ) : (
                    <Text className="text-black font-bold text-center text-base">Authorize Float Return</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* MANAGER QR SCANNER MODAL */}
      <Modal visible={scannerVisible} animationType="slide" transparent>
        <View className="flex-1 bg-black">
          {hasCameraPermission === false ? (
            <View className="flex-1 items-center justify-center px-6">
              <View className={`rounded-3xl p-6 w-full max-w-sm ${modalContainerClass} border ${isDark ? 'border-[#2F332B]' : 'border-slate-100'}`}>
                <Text className={`text-xl font-bold mb-4 ${headerTextClass}`}>Camera Permission Required</Text>
                <Text className={`text-sm ${subTextClass} mb-6`}>
                  Enable camera access in your device settings to scan manager QR codes.
                </Text>
                <TouchableOpacity
                  onPress={() => setScannerVisible(false)}
                  className="rounded-full bg-primary py-3 items-center"
                  activeOpacity={0.8}
                >
                  <Text className="text-black font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <CameraView
                onBarcodeScanned={(event) => handleBarCodeScanned({ type: event.type, data: event.data })}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                style={{ flex: 1 }}
                facing="back"
                active
              />
              <View className="absolute inset-x-0 bottom-0 p-6">
                <View className="rounded-3xl bg-black/80 p-4">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-base font-semibold text-white">Scan Manager QR</Text>
                    <TouchableOpacity onPress={() => setScannerVisible(false)} activeOpacity={0.7}>
                      <Feather name="x" size={20} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {scanError ? (
                    <Text className="text-sm text-red-400 mb-2">{scanError}</Text>
                  ) : (
                    <Text className="text-sm text-slate-200 mb-2">
                      Point your camera at an agent manager QR code. Scanning will stop once a valid code is detected.
                    </Text>
                  )}
                  {qrScanLoading && (
                    <ActivityIndicator size="small" color="#D5E726" className="mb-3" />
                  )}
                  <TouchableOpacity
                    onPress={() => setScannerVisible(false)}
                    className="rounded-full bg-white py-3 items-center"
                    activeOpacity={0.8}
                  >
                    <Text className="font-semibold text-slate-900">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* MERCHANT QR MODAL */}
      <Modal visible={qrVisible} animationType="fade" transparent>
        <View className="flex-1 justify-center items-center bg-black/75 px-6">
          <View className={`rounded-3xl p-6 w-full max-w-sm ${modalContainerClass} border ${isDark ? 'border-[#2F332B]' : 'border-slate-100'}`}>
            
            {/* Modal Header */}
            <View className="flex-row justify-between items-center mb-6">
              <Text className={`text-base font-bold ${headerTextClass}`}>Merchant Cash In QR</Text>
              <TouchableOpacity onPress={() => setQrVisible(false)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={isDark ? "#FFFFFF" : "#0A0B09"} />
              </TouchableOpacity>
            </View>

            {/* QR Card Presentation */}
            {loadingQr ? (
              <View className="py-12 items-center justify-center">
                <ActivityIndicator size="large" color="#D5E726" />
                <Text className={`mt-4 text-xs ${subTextClass}`}>Generating merchant code...</Text>
              </View>
            ) : (
              <View className="items-center py-4">
                {/* Visual stylized QR code container */}
                <View className={`w-48 h-48 rounded-2xl items-center justify-center p-4 border mb-4 bg-white border-[#D5E726]`}>
                  {qrPayload ? (
                    <QRCode value={qrPayload} size={160} backgroundColor="transparent" />
                  ) : (
                    <MaterialCommunityIcons name="qrcode" size={132} color="#000000" />
                  )}
                </View>
                
                {/* Profile Details */}
                <Text className={`text-lg font-bold ${headerTextClass} text-center`}>
                  {profile?.agent_profile?.shop_name ?? profile?.full_name ?? "Agent Shop"}
                </Text>
                <Text className={`text-xs ${subTextClass} text-center mt-1`}>
                  Agent Code: {profile?.agent_profile?.agent_code ?? "AG-XXXX"}
                </Text>
                <Text className="text-xs text-primary font-bold bg-primary/10 px-3 py-1 rounded-full mt-3 tracking-wider">
                  {profile?.wallet?.wallet_number ?? "WAL-XXXX"}
                </Text>

                <View className={`w-full h-[1px] ${isDark ? 'bg-[#2F332B]' : 'bg-slate-100'} my-4`} />
                
                <Text className={`text-[10px] ${subTextClass} text-center px-4`}>
                  Scan this QR code using a customer wallet to load cash-out or float return requests.
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}