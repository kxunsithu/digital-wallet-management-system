// app/cash-in.tsx
import {
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
import { useLanguage } from "../providers/LanguageProvider";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { CameraView, Camera } from "expo-camera";
import Toast from "react-native-toast-message";
import apiFetch from "../lib/api";
import { LinearGradient } from "expo-linear-gradient";
import TransferReceiptModal, { ReceiptTransaction } from "../components/TransferReceiptModal";

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

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

export default function CashInScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shouldAutoScan = params.scan === 'true';

  const { theme, colors } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const [customerPhone, setCustomerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // PIN Modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");

  // Receipt Modal state
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<ReceiptTransaction | null>(null);

  const [selectedCustomerQr, setSelectedCustomerQr] = useState<QrLookupResult | null>(null);
  const [scannerVisible, setScannerVisible] = useState(shouldAutoScan);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [phoneLookupUser, setPhoneLookupUser] = useState<{ full_name?: string; role?: string } | null>(null);
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [roleValidationError, setRoleValidationError] = useState<string | null>(null);

  // Fee & limit info from backend (shown under the amount field)
  const [transferInfo, setTransferInfo] = useState<{
    customer_transfer_fee_percent?: number;
    unverified_customer_transfer_limit?: number | null;
    is_nrc_verified?: boolean;
  } | null>(null);

  // Validate recipient by phone lookup
  const validateCustomerPhone = async (phone: string) => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 9) {
      setPhoneLookupUser(null);
      setRoleValidationError(null);
      return true;
    }

    setPhoneLookupLoading(true);
    try {
      const res = await apiFetch(`/qr-codes/lookup?value=${encodeURIComponent(trimmed)}`);
      if (res.status === 200 && res.body?.success) {
        const userData = res.body.data?.user;
        const role = userData?.role;

        if (role && role !== "customer" && role !== "agent") {
          const roleDisplay = role.replace(/_/g, ' ');
          const msg = t('transfer.role_restriction', { role: roleDisplay });
          setRoleValidationError(msg);
          setPhoneLookupUser(null);
          Toast.show({
            type: "error",
            text1: t('transfer.invalid_recipient'),
            text2: msg,
          });
          return false;
        } else {
          setPhoneLookupUser({ full_name: userData?.full_name, role: role ?? 'customer' });
          setRoleValidationError(null);
          return true;
        }
      }
    } catch {
      // ignore network errors on blur
    } finally {
      setPhoneLookupLoading(false);
    }
    return true;
  };

  // Step 1: Click Submit -> Validate form and open PIN Modal
  const handleInitiateTransfer = async () => {
    if (!customerPhone.trim()) {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("transfer.enter_recipient_phone") });
      return;
    }

    if (roleValidationError) {
      Toast.show({ type: "error", text1: t('transfer.role_restricted_title'), text2: roleValidationError });
      return;
    }

    if (selectedCustomerQr?.user?.role && selectedCustomerQr.user.role !== "customer" && selectedCustomerQr.user.role !== "agent") {
      Toast.show({ type: "error", text1: t('transfer.role_restricted_title'), text2: t('transfer.invalid_recipient_desc') });
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Toast.show({ type: "error", text1: t("common.error"), text2: t("transfer.enter_valid_amount") });
      return;
    }

    // Perform recipient phone role check before opening modal
    const isValid = await validateCustomerPhone(customerPhone);
    if (!isValid) return;

    // Open PIN Modal
    setPin("");
    setPinModalVisible(true);
  };

  // Step 2: Submit inside PIN Modal with PIN
  const handleExecuteTransfer = async (enteredPin: string) => {
    if (!enteredPin || enteredPin.length !== 4) {
      Toast.show({ type: "error", text1: t('transfer.invalid_pin'), text2: t('transfer.invalid_pin_desc') });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/transfers/customer", {
        method: "POST",
        body: JSON.stringify({
          receiver_phone: customerPhone,
          amount: Number(amount),
          pin: enteredPin,
          description: description || undefined,
        }),
      });

      if (res.status === 200 && res.body?.success) {
        setPinModalVisible(false);
        const txData = res.body.data;
        const receiverRole = selectedCustomerQr?.user?.role ?? 'customer';
        setReceiptTransaction({
          id: txData?.id,
          transaction_number: txData?.transaction_number || 'N/A',
          transaction_type: txData?.transaction_type || (receiverRole === 'agent' ? 'customer_to_agent' : 'customer_to_customer'),
          amount: Number(txData?.amount || amount),
          fee: Number(txData?.fee || 0),
          sender_name: txData?.sender_name,
          sender_phone: txData?.sender_phone,
          receiver_name: txData?.receiver_name || selectedCustomerQr?.user?.full_name,
          receiver_phone: txData?.receiver_phone || customerPhone,
          description: txData?.description || description,
          status: txData?.status || 'completed',
          created_at: txData?.created_at,
        });
        setReceiptVisible(true);
        Toast.show({
          type: "success",
          text1: t('transfer.success_title'),
          text2: t('transfer.success_desc', {
            amount: Number(amount).toLocaleString(),
            recipient: receiverRole === 'agent' ? t('transfer.agent') : t('transfer.customer'),
          }),
        });
      } else {
        const msg = res.body?.message ?? t('transfer.lookup_failed_desc');
        if (msg.toLowerCase().includes("only transfer to customers")) {
          Toast.show({
            type: "error",
            text1: t('transfer.role_restricted_title'),
            text2: t('transfer.role_restriction', { role: t('transfer.customer') }),
          });
        } else {
          Toast.show({ type: "error", text1: t('common.error'), text2: msg });
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setSubmitting(false);
    }
  };

  const normalizeQrValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object") {
        if ("qr_code_value" in parsed) return String((parsed as any).qr_code_value).trim();
        if ("qr_payload" in parsed) return String((parsed as any).qr_payload).trim();
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
      setScanError(t('transfer.invalid_qr_value'));
      return;
    }

    setQrScanLoading(true);
    setScanError(null);

    try {
      const res = await apiFetch(`/qr-codes/lookup?value=${encodeURIComponent(qrValue)}`);
      if (res.status === 200 && res.body?.success) {
        const qrData = res.body.data as QrLookupResult;

        if (qrData.user?.role && qrData.user.role !== "customer" && qrData.user.role !== "agent") {
          const roleDisplay = qrData.user.role.replace(/_/g, ' ');
          const roleMsg = t('transfer.role_restriction', { role: roleDisplay });
          Toast.show({
            type: "error",
            text1: t('transfer.role_restricted_title'),
            text2: roleMsg,
          });
          setSelectedCustomerQr(null);
          setRoleValidationError(roleMsg);
          setScannerVisible(false);
          return;
        }

        setSelectedCustomerQr(qrData);
        setCustomerPhone(qrData.user?.phone_number ?? "");
        setPhoneLookupUser({ full_name: qrData.user?.full_name, role: qrData.user?.role ?? 'customer' });
        setRoleValidationError(null);
        setScannerVisible(false);
        Toast.show({
          type: "success",
          text1: t('transfer.qr_scanned_title'),
          text2: t('transfer.qr_scanned_desc', { recipient: qrData.user?.full_name ?? qrData.user?.phone_number ?? t('transfer.customer') }),
        });
      } else {
        Toast.show({ type: "error", text1: t('transfer.lookup_failed'), text2: res.body?.message ?? t('transfer.lookup_failed_desc') });
        setSelectedCustomerQr(null);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: t('transfer.scan_error'), text2: t('transfer.scan_error_desc') });
      setSelectedCustomerQr(null);
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
        setScanError(t("transfer.camera_needed_desc"));
      } else {
        setScanError(null);
      }
    })();
  }, [scannerVisible]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch("/transfers/customer/info");
        if (!cancelled && res.status === 200 && res.body?.data) {
          setTransferInfo(res.body.data);
        }
      } catch {
        // ignore network errors; banner stays hidden
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1, borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
              {t('transfer.title')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setScannerVisible(true)}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: `${colors.primary}26`,
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ gap: 18 }}>

            {/* Phone & QR Selector */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {t('transfer.recipient_phone')}
                </Text>
                <TouchableOpacity
                  onPress={() => setScannerVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary, marginLeft: 4 }}>
                    {t('transfer.scan_qr_prompt')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1.5,
                borderColor: roleValidationError
                  ? colors.error
                  : colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}>
                <Feather name="phone" size={18} color={roleValidationError ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder={t('transfer.enter_phone')}
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1, paddingVertical: 14,
                    fontSize: 16, fontWeight: '600',
                    color: roleValidationError ? colors.error : (colors.text),
                  }}
                  value={customerPhone}
                  onChangeText={(val) => {
                    setCustomerPhone(val);
                    setRoleValidationError(null);
                    if (selectedCustomerQr) setSelectedCustomerQr(null);
                  }}
                  onBlur={() => validateCustomerPhone(customerPhone)}
                  keyboardType="phone-pad"
                />
                {phoneLookupLoading && (
                  <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
                )}
              </View>

              {/* Role restriction error */}
              {roleValidationError && (
                <View style={{
                  marginTop: 8, padding: 10, borderRadius: 12,
                  backgroundColor: `${colors.error}1A`,
                  borderWidth: 1, borderColor: `${colors.error}33`,
                  flexDirection: 'row', alignItems: 'center',
                }}>
                  <Feather name="alert-circle" size={15} color={colors.error} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 11, color: colors.error, flex: 1, fontWeight: '600' }}>
                    {roleValidationError}
                  </Text>
                </View>
              )}

              {/* Verified Customer Banner */}
              {!roleValidationError && (phoneLookupUser || selectedCustomerQr) && (
                <View style={{
                  marginTop: 10, padding: 12, borderRadius: 14,
                  backgroundColor: `${colors.primary}1A`,
                  borderWidth: 1, borderColor: `${colors.primary}4D`,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="check-circle" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                        {t('transfer.recipient_label', {
                          name:
                            selectedCustomerQr?.user?.full_name ??
                            phoneLookupUser?.full_name ??
                            selectedCustomerQr?.user?.phone_number ??
                            customerPhone,
                        })}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, marginLeft: 20 }}>
                      {t('transfer.recipient_verified')}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCustomerQr(null);
                      setPhoneLookupUser(null);
                      setCustomerPhone("");
                      setRoleValidationError(null);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Feather name="x" size={16} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Amount Input */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                {t('transfer.amount')}
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.primary, marginRight: 10 }}>
                  Ks
                </Text>
                <TextInput
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1, paddingVertical: 14,
                    fontSize: 22, fontWeight: '800',
                    color: colors.text,
                  }}
                  value={amount}
                  onChangeText={setAmount}
                  keyboardType="numeric"
                />
              </View>

              {/* Quick Amount Chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {QUICK_AMOUNTS.map((amt) => (
                    <TouchableOpacity
                      key={amt}
                      onPress={() => setAmount(amt.toString())}
                      activeOpacity={0.7}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 12,
                        backgroundColor: amount === amt.toString() ? colors.primary : (colors.surface),
                        borderWidth: 1,
                        borderColor: amount === amt.toString() ? colors.primary : colors.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: amount === amt.toString() ? colors.secondary : colors.textSecondary,
                      }}>
                        +{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Fee & limit info banner */}
            {transferInfo && (
              <View style={{
                padding: 14, borderRadius: 16,
                backgroundColor: `${colors.primary}14`,
                borderWidth: 1, borderColor: `${colors.primary}3D`,
                gap: 8,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="info" size={14} color={colors.primary} />
                  <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                    {t('transfer.info_title')}
                  </Text>
                </View>

                {/* Transfer Fee Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{t('transfer.fee')}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                    {Number(transferInfo.customer_transfer_fee_percent) > 0
                      ? t('transfer.fee_percent', { percent: String(transferInfo.customer_transfer_fee_percent) })
                      : t('transfer.fee_free')}
                  </Text>
                </View>

                {/* Transfer Limit Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>{t('transfer.limit_label')}</Text>
                  {transferInfo.is_nrc_verified ? (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                      {t('transfer.limit_unlimited_val')}
                    </Text>
                  ) : transferInfo.unverified_customer_transfer_limit != null ? (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                      {t('transfer.limit_val', { amount: Number(transferInfo.unverified_customer_transfer_limit).toLocaleString() })}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, fontWeight: '700', color: colors.primary }}>
                      {t('transfer.limit_none_val')}
                    </Text>
                  )}
                </View>

                {!transferInfo.is_nrc_verified && (
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                    {t('transfer.limit_hint')}
                  </Text>
                )}
              </View>
            )}

            {/* Description */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                {t('transfer.note')}
              </Text>
              <TextInput
                placeholder={t('transfer.enter_note')}
                placeholderTextColor={colors.textSecondary}
                style={{
                  padding: 14, borderRadius: 16, borderWidth: 1.5,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  fontSize: 14, color: colors.text,
                }}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Initiate Transfer Button */}
            <TouchableOpacity
              onPress={handleInitiateTransfer}
              disabled={!!roleValidationError}
              activeOpacity={0.85}
              style={{ marginTop: 14, opacity: roleValidationError ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={[colors.primary, `${colors.primary}CC`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.secondary }}>
                  {t('transfer.proceed_send')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── VERIFY PIN MODAL BOX ── */}
      <Modal visible={pinModalVisible} animationType="slide" transparent onRequestClose={() => setPinModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}
        >
          <Pressable style={{ flex: 1 }} onPress={() => setPinModalVisible(false)} />
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 24,
            backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
                    {t('transfer.verify_pin_title')}
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    {t('transfer.confirm_amount', { amount: Number(amount).toLocaleString() })}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center' }}>
                  {t('transfer.pin_modal_subtitle')}
                </Text>
                <TextInput
                  placeholder="• • • •"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    padding: 16, borderRadius: 16, borderWidth: 2,
                    borderColor: colors.primary,
                    backgroundColor: isDark ? colors.background : `${colors.border}22`,
                    fontSize: 24, fontWeight: '900', textAlign: 'center', letterSpacing: 14,
                    color: colors.text,
                  }}
                  value={pin}
                  onChangeText={(val) => {
                    setPin(val);
                    if (val.length === 4) {
                      handleExecuteTransfer(val);
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={4}
                  secureTextEntry
                  autoFocus
                />
                <TouchableOpacity
                  onPress={() => {
                    setPinModalVisible(false);
                    router.push('/auth/forgot-pin');
                  }}
                  style={{ marginTop: 8, alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.primary }}>
                    {t('auth.forgot_pin')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => setPinModalVisible(false)}
                  disabled={submitting}
                  style={{
                    flex: 1, paddingVertical: 14, borderRadius: 14,
                    backgroundColor: colors.border,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleExecuteTransfer(pin)}
                  disabled={submitting || pin.length !== 4}
                  style={{
                    flex: 1, opacity: (submitting || pin.length !== 4) ? 0.6 : 1,
                  }}
                >
                  <LinearGradient
                    colors={[colors.primary, `${colors.primary}CC`]}
                    style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.secondary} />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.secondary }}>
                        {t('transfer.confirm_transfer_btn')}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* QR Scanner Modal */}
      <Modal visible={scannerVisible} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {hasCameraPermission === false ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <View style={{
                borderRadius: 24, padding: 24, width: '100%',
                backgroundColor: colors.surface,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 8 }}>
                  {t('transfer.camera_needed')}
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                  {t('transfer.camera_needed_desc')}
                </Text>
                <TouchableOpacity
                  onPress={() => setScannerVisible(false)}
                  style={{ paddingVertical: 12, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: colors.secondary }}>{t('common.close')}</Text>
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
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 24 }}>
                <View style={{ borderRadius: 24, backgroundColor: `${colors.background}EE`, padding: 20 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{t('transfer.scan_recipient_qr')}</Text>
                    <TouchableOpacity onPress={() => setScannerVisible(false)}>
                      <Feather name="x" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  {scanError ? (
                    <Text style={{ fontSize: 12, color: colors.error, marginBottom: 12 }}>{scanError}</Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                      {t('transfer.scan_align_hint')}
                    </Text>
                  )}
                  {qrScanLoading && (
                    <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 12 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => setScannerVisible(false)}
                    style={{ borderRadius: 14, backgroundColor: colors.primary, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: colors.text }}>{t('common.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* ── RECEIPT MODAL ── */}
      <TransferReceiptModal
        visible={receiptVisible}
        onClose={() => {
          setReceiptVisible(false);
          setReceiptTransaction(null);
          router.back();
        }}
        transaction={receiptTransaction}
      />
    </SafeAreaView>
  );
}