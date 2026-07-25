// app/cash-out.tsx
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
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

const QUICK_AMOUNTS = [10000, 50000, 100000, 500000, 1000000];

export default function CashOutScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const shouldAutoScan = params.scan === 'true';

  const { theme, colors } = useTheme();
  const isDark = theme === 'dark';

  const [managerPhone, setManagerPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // PIN Modal state
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pin, setPin] = useState("");

  // Receipt Modal state
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [receiptTransaction, setReceiptTransaction] = useState<ReceiptTransaction | null>(null);

  const [selectedManagerQr, setSelectedManagerQr] = useState<QrLookupResult | null>(null);
  const [scannerVisible, setScannerVisible] = useState(shouldAutoScan);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [qrScanLoading, setQrScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [phoneLookupUser, setPhoneLookupUser] = useState<{ full_name?: string; role?: string } | null>(null);
  const [phoneLookupLoading, setPhoneLookupLoading] = useState(false);
  const [roleValidationError, setRoleValidationError] = useState<string | null>(null);

  // Validate recipient by phone lookup
  const validateManagerPhone = async (phone: string) => {
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

        if (role && role !== "agent_manager") {
          const roleDisplay = role.replace(/_/g, ' ');
          const msg = `This number belongs to an ${roleDisplay}. Return Float is ONLY allowed for Agent Manager accounts.`;
          setRoleValidationError(msg);
          setPhoneLookupUser(null);
          Toast.show({
            type: "error",
            text1: "Invalid Recipient",
            text2: msg,
          });
          return false;
        } else {
          setPhoneLookupUser({ full_name: userData?.full_name, role: 'agent_manager' });
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

  // Step 1: Click Initiate -> Validate fields & open PIN Modal
  const handleInitiateTransfer = async () => {
    if (!managerPhone.trim()) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter manager phone number" });
      return;
    }

    if (roleValidationError) {
      Toast.show({ type: "error", text1: "Role Restricted", text2: roleValidationError });
      return;
    }

    if (selectedManagerQr?.user?.role && selectedManagerQr.user.role !== "agent_manager") {
      Toast.show({ type: "error", text1: "Role Restricted", text2: "Recipient is not an Agent Manager." });
      return;
    }

    if (!amount.trim() || Number(amount) <= 0) {
      Toast.show({ type: "error", text1: "Error", text2: "Please enter valid amount" });
      return;
    }

    // Perform final role check before submission
    const isValid = await validateManagerPhone(managerPhone);
    if (!isValid) return;

    // Open PIN Modal
    setPin("");
    setPinModalVisible(true);
  };

  // Step 2: Submit inside PIN Modal with PIN
  const handleExecuteTransfer = async (enteredPin: string) => {
    if (!enteredPin || enteredPin.length !== 4) {
      Toast.show({ type: "error", text1: "Invalid PIN", text2: "Please enter your 4-digit PIN" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch("/transfers/agent", {
        method: "POST",
        body: JSON.stringify({
          receiver_phone: managerPhone,
          amount: Number(amount),
          pin: enteredPin,
          description: description || undefined,
        }),
      });

      if (res.status === 200 && res.body?.success) {
        setPinModalVisible(false);
        const txData = res.body.data;
        setReceiptTransaction({
          id: txData?.id,
          transaction_number: txData?.transaction_number || 'N/A',
          transaction_type: txData?.transaction_type || 'agent_to_agent_manager',
          amount: Number(txData?.amount || amount),
          fee: Number(txData?.fee || 0),
          sender_name: txData?.sender_name,
          sender_phone: txData?.sender_phone,
          receiver_name: txData?.receiver_name || selectedManagerQr?.user?.full_name,
          receiver_phone: txData?.receiver_phone || managerPhone,
          description: txData?.description || description,
          status: txData?.status || 'completed',
          created_at: txData?.created_at,
        });
        setReceiptVisible(true);
        Toast.show({
          type: "success",
          text1: "Float Returned Successfully",
          text2: `Returned ${Number(amount).toLocaleString()} MMK to manager`
        });
      } else {
        const msg = res.body?.message ?? "Could not complete float return";
        if (msg.toLowerCase().includes("only transfer to customers or agent managers")) {
          Toast.show({
            type: "error",
            text1: "Recipient Role Error",
            text2: "Float Return can only be sent to Agent Manager accounts.",
          });
        } else {
          Toast.show({ type: "error", text1: "Failed", text2: msg });
        }
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Network error" });
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
      setScanError("Scanned QR value is invalid.");
      return;
    }

    setQrScanLoading(true);
    setScanError(null);

    try {
      const res = await apiFetch(`/qr-codes/lookup?value=${encodeURIComponent(qrValue)}`);
      if (res.status === 200 && res.body?.success) {
        const qrData = res.body.data as QrLookupResult;

        if (qrData.user?.role && qrData.user.role !== "agent_manager") {
          const role = qrData.user.role;
          let msg: string;
          if (role === 'agent') {
            msg = 'This is an Agent QR code. Float Return only accepts Agent Manager QR codes.';
          } else {
            const roleDisplay = role.replace(/_/g, ' ');
            msg = `This is a ${roleDisplay} QR code. Float Return ONLY accepts Agent Manager accounts.`;
          }
          Toast.show({
            type: "error",
            text1: "Wrong QR Code 🛑",
            text2: msg,
          });
          setSelectedManagerQr(null);
          setRoleValidationError(msg);
          setScannerVisible(false);
          return;
        }

        setSelectedManagerQr(qrData);
        setManagerPhone(qrData.user?.phone_number ?? "");
        setPhoneLookupUser({ full_name: qrData.user?.full_name, role: 'agent_manager' });
        setRoleValidationError(null);
        setScannerVisible(false);
        Toast.show({
          type: "success",
          text1: "Manager QR Scanned",
          text2: `${qrData.user?.full_name ?? qrData.user?.phone_number ?? "Agent Manager"} verified.`
        });
      } else {
        Toast.show({ type: "error", text1: "Lookup Failed", text2: res.body?.message ?? "Could not recognize QR code." });
        setSelectedManagerQr(null);
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Scan Error", text2: "Unable to look up QR code." });
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
              Agent Manager Transfer
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setScannerVisible(true)}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: `${colors.success}26`,
            alignItems: 'center', justifyContent: 'center',
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="qrcode-scan" size={20} color={colors.success} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 40 }}>
          <View style={{ gap: 18 }}>

            {/* Manager Phone Input */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Manager Phone Number
                </Text>
                <TouchableOpacity
                  onPress={() => setScannerVisible(true)}
                  style={{ flexDirection: 'row', alignItems: 'center' }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="qrcode-scan" size={14} color={colors.success} />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success, marginLeft: 4 }}>
                    Scan Manager QR
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
                <Feather name="user-check" size={18} color={roleValidationError ? colors.error : colors.textSecondary} style={{ marginRight: 10 }} />
                <TextInput
                  placeholder="09xxxxxxxx"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    flex: 1, paddingVertical: 14,
                    fontSize: 16, fontWeight: '600',
                    color: roleValidationError ? colors.error : (colors.text),
                  }}
                  value={managerPhone}
                  onChangeText={(val) => {
                    setManagerPhone(val);
                    setRoleValidationError(null);
                    if (selectedManagerQr) setSelectedManagerQr(null);
                  }}
                  onBlur={() => validateManagerPhone(managerPhone)}
                  keyboardType="phone-pad"
                />
                {phoneLookupLoading && (
                  <ActivityIndicator size="small" color={colors.success} style={{ marginLeft: 8 }} />
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

              {/* Verified Manager Banner */}
              {!roleValidationError && (phoneLookupUser || selectedManagerQr) && (
                <View style={{
                  marginTop: 10, padding: 12, borderRadius: 14,
                  backgroundColor: `${colors.success}1A`,
                  borderWidth: 1, borderColor: `${colors.success}4D`,
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Feather name="check-circle" size={14} color={colors.success} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: colors.success }}>
                        Manager: {selectedManagerQr?.user?.full_name ?? phoneLookupUser?.full_name ?? selectedManagerQr?.user?.phone_number ?? managerPhone}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2, marginLeft: 20 }}>
                      Verified Agent Manager Account ✓
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedManagerQr(null);
                      setPhoneLookupUser(null);
                      setManagerPhone("");
                      setRoleValidationError(null);
                    }}
                    style={{ padding: 4 }}
                  >
                    <Feather name="x" size={16} color={colors.success} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Amount */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Return Amount (MMK)
              </Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center',
                borderRadius: 16, borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                paddingHorizontal: 16,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: colors.success, marginRight: 10 }}>
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
                        backgroundColor: amount === amt.toString() ? colors.success : (colors.surface),
                        borderWidth: 1,
                        borderColor: amount === amt.toString() ? colors.success : colors.border,
                      }}
                    >
                      <Text style={{
                        fontSize: 11, fontWeight: '700',
                        color: amount === amt.toString() ? colors.text : colors.textSecondary,
                      }}>
                        +{amt.toLocaleString()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Description */}
            <View>
              <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
                Description (Optional)
              </Text>
              <TextInput
                placeholder="e.g. End of day float return"
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

            {/* Initiate Float Return Button */}
            <TouchableOpacity
              onPress={handleInitiateTransfer}
              disabled={!!roleValidationError}
              activeOpacity={0.85}
              style={{ marginTop: 14, opacity: roleValidationError ? 0.6 : 1 }}
            >
              <LinearGradient
                colors={[colors.success, `${colors.success}CC`]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ paddingVertical: 16, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text }}>
                  Proceed to Float Return
                </Text>
              </LinearGradient>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── VERIFY PIN MODAL BOX ── */}
      <Modal visible={pinModalVisible} animationType="slide" transparent onRequestClose={() => setPinModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
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
                    Verify Security PIN
                  </Text>
                  <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                    Confirm float return of {Number(amount).toLocaleString()} MMK
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPinModalVisible(false)}>
                  <Feather name="x" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, textAlign: 'center' }}>
                  Enter 4-Digit Security PIN
                </Text>
                <TextInput
                  placeholder="• • • •"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    padding: 16, borderRadius: 16, borderWidth: 2,
                    borderColor: colors.success,
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
                    Cancel
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
                    colors={[colors.success, `${colors.success}CC`]}
                    style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    {submitting ? (
                      <ActivityIndicator size="small" color={colors.text} />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>
                        Confirm Return
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
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
                  Camera Access Needed
                </Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
                  Please enable camera permission to scan manager QR codes.
                </Text>
                <TouchableOpacity
                  onPress={() => setScannerVisible(false)}
                  style={{ paddingVertical: 12, borderRadius: 14, backgroundColor: colors.success, alignItems: 'center' }}
                >
                  <Text style={{ fontWeight: '700', color: colors.text }}>Close</Text>
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
                    <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>Scan Agent Manager QR</Text>
                    <TouchableOpacity onPress={() => setScannerVisible(false)}>
                      <Feather name="x" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                  {scanError ? (
                    <Text style={{ fontSize: 12, color: colors.error, marginBottom: 12 }}>{scanError}</Text>
                  ) : (
                    <Text style={{ fontSize: 12, color: colors.textSecondary, marginBottom: 12 }}>
                      Align the manager's QR code within the frame to scan.
                    </Text>
                  )}
                  {qrScanLoading && (
                    <ActivityIndicator size="small" color={colors.success} style={{ marginBottom: 12 }} />
                  )}
                  <TouchableOpacity
                    onPress={() => setScannerVisible(false)}
                    style={{ borderRadius: 14, backgroundColor: colors.success, paddingVertical: 12, alignItems: 'center' }}
                  >
                    <Text style={{ fontWeight: '700', color: colors.text }}>Cancel</Text>
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