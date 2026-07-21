// app/(tabs)/index.tsx
import {
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
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

export default function DashboardScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [floatMenuVisible, setFloatMenuVisible] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const profileRes = await apiFetch("/profile");
      if (profileRes.status === 200 && profileRes.body?.success) {
        setProfile(profileRes.body.data);
      } else if (profileRes.status === 401) {
        router.replace("/auth");
        return;
      } else {
        Toast.show({ type: "error", text1: "Error", text2: profileRes.body?.message ?? "Failed to fetch profile" });
      }

      const txRes = await apiFetch("/transactions?per_page=5");
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

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const handleLogout = async () => {
    try {
      await logout();
      Toast.show({ type: "success", text1: "Logged Out", text2: "Successfully signed out" });
      router.replace("/auth");
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Failed to sign out" });
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#D5E726" />
        <Text style={{ marginTop: 12, fontSize: 13, color: isDark ? '#6B7280' : '#9CA3AF' }}>Loading dashboard...</Text>
      </View>
    );
  }

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  const avatarLetter = profile?.full_name?.charAt(0)?.toUpperCase() ?? 'A';
  const isAgentManager = profile?.role === 'agent_manager';

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
            <Text style={{ fontSize: 13, color: isDark ? '#6B7280' : '#9CA3AF' }}>
              {formattedDate}
            </Text>
            <Text style={{ fontSize: 22, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 2, letterSpacing: -0.5 }}>
              {profile?.full_name ?? 'Agent User'} 👋
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDark ? '#2F332B' : '#E2E8F0',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 3,
            }}
          >
            <Feather name="log-out" size={18} color={isDark ? '#D5E726' : '#6B7280'} />
          </TouchableOpacity>
        </View>

        {/* ── Balance Card ── */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
          <LinearGradient
            colors={['#D5E726', '#B8C417']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 28,
              padding: 24,
              shadowColor: '#D5E726',
              shadowOpacity: 0.4,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 12 },
              elevation: 12,
            }}
          >
            {/* Float Balance */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={{ fontSize: 10, fontWeight: '700', color: 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  Float Balance
                </Text>
                <Text style={{ fontSize: 30, fontWeight: '900', color: '#0A0B09', marginTop: 4, letterSpacing: -1 }}>
                  {showBalances
                    ? `${(profile?.agent_profile?.float_balance ?? 0).toLocaleString()}`
                    : '••••••'
                  }
                  {showBalances && (
                    <Text style={{ fontSize: 15, fontWeight: '600' }}> MMK</Text>
                  )}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowBalances(!showBalances)}
                style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: 'rgba(0,0,0,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                }}
                activeOpacity={0.7}
              >
                <Feather name={showBalances ? "eye" : "eye-off"} size={17} color="#000" />
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.08)', marginVertical: 16 }} />

            {/* Secondary Balances */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Wallet Balance
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A0B09', marginTop: 3 }}>
                  {showBalances
                    ? `${(profile?.wallet?.balance ?? 0).toLocaleString()} MMK`
                    : '••••'
                  }
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: 'rgba(0,0,0,0.45)', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Monthly Volume
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0A0B09', marginTop: 3 }}>
                  {showBalances
                    ? `${(profile?.agent_profile?.total_volume_monthly ?? 0).toLocaleString()} MMK`
                    : '••••'
                  }
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Info Cards ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 16, flexDirection: 'row', gap: 12 }}>
          <View style={{
            flex: 1, padding: 16, borderRadius: 20,
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
          }}>
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: 'rgba(213,231,38,0.12)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Feather name="credit-card" size={15} color="#D5E726" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Wallet No.
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 4 }}>
              {profile?.wallet?.wallet_number ?? 'WAL-XXXX'}
            </Text>
          </View>
          <View style={{
            flex: 1, padding: 16, borderRadius: 20,
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
          }}>
            <View style={{
              width: 32, height: 32, borderRadius: 10,
              backgroundColor: 'rgba(16,185,129,0.12)',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 10,
            }}>
              <Feather name="tag" size={15} color="#10b981" />
            </View>
            <Text style={{ fontSize: 9, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8 }}>
              Agent Code
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginTop: 4 }}>
              {profile?.agent_profile?.agent_code ?? 'AG-XXXX'}
            </Text>
          </View>
        </View>

        {/* ── Quick Actions ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 24 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={() => router.push('/cash-in' as any)}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <LinearGradient
                colors={['#D5E726', '#C4D420']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={{ padding: 16, borderRadius: 20, alignItems: 'center' }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Feather name="arrow-down-left" size={20} color="#0A0B09" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0A0B09' }}>Cash In</Text>
                <Text style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', marginTop: 2 }}>Customer</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/cash-out' as any)}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <View style={{
                padding: 16, borderRadius: 20, alignItems: 'center',
                backgroundColor: isDark ? '#161814' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? '#2F332B' : '#E2E8F0',
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Feather name="arrow-up-right" size={20} color="#10b981" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>Return Float</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>Manager</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/qr-code' as any)}
              activeOpacity={0.8}
              style={{ flex: 1 }}
            >
              <View style={{
                padding: 16, borderRadius: 20, alignItems: 'center',
                backgroundColor: isDark ? '#161814' : '#FFFFFF',
                borderWidth: 1.5,
                borderColor: isDark ? '#2F332B' : '#E2E8F0',
              }}>
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: 'rgba(139,92,246,0.12)',
                  alignItems: 'center', justifyContent: 'center',
                  marginBottom: 10,
                }}>
                  <Feather name="grid" size={20} color="#8b5cf6" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>My QR</Text>
                <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>Code</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Recent Transactions ── */}
        <View style={{ paddingHorizontal: 24, marginTop: 28 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.3 }}>
                Recent Activity
              </Text>
              <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 1 }}>
                Your latest transactions
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/transactions')}
              activeOpacity={0.7}
              style={{ flexDirection: 'row', alignItems: 'center' }}
            >
              <Text style={{ fontSize: 13, color: '#D5E726', fontWeight: '700' }}>See All</Text>
              <Feather name="chevron-right" size={16} color="#D5E726" />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={{
              padding: 32, borderRadius: 20, alignItems: 'center',
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
            }}>
              <View style={{
                width: 56, height: 56, borderRadius: 28,
                backgroundColor: isDark ? '#0A0B09' : '#F8FAFC',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Feather name="inbox" size={24} color={isDark ? '#2F332B' : '#CBD5E1'} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#4B5563' : '#94A3B8' }}>
                No transactions yet
              </Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {transactions.slice(0, 4).map((tx) => {
                const isSender = profile?.wallet?.id === tx.sender_wallet_id;
                const isCashIn = tx.transaction_type === "agent_to_customer";
                const isCashOut = tx.transaction_type === "customer_to_agent";

                let symbol = "-";
                let amountColor = "#EF4444";
                let icon: any = "arrow-up-right";
                let iconBg = "rgba(239,68,68,0.1)";
                let iconColor = "#EF4444";

                if (isCashIn) {
                  symbol = "-"; amountColor = "#0A0B09"; icon = "arrow-up-right";
                  iconBg = "rgba(213,231,38,0.15)"; iconColor = "#A0AF10";
                } else if (isCashOut) {
                  symbol = "+"; amountColor = "#10b981"; icon = "arrow-down-left";
                  iconBg = "rgba(16,185,129,0.1)"; iconColor = "#10b981";
                } else if (!isSender) {
                  symbol = "+"; amountColor = "#10b981"; icon = "arrow-down-left";
                  iconBg = "rgba(16,185,129,0.1)"; iconColor = "#10b981";
                }

                const time = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const dateStr = new Date(tx.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                return (
                  <View
                    key={tx.id}
                    style={{
                      padding: 16, borderRadius: 18,
                      backgroundColor: isDark ? '#161814' : '#FFFFFF',
                      borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
                      flexDirection: 'row', alignItems: 'center',
                    }}
                  >
                    <View style={{
                      width: 44, height: 44, borderRadius: 14,
                      backgroundColor: iconBg,
                      alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Feather name={icon} size={19} color={iconColor} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                        {isSender ? tx.receiver_phone : tx.sender_phone}
                      </Text>
                      <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                        {dateStr} • {time} • {tx.transaction_type.replace(/_/g, ' ')}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: amountColor }}>
                      {symbol}{tx.amount.toLocaleString()} Ks
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

      {/* Float Menu */}
      <FloatMenu
        isVisible={floatMenuVisible}
        onClose={() => setFloatMenuVisible(false)}
      />
    </SafeAreaView>
  );
}