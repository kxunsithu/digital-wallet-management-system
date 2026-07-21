// app/(tabs)/index.tsx
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../../providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import { logout } from "../../services/auth";
import { LinearGradient } from 'expo-linear-gradient';
import FloatMenu from "../../components/FloatMenu";
import FloatMenuButton from "../../components/FloatMenuButton";

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
  email: string | null;
  status: string;
  role?: string;
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

const getTxMeta = (tx: Transaction) => {
  const type = tx.transaction_type;
  if (type === 'agent_to_customer') return { label: 'Cash In', icon: 'arrow-up-right' as const, color: '#D5E726', bg: 'rgba(213,231,38,0.12)', sign: '-' };
  if (type === 'agent_to_agent_manager') return { label: 'Float Return', icon: 'corner-right-up' as const, color: '#10b981', bg: 'rgba(16,185,129,0.12)', sign: '-' };
  if (type === 'agent_manager_to_agent') return { label: 'Float Received', icon: 'corner-left-down' as const, color: '#10b981', bg: 'rgba(16,185,129,0.12)', sign: '+' };
  if (type === 'customer_to_agent') return { label: 'Cash Out', icon: 'arrow-down-left' as const, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', sign: '+' };
  return { label: type.replace(/_/g, ' '), icon: 'activity' as const, color: '#6B7280', bg: 'rgba(107,114,128,0.12)', sign: '' };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);
  const [floatMenuVisible, setFloatMenuVisible] = useState(false);

  // Logout Modal state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Ref to track balance for real-time incoming transfer notifications
  const prevBalanceRef = useRef<number | null>(null);

  // Real-time balance polling (3 seconds interval)
  const pollData = useCallback(async (showInitialSpinner = false) => {
    if (showInitialSpinner && !profile) setLoading(true);
    try {
      const profileRes = await apiFetch("/profile");
      if (profileRes.status === 200 && profileRes.body?.success) {
        const newProfile = profileRes.body.data;
        const newBalance = Number(newProfile?.wallet?.balance ?? 0);

        // Detect incoming transfer from another user
        if (prevBalanceRef.current !== null && newBalance > prevBalanceRef.current) {
          const diff = newBalance - prevBalanceRef.current;
          Toast.show({
            type: "success",
            text1: "Money Received! 💰",
            text2: `+${diff.toLocaleString()} MMK added to your wallet`,
          });
        }

        prevBalanceRef.current = newBalance;
        setProfile(newProfile);
      } else if (profileRes.status === 401) {
        router.replace("/auth");
        return;
      }

      const txRes = await apiFetch("/transactions?per_page=5");
      if (txRes.status === 200) {
        setTransactions(txRes.body.data || []);
      }
    } catch (e) {
      // silent background poll failure
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [profile, router]);

  // Initial load
  useEffect(() => {
    pollData(true);
  }, []);

  // Poll every 3 seconds for real-time balance updates
  useEffect(() => {
    const interval = setInterval(() => {
      pollData(false);
    }, 3000);

    return () => clearInterval(interval);
  }, [pollData]);

  // Also refresh when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      pollData(false);
    }, [pollData])
  );

  const onRefresh = () => { setRefreshing(true); pollData(true); };

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

  if (loading && !refreshing && !profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#D5E726" />
        <Text style={{ marginTop: 12, fontSize: 13, color: isDark ? '#6B7280' : '#9CA3AF' }}>Loading dashboard...</Text>
      </View>
    );
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D5E726" colors={["#D5E726"]} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF' }}>{formattedDate}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 2, letterSpacing: -0.5 }}>
              {profile?.full_name ?? 'Agent User'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setLogoutModalVisible(true)}
            activeOpacity={0.7}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
            }}
          >
            <Feather name="log-out" size={18} color={isDark ? '#D5E726' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* ── Wallet Balance Card (real-time balance update) ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <LinearGradient
            colors={['#D5E726', '#B0C110']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28, padding: 28,
              shadowColor: '#D5E726', shadowOpacity: 0.45,
              shadowRadius: 28, shadowOffset: { width: 0, height: 14 },
              elevation: 14,
            }}
          >
            {/* Top row: label + eye toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  backgroundColor: 'rgba(0,0,0,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 10,
                }}>
                  <Feather name="credit-card" size={16} color="#0A0B09" />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: 'rgba(0,0,0,0.55)', letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Wallet Balance
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {/* Live Indicator */}
                <View style={{
                  paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.12)', flexDirection: 'row', alignItems: 'center',
                }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0A0B09', marginRight: 5 }} />
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#0A0B09' }}>LIVE</Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowBalance(!showBalance)}
                  style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name={showBalance ? "eye" : "eye-off"} size={16} color="#0A0B09" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Big balance */}
            <Text style={{
              fontSize: 42, fontWeight: '900', color: '#0A0B09',
              letterSpacing: -1.5, marginBottom: 6,
            }}>
              {showBalance
                ? (profile?.wallet?.balance ?? 0).toLocaleString()
                : '• • • •'
              }
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: 'rgba(0,0,0,0.45)', marginBottom: 20 }}>
              MMK
            </Text>

            {/* Wallet number + status pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Wallet No.
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0A0B09', marginTop: 2 }}>
                  {profile?.wallet?.wallet_number ?? '—'}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.12)',
                flexDirection: 'row', alignItems: 'center',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#0A0B09', marginRight: 6 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#0A0B09', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {profile?.wallet?.status ?? 'Active'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Agent Code Info Card ── */}
        {profile?.agent_profile && (
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <View style={{
              padding: 16, borderRadius: 20,
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Feather name="tag" size={18} color="#8b5cf6" />
                </View>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Agent Code
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 2 }}>
                    {profile.agent_profile.agent_code}
                  </Text>
                </View>
              </View>
              {profile.agent_profile.shop_name && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Shop
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 2 }}>
                    {profile.agent_profile.shop_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {[
              { label: 'Cash In', icon: 'arrow-up-right', color: '#D5E726', bg: 'rgba(213,231,38,0.12)', route: '/cash-in' },
              { label: 'Return Float', icon: 'corner-right-up', color: '#10b981', bg: 'rgba(16,185,129,0.12)', route: '/cash-out' },
              { label: 'My QR', icon: 'grid', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', route: '/qr-code' },
              { label: 'Scan QR', icon: 'camera', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', route: '/cash-in?scan=true' },
            ].map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.75}
                style={{
                  flex: 1, padding: 14, borderRadius: 18, alignItems: 'center',
                  backgroundColor: isDark ? '#161814' : '#FFFFFF',
                  borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: action.bg,
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <Feather name={action.icon as any} size={20} color={action.color} />
                </View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.3 }}>
              Recent Activity
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/transactions')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#D5E726', marginRight: 4 }}>See All</Text>
              <Feather name="arrow-right" size={13} color="#D5E726" />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={{
              paddingVertical: 36, borderRadius: 20, alignItems: 'center',
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
            }}>
              <Feather name="inbox" size={28} color={isDark ? '#2F332B' : '#E2E8F0'} />
              <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#4B5563' : '#9CA3AF', marginTop: 10 }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {transactions.map((tx) => {
                const meta = getTxMeta(tx);
                const date = new Date(tx.created_at);
                const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                return (
                  <View
                    key={tx.id}
                    style={{
                      padding: 14, borderRadius: 18,
                      backgroundColor: isDark ? '#161814' : '#FFFFFF',
                      borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
                      flexDirection: 'row', alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: meta.bg, alignItems: 'center', justifyContent: 'center',
                      marginRight: 12,
                    }}>
                      <Feather name={meta.icon} size={19} color={meta.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                        {meta.label}
                      </Text>
                      <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                        {dateStr} · {timeStr}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: meta.color }}>
                      {meta.sign}{tx.amount.toLocaleString()} Ks
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Float Menu Button */}
      <FloatMenuButton onPress={() => setFloatMenuVisible(true)} />
      <FloatMenu isVisible={floatMenuVisible} onClose={() => setFloatMenuVisible(false)} />

      {/* ── LOGOUT CONFIRMATION MODAL BOX ── */}
      <Modal visible={logoutModalVisible} animationType="fade" transparent onRequestClose={() => setLogoutModalVisible(false)}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 24 }}>
          <View style={{
            width: '100%', maxWidth: 340, borderRadius: 24, padding: 24,
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
            alignItems: 'center',
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: 'rgba(239,68,68,0.12)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <Feather name="log-out" size={24} color="#EF4444" />
            </View>

            <Text style={{ fontSize: 18, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', textAlign: 'center' }}>
              Sign Out
            </Text>
            <Text style={{ fontSize: 13, color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', marginTop: 6, marginBottom: 24 }}>
              Are you sure you want to sign out of your account?
            </Text>

            <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
              <TouchableOpacity
                onPress={() => setLogoutModalVisible(false)}
                disabled={loggingOut}
                style={{
                  flex: 1, paddingVertical: 14, borderRadius: 14,
                  backgroundColor: isDark ? '#232620' : '#F1F5F9',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>
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
                  backgroundColor: '#EF4444',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  {loggingOut ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFFFFF' }}>
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