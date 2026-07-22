// app/(tabs)/index.tsx
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import { useTheme } from "../../providers/ThemeProvider";
import { logout } from "../../services/auth";
import {
  addMoneyReceivedNotification,
  AppNotification,
  clearAllNotifications,
  getNotifications,
  markAllNotificationsAsRead,
} from "../../services/notificationStore";

interface UserProfile {
  id: number;
  phone_number: string;
  full_name: string | null;
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

// This function uses colors from the theme config
const getTxMeta = (tx: Transaction, colors: any) => {
  const type = tx.transaction_type;
  if (type === 'agent_to_customer') return {
    label: 'Cash In',
    icon: 'arrow-up-right' as const,
    color: colors.primary,
    bg: `${colors.primary}1F`,
    sign: '-'
  };
  if (type === 'agent_to_agent_manager') return {
    label: 'Float Return',
    icon: 'corner-right-up' as const,
    color: colors.success,
    bg: `${colors.success}1F`,
    sign: '-'
  };
  if (type === 'agent_manager_to_agent') return {
    label: 'Float Received',
    icon: 'corner-left-down' as const,
    color: colors.success,
    bg: `${colors.success}1F`,
    sign: '+'
  };
  if (type === 'customer_to_agent') return {
    label: 'Cash Out',
    icon: 'arrow-down-left' as const,
    color: colors.primary,
    bg: `${colors.primary}1F`,
    sign: '+'
  };
  return {
    label: type.replace(/_/g, ' '),
    icon: 'activity' as const,
    color: colors.textSecondary,
    bg: `${colors.textSecondary}1F`,
    sign: ''
  };
};

export default function DashboardScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme(); // Get colors from theme
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalance, setShowBalance] = useState(true);

  // Logout Modal state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationsModalVisible, setNotificationsModalVisible] = useState(false);

  // Ref to track balance for real-time incoming transfer notifications
  const prevBalanceRef = useRef<number | null>(null);

  // Load notifications
  const loadNotifs = useCallback(async () => {
    const list = await getNotifications();
    setNotifications(list);
  }, []);

  useEffect(() => {
    loadNotifs();
  }, [loadNotifs]);

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
            text1: "Money Received!",
            text2: `+${diff.toLocaleString()} MMK added to your wallet`,
          });

          // Add to Notification Store
          const updatedNotifs = await addMoneyReceivedNotification({
            amount: diff,
            type: 'money_received',
          });
          setNotifications(updatedNotifs);
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

  // Poll every 3 seconds for real-time balance updates & incoming money notifications
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
      loadNotifs();
    }, [pollData, loadNotifs])
  );

  const onRefresh = () => { setRefreshing(true); pollData(true); loadNotifs(); };

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

  const handleMarkAllRead = async () => {
    const updated = await markAllNotificationsAsRead();
    setNotifications(updated);
  };

  const handleClearAllNotifs = async () => {
    await clearAllNotifications();
    setNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading && !refreshing && !profile) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ marginTop: 12, fontSize: 13, color: colors.textSecondary }}>Loading dashboard...</Text>
      </View>
    );
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        {/* ── Header ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{formattedDate}</Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2, letterSpacing: -0.5 }}>
              {profile?.full_name ?? 'Customer User'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {/* 🔔 Notification Bell Button */}
            <TouchableOpacity
              onPress={() => {
                setNotificationsModalVisible(true);
                handleMarkAllRead();
              }}
              activeOpacity={0.7}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: colors.border,
                shadowColor: colors.secondary, shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              }}
            >
              <Feather name="bell" size={19} color={colors.primary} />
              {unreadCount > 0 && (
                <View style={{
                  position: 'absolute', top: -2, right: -2,
                  backgroundColor: colors.error,
                  borderRadius: 10, minWidth: 18, height: 18,
                  alignItems: 'center', justifyContent: 'center',
                  paddingHorizontal: 4, borderWidth: 1.5,
                  borderColor: colors.background,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={() => setLogoutModalVisible(true)}
              activeOpacity={0.7}
              style={{
                width: 44, height: 44, borderRadius: 22,
                backgroundColor: colors.surface,
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: colors.border,
                shadowColor: colors.secondary, shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
              }}
            >
              <Feather name="log-out" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Wallet Balance Card (real-time balance update) ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <LinearGradient
            colors={[colors.primary, `${colors.primary}`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28, padding: 28,
              shadowColor: colors.primary, shadowOpacity: 0.45,
              shadowRadius: 28, shadowOffset: { width: 0, height: 14 },
              elevation: 14,
            }}
          >
            {/* Top row: label + eye toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 32, height: 32, borderRadius: 10,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 10,
                }}>
                  <Feather name="credit-card" size={16} color={colors.secondary} />
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.secondary, letterSpacing: 0.6, textTransform: 'uppercase' }}>
                  Wallet Balance
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <TouchableOpacity
                  onPress={() => setShowBalance(!showBalance)}
                  style={{
                    width: 38, height: 38, borderRadius: 19,
                    backgroundColor: `${colors.secondary}1A`,
                    alignItems: 'center', justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <Feather name={showBalance ? "eye" : "eye-off"} size={16} color={colors.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Big balance */}
            <Text style={{
              fontSize: 42, fontWeight: '900', color: colors.secondary,
              letterSpacing: -1.5, marginBottom: 6,
            }}>
              {showBalance
                ? (profile?.wallet?.balance ?? 0).toLocaleString()
                : '• • • •'
              }
            </Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: colors.secondary, marginBottom: 20 }}>
              MMK
            </Text>

            {/* Wallet number + status pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '600', color: 'rgba(0,0,0,0.4)', textTransform: 'uppercase', letterSpacing: 0.6 }}>
                  Wallet No.
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '800', color: colors.secondary, marginTop: 2 }}>
                  {profile?.wallet?.wallet_number ?? '—'}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 12, paddingVertical: 6,
                borderRadius: 20, backgroundColor: `${colors.secondary}1F`,
                flexDirection: 'row', alignItems: 'center',
              }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondary, marginRight: 6 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  {profile?.wallet?.status ?? 'Active'}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Account Code Info Card ── */}
        {profile?.agent_profile && (
          <View style={{ paddingHorizontal: 24, marginTop: 16 }}>
            <View style={{
              padding: 16, borderRadius: 20,
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.border,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: `${colors.success}1F`,
                  alignItems: 'center', justifyContent: 'center',
                  marginRight: 14,
                }}>
                  <Feather name="tag" size={18} color={colors.success} />
                </View>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Customer ID
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 2 }}>
                    {profile.agent_profile.agent_code}
                  </Text>
                </View>
              </View>
              {profile.agent_profile.shop_name && (
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                    Shop
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text, marginTop: 2 }}>
                    {profile.agent_profile.shop_name}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            {[
              { label: 'Send Money', icon: 'arrow-up-right', color: colors.primary, bg: `${colors.primary}1F`, route: '/cash-in' },
              { label: 'My QR', icon: 'grid', color: colors.primary, bg: `${colors.primary}1F`, route: '/qr-code' },
              { label: 'Scan QR', icon: 'camera', color: colors.success, bg: `${colors.success}1F`, route: '/cash-in?scan=true' },
            ].map((action, idx) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.75}
                style={{
                  width: '48%', padding: 14, borderRadius: 18, alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1, borderColor: colors.border,
                  marginBottom: 12,
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
                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Activity removed per user request */}
      </ScrollView>


      {/* ── NOTIFICATIONS MODAL ── */}
      <Modal visible={notificationsModalVisible} animationType="slide" transparent onRequestClose={() => setNotificationsModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: `${colors.background}B3` }}>
          <View style={{
            maxHeight: '80%', borderTopLeftRadius: 28, borderTopRightRadius: 28,
            backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
            paddingTop: 12, paddingBottom: 24,
          }}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingVertical: 6 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Title row */}
            <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: colors.text }}>
                  Notifications
                </Text>
                {notifications.length > 0 && (
                  <View style={{
                    marginLeft: 8, paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 10, backgroundColor: `${colors.primary}33`,
                  }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: colors.primary }}>
                      {notifications.length}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearAllNotifs} activeOpacity={0.7}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.error }}>
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setNotificationsModalVisible(false)} activeOpacity={0.7}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: isDark ? colors.background : `${colors.border}33`,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name="x" size={16} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Notification List */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 10, paddingBottom: 20 }}>
              {notifications.length === 0 ? (
                <View style={{ paddingVertical: 48, alignItems: 'center' }}>
                  <View style={{
                    width: 56, height: 56, borderRadius: 28,
                    backgroundColor: `${colors.border}33`,
                    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
                  }}>
                    <Feather name="bell-off" size={24} color={colors.textSecondary} />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textSecondary }}>
                    No notifications yet
                  </Text>
                  <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 4 }}>
                    Incoming money alerts will appear here
                  </Text>
                </View>
              ) : (
                notifications.map((n) => {
                  const date = new Date(n.timestamp);
                  const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <View
                      key={n.id}
                      style={{
                        padding: 14, borderRadius: 16,
                        backgroundColor: isDark ? colors.background : `${colors.border}22`,
                        borderWidth: 1, borderColor: colors.border,
                        marginBottom: 10,
                        flexDirection: 'row', alignItems: 'center',
                      }}
                    >
                      <View style={{
                        width: 42, height: 42, borderRadius: 14,
                        backgroundColor: `${colors.primary}26`,
                        alignItems: 'center', justifyContent: 'center',
                        marginRight: 12,
                      }}>
                        <Feather name="arrow-down-left" size={20} color={colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                          {n.title}
                        </Text>
                        <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                          {n.message}
                        </Text>
                        <Text style={{ fontSize: 10, color: colors.textSecondary, marginTop: 4 }}>
                          {dateStr} • {timeStr}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
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