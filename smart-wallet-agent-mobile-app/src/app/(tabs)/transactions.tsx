// app/(tabs)/transactions.tsx
import {
  Text,
  View,
  FlatList,
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

const FILTER_OPTIONS = [
  { label: "All", value: "all" },
  { label: "Cash In", value: "agent_to_customer" },
  { label: "Float Return", value: "agent_to_agent_manager" },
  { label: "Cash Out", value: "customer_to_agent" },
];

const getTxMeta = (type: string) => {
  switch (type) {
    case 'agent_to_customer':
      return { label: 'Cash In', icon: 'arrow-up-right' as const, color: '#D5E726', bg: 'rgba(213,231,38,0.12)', sign: '-' };
    case 'agent_to_agent_manager':
      return { label: 'Float Return', icon: 'corner-right-up' as const, color: '#10b981', bg: 'rgba(16,185,129,0.12)', sign: '-' };
    case 'agent_manager_to_agent':
      return { label: 'Float Received', icon: 'corner-left-down' as const, color: '#10b981', bg: 'rgba(16,185,129,0.12)', sign: '+' };
    case 'customer_to_agent':
      return { label: 'Cash Out', icon: 'arrow-down-left' as const, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', sign: '+' };
    case 'customer_to_customer':
      return { label: 'P2P Transfer', icon: 'repeat' as const, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', sign: '±' };
    default:
      return { label: type.replace(/_/g, ' '), icon: 'activity' as const, color: '#6B7280', bg: 'rgba(107,114,128,0.12)', sign: '' };
  }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
};

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

  // Group transactions by date
  const groupedData = (() => {
    const groups: { title: string; data: Transaction[] }[] = [];
    const seen = new Map<string, number>();
    transactions.forEach((tx) => {
      const key = formatDate(tx.created_at);
      if (!seen.has(key)) {
        seen.set(key, groups.length);
        groups.push({ title: key, data: [tx] });
      } else {
        groups[seen.get(key)!].data.push(tx);
      }
    });
    // Flatten for FlatList: headers + items
    const flat: (Transaction | { type: 'header'; title: string; count: number })[] = [];
    groups.forEach((g) => {
      flat.push({ type: 'header', title: g.title, count: g.data.length });
      g.data.forEach((tx) => flat.push(tx));
    });
    return flat;
  })();

  const renderItem = ({ item }: { item: any }) => {
    // Header row
    if (item.type === 'header') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF' }}>
            {item.title}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#1F221B' : '#F1F5F9', marginLeft: 10 }} />
          <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#CBD5E1', marginLeft: 8 }}>
            {item.count}
          </Text>
        </View>
      );
    }

    const tx = item as Transaction;
    const meta = getTxMeta(tx.transaction_type);
    const date = new Date(tx.created_at);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const counterparty = tx.transaction_type.startsWith('agent_to')
      ? (tx.receiver_name || tx.receiver_phone)
      : (tx.sender_name || tx.sender_phone);

    return (
      <View
        style={{
          marginBottom: 10,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: isDark ? '#161814' : '#FFFFFF',
          borderWidth: 1,
          borderColor: isDark ? '#232620' : '#F0F4F8',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        {/* Left accent bar */}
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: 3, backgroundColor: meta.color, borderTopLeftRadius: 20, borderBottomLeftRadius: 20 }} />
          <View style={{ flex: 1, padding: 14 }}>
            {/* Main row */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Icon */}
              <View style={{
                width: 44, height: 44, borderRadius: 14,
                backgroundColor: meta.bg,
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12,
              }}>
                <Feather name={meta.icon} size={19} color={meta.color} />
              </View>

              {/* Middle info */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                    {meta.label}
                  </Text>
                  <View style={{
                    marginLeft: 8, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                    backgroundColor: tx.status === 'completed'
                      ? 'rgba(16,185,129,0.12)'
                      : 'rgba(245,158,11,0.12)',
                  }}>
                    <Text style={{
                      fontSize: 8, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase',
                      color: tx.status === 'completed' ? '#10b981' : '#f59e0b',
                    }}>
                      {tx.status}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                  {counterparty}
                </Text>
              </View>

              {/* Amount */}
              <Text style={{ fontSize: 16, fontWeight: '900', color: meta.color }}>
                {meta.sign}{tx.amount.toLocaleString()}
                <Text style={{ fontSize: 10, fontWeight: '600' }}> Ks</Text>
              </Text>
            </View>

            {/* Footer row */}
            <View style={{
              marginTop: 10, paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: isDark ? '#1F221B' : '#F8FAFC',
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'monospace' }}>
                {tx.transaction_number}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {tx.fee > 0 && (
                  <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#94A3B8', marginRight: 10 }}>
                    Fee: {tx.fee.toLocaleString()} Ks
                  </Text>
                )}
                <Text style={{ fontSize: 10, color: isDark ? '#4B5563' : '#9CA3AF' }}>
                  {timeStr}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: isDark ? '#0A0B09' : '#F8FAFC' }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 24, paddingTop: 20, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 26, fontWeight: '900', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.8 }}>
              History
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
              {transactions.length} record{transactions.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={{
            paddingHorizontal: 12, paddingVertical: 7,
            borderRadius: 20,
            backgroundColor: isDark ? '#161814' : '#FFFFFF',
            borderWidth: 1, borderColor: isDark ? '#2F332B' : '#E2E8F0',
            flexDirection: 'row', alignItems: 'center',
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981', marginRight: 6 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280' }}>Live</Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 14, borderRadius: 16, borderWidth: 1.5,
          borderColor: isFocused ? '#D5E726' : (isDark ? '#2F332B' : '#E2E8F0'),
          backgroundColor: isDark ? '#161814' : '#FFFFFF',
          paddingHorizontal: 14,
        }}>
          <Feather name="search" size={16} color={isDark ? '#6B7280' : '#9CA3AF'} />
          <TextInput
            placeholder="Search transactions..."
            placeholderTextColor={isDark ? '#4B5563' : '#94A3B8'}
            style={{
              flex: 1, paddingVertical: 13, paddingLeft: 10,
              fontSize: 14, color: isDark ? '#FFFFFF' : '#0A0B09',
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

        {/* Filter Pills */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {FILTER_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === opt.value ? '#D5E726' : (isDark ? '#161814' : '#FFFFFF'),
                borderWidth: 1,
                borderColor: filter === opt.value ? '#D5E726' : (isDark ? '#2F332B' : '#E2E8F0'),
              }}
            >
              <Text style={{
                fontSize: 11, fontWeight: '700',
                color: filter === opt.value ? '#0A0B09' : (isDark ? '#9CA3AF' : '#6B7280'),
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Transaction List */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#D5E726" />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item: any) => item.type === 'header' ? `h-${item.title}` : `tx-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D5E726" colors={["#D5E726"]} />
          }
          ListEmptyComponent={
            <View style={{
              paddingVertical: 56, borderRadius: 24, alignItems: 'center',
              backgroundColor: isDark ? '#161814' : '#FFFFFF',
              borderWidth: 1, borderColor: isDark ? '#2F332B' : '#F0F4F8',
            }}>
              <View style={{
                width: 72, height: 72, borderRadius: 24,
                backgroundColor: isDark ? '#0A0B09' : '#F8FAFC',
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Feather name="inbox" size={30} color={isDark ? '#2F332B' : '#CBD5E1'} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#4B5563' : '#94A3B8' }}>
                No transactions
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#374151' : '#CBD5E1', marginTop: 6 }}>
                Try a different filter or search
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}