// app/(tabs)/transactions.tsx
import {
  Text,
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";

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

const filterOptions = [
  { label: "All", value: "all", icon: "list" as const },
  { label: "Cash In", value: "agent_to_customer", icon: "arrow-down-left" as const },
  { label: "Cash Out", value: "customer_to_agent", icon: "arrow-up-right" as const },
  { label: "Transfer", value: "customer_to_customer", icon: "repeat" as const },
];

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [isFocused, setIsFocused] = useState(false);

  const fetchTransactions = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      let url = "/transactions?per_page=50";
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filter !== "all") url += `&transaction_type=${filter}`;
      const res = await apiFetch(url);
      if (res.status === 200) {
        setTransactions(res.body.data || []);
      } else {
        Toast.show({ type: "error", text1: "Error", text2: "Failed to load transactions" });
      }
    } catch (e) {
      Toast.show({ type: "error", text1: "Error", text2: "Could not connect" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  const onRefresh = () => { setRefreshing(true); fetchTransactions(true); };

  if (loading && !refreshing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>
        <ActivityIndicator size="large" color="#D5E726" />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#FAFAFA' }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.5 }}>
              History
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
              {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 10, paddingVertical: 6,
            borderRadius: 12,
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
            flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981', marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '600', color: isDark ? '#9CA3AF' : '#6B7280' }}>Live</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: 24, marginBottom: 12 }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          borderRadius: 16, borderWidth: 1.5,
          borderColor: isFocused ? '#D5E726' : (isDark ? '#2F332B' : '#E2E8F0'),
          backgroundColor: isDark ? '#161814' : '#FFFFFF',
          paddingHorizontal: 16,
        }}>
          <Feather name="search" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <TextInput
            placeholder="Search by phone, type..."
            placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
            style={{
              flex: 1,
              paddingVertical: 14,
              paddingLeft: 10,
              fontSize: 14,
              color: isDark ? '#FFFFFF' : '#0A0B09',
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => fetchTransactions()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Feather name="x-circle" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
        style={{ marginBottom: 16 }}
      >
        {filterOptions.map((option) => (
          <TouchableOpacity
            key={option.value}
            onPress={() => setFilter(option.value)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row', alignItems: 'center',
              paddingHorizontal: 14, paddingVertical: 9,
              borderRadius: 20,
              backgroundColor: filter === option.value ? '#D5E726' : (isDark ? '#161814' : '#FFFFFF'),
              borderWidth: 1,
              borderColor: filter === option.value ? '#D5E726' : (isDark ? '#2F332B' : '#E2E8F0'),
            }}
          >
            <Feather
              name={option.icon}
              size={13}
              color={filter === option.value ? '#0A0B09' : (isDark ? '#6B7280' : '#94A3B8')}
            />
            <Text style={{
              marginLeft: 6,
              fontSize: 12, fontWeight: '600',
              color: filter === option.value ? '#0A0B09' : (isDark ? '#9CA3AF' : '#6B7280'),
            }}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Transaction List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D5E726" colors={["#D5E726"]} />}
        showsVerticalScrollIndicator={false}
      >
        {transactions.length === 0 ? (
          <View style={{
            paddingVertical: 48, borderRadius: 20, alignItems: 'center',
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
          }}>
            <View style={{
              width: 64, height: 64, borderRadius: 32,
              backgroundColor: isDark ? '#0A0B09' : '#F8FAFC',
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 14,
            }}>
              <Feather name="inbox" size={28} color={isDark ? '#2F332B' : '#CBD5E1'} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#4B5563' : '#94A3B8' }}>
              No transactions found
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#374151' : '#CBD5E1', marginTop: 4 }}>
              Try changing your filter or search
            </Text>
          </View>
        ) : (
          transactions.map((tx) => {
            const isSender = tx.sender_wallet_id === tx.receiver_wallet_id;
            const isCashIn = tx.transaction_type === "agent_to_customer";
            const isCashOut = tx.transaction_type === "customer_to_agent";

            let symbol = "-";
            let amountColor = "#EF4444";
            let icon: any = "arrow-up-right";
            let iconBg = "rgba(239,68,68,0.1)";
            let iconColor = "#EF4444";
            let txLabel = tx.transaction_type.replace(/_/g, ' ');

            if (isCashIn) {
              symbol = "-"; amountColor = "#A0AF10"; icon = "arrow-up-right";
              iconBg = "rgba(213,231,38,0.15)"; iconColor = "#A0AF10";
              txLabel = "Cash In";
            } else if (isCashOut) {
              symbol = "+"; amountColor = "#10b981"; icon = "arrow-down-left";
              iconBg = "rgba(16,185,129,0.1)"; iconColor = "#10b981";
              txLabel = "Float Return";
            } else if (!isSender) {
              symbol = "+"; amountColor = "#10b981"; icon = "arrow-down-left";
              iconBg = "rgba(16,185,129,0.1)"; iconColor = "#10b981";
            }

            const date = new Date(tx.created_at);
            const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            return (
              <View
                key={tx.id}
                style={{
                  padding: 16, borderRadius: 18,
                  backgroundColor: isDark ? '#161814' : '#FFFFFF',
                  borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{
                    width: 46, height: 46, borderRadius: 14,
                    backgroundColor: iconBg,
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Feather name={icon} size={20} color={iconColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                      {isSender ? tx.receiver_phone : tx.sender_phone}
                    </Text>
                    <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                      {txLabel}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: amountColor }}>
                      {symbol}{tx.amount.toLocaleString()} Ks
                    </Text>
                    <View style={{
                      marginTop: 4, paddingHorizontal: 8, paddingVertical: 3,
                      borderRadius: 8,
                      backgroundColor: tx.status === 'completed'
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(245,158,11,0.12)',
                    }}>
                      <Text style={{
                        fontSize: 9, fontWeight: '700',
                        color: tx.status === 'completed' ? '#10b981' : '#F59E0B',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        {tx.status}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{
                  marginTop: 12, paddingTop: 12,
                  borderTopWidth: 1,
                  borderTopColor: isDark ? '#2F332B' : '#F1F5F9',
                  flexDirection: 'row', justifyContent: 'space-between',
                }}>
                  <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#94A3B8' }}>
                    Ref: {tx.transaction_number}
                  </Text>
                  <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#94A3B8' }}>
                    {dateStr} • {timeStr} • Fee: {tx.fee.toLocaleString()} Ks
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}