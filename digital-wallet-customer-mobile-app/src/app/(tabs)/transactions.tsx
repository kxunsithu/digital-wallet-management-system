// app/(tabs)/transactions.tsx
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import apiFetch from "../../lib/api";
import TransferReceiptModal, { ReceiptTransaction } from "../../components/TransferReceiptModal";
import { ExternalPayment, getMyExternalPayments } from "../../services/externalPayments";

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

interface HistoryEntry {
  key: string;
  kind: 'transaction' | 'external';
  type: string;
  status: string;
  amount: number;
  fee: number;
  reference: string;
  counterparty: string;
  created_at: string;
  tx?: Transaction;
  payment?: ExternalPayment;
}

const getTxMeta = (type: string, colors: any, t: any) => {
  switch (type) {
    case 'agent_to_customer':
      return { label: t('history.filter_received'), icon: 'arrow-up-right' as const, color: colors.primary, bg: `${colors.primary}1F`, sign: '+' };
    case 'customer_to_agent':
      return { label: t('history.filter_sent'), icon: 'arrow-down-left' as const, color: colors.primary, bg: `${colors.primary}1F`, sign: '-' };
    case 'customer_to_customer':
      return { label: t('history.filter_p2p'), icon: 'repeat' as const, color: colors.success, bg: `${colors.success}1F`, sign: '±' };
    case 'external_payment':
      return { label: t('history.external_payment'), icon: 'globe' as const, color: '#F59E0B', bg: '#F59E0B1F', sign: '-' };
    default:
      return { label: type.replace(/_/g, ' '), icon: 'activity' as const, color: colors.textSecondary, bg: `${colors.textSecondary}1F`, sign: '' };
  }
};

const formatDate = (dateStr: string, t: (key: string) => string) => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return t('history.today');
  if (date.toDateString() === yesterday.toDateString()) return t('history.yesterday');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
};

export default function TransactionsScreen() {
  const { theme, colors } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === 'dark';

  const filterOptions = [
    { label: t('history.filter_all'), value: "all" },
    { label: t('history.filter_received'), value: "agent_to_customer" },
    { label: t('history.filter_sent'), value: "customer_to_agent" },
    { label: t('history.filter_p2p'), value: "customer_to_customer" },
  ];

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [externalPayments, setExternalPayments] = useState<ExternalPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [isFocused, setIsFocused] = useState(false);

  // Receipt Modal state
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<ReceiptTransaction | null>(null);

  const fetchHistory = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      let url = "/transactions?per_page=50";
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (filter !== "all") url += `&transaction_type=${filter}`;

      const [txRes, extPayments] = await Promise.all([
        apiFetch(url),
        filter === "all"
          ? getMyExternalPayments().catch(() => [])
          : Promise.resolve([]),
      ]);

      if (txRes.status === 200) {
        setTransactions(txRes.body.data || []);
      } else {
        Toast.show({ type: "error", text1: t('common.error'), text2: t('history.load_failed') });
      }

      setExternalPayments(extPayments);
    } catch (e) {
      Toast.show({ type: "error", text1: t('common.error'), text2: t('common.network_error') });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, filter]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const onRefresh = () => { setRefreshing(true); fetchHistory(true); };

  const openExternalReceipt = (p: ExternalPayment) => {
    setSelectedTxForReceipt({
      transaction_number: p.reference,
      transaction_type: 'external_payment',
      amount: Number(p.amount),
      fee: Number(p.fee),
      sender_name: p.customer?.full_name ?? null,
      sender_phone: p.customer?.phone_number ?? null,
      receiver_name: p.external_system?.name ?? null,
      description: p.description,
      status: p.status,
      created_at: p.created_at,
    });
  };

  // Merge transactions and external payments, then group by date
  const entries: HistoryEntry[] = [];

  transactions.forEach((tx) => {
    if (tx.transaction_type === 'external_payment') return;
    entries.push({
      key: `tx-${tx.id}`,
      kind: 'transaction',
      type: tx.transaction_type,
      status: tx.status,
      amount: tx.amount,
      fee: tx.fee,
      reference: tx.transaction_number,
      counterparty: tx.transaction_type.startsWith('agent_to')
        ? (tx.sender_name || tx.sender_phone)
        : (tx.receiver_name || tx.receiver_phone),
      created_at: tx.created_at,
      tx,
    });
  });

  if (filter === 'all') {
    externalPayments.forEach((p) => {
      const system = p.external_system?.name || 'External System';
      entries.push({
        key: `ext-${p.id}`,
        kind: 'external',
        type: 'external_payment',
        status: p.status,
        amount: Number(p.amount),
        fee: Number(p.fee),
        reference: p.reference,
        counterparty: system,
        created_at: p.created_at,
        payment: p,
      });
    });
  }

  entries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const groupedData = (() => {
    const groups: { title: string; data: HistoryEntry[] }[] = [];
    const seen = new Map<string, number>();
    entries.forEach((entry) => {
      const key = formatDate(entry.created_at, t);
      if (!seen.has(key)) {
        seen.set(key, groups.length);
        groups.push({ title: key, data: [entry] });
      } else {
        groups[seen.get(key)!].data.push(entry);
      }
    });
    // Flatten for FlatList: headers + items
    const flat: (HistoryEntry | { type: 'header'; title: string; count: number })[] = [];
    groups.forEach((g) => {
      flat.push({ type: 'header', title: g.title, count: g.data.length });
      g.data.forEach((entry) => flat.push(entry));
    });
    return flat;
  })();

  const totalTransacted = entries.reduce((total, entry) => total + Number(entry.amount || 0), 0);
  const completedTransactions = entries.filter((entry) => entry.status === "completed").length;
  const totalRecords = entries.length;

  const renderItem = ({ item }: { item: any }) => {
    // Header row
    if (item.type === 'header') {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textSecondary }}>
            {item.title}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border, marginLeft: 10 }} />
          <Text style={{ fontSize: 10, color: colors.border, marginLeft: 8 }}>
            {item.count}
          </Text>
        </View>
      );
    }

    const entry = item as HistoryEntry;
    const meta = getTxMeta(entry.type, colors, t);
    const date = new Date(entry.created_at);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => {
          if (entry.kind === 'transaction' && entry.tx) {
            setSelectedTxForReceipt(entry.tx);
          } else if (entry.kind === 'external' && entry.payment) {
            openExternalReceipt(entry.payment);
          }
        }}
        style={{
          marginBottom: 10,
          borderRadius: 20,
          overflow: 'hidden',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: isDark ? 0 : 0.05,
          shadowRadius: 4,
          elevation: 1,
        }}
      >
        {/* Left accent bar */}
        <View style={{ flexDirection: 'row' }}>
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
                  <Text style={{ fontSize: 13, fontWeight: '800', color: colors.text }}>
                    {meta.label}
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                  {entry.counterparty}
                </Text>
              </View>

              {/* Amount */}
              <Text style={{ fontSize: 16, fontWeight: '900', color: meta.color }}>
                {meta.sign}{entry.amount.toLocaleString()}
                <Text style={{ fontSize: 10, fontWeight: '600' }}> {t('common.mmk')}</Text>
              </Text>
            </View>

            {/* Footer row */}
            <View style={{
              marginTop: 10, paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Text style={{ fontSize: 10, color: colors.textSecondary, fontFamily: 'monospace' }}>
                {entry.reference}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                {entry.fee > 0 && (
                  <Text style={{ fontSize: 10, color: colors.textSecondary, marginRight: 10 }}>
                    {t('history.fee')} {entry.fee.toLocaleString()} {t('common.mmk')}
                  </Text>
                )}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 10, color: colors.textSecondary }}>
                    {timeStr}
                  </Text>
                  <Feather name="file-text" size={11} color={colors.primary} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>

      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 }}>
              {t('history.title')}
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
              {t('history.subtitle')}
            </Text>
          </View>
          <View style={{
            width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
            backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: `${colors.primary}30`,
          }}>
            <Feather name="bar-chart-2" size={19} color={colors.primary} />
          </View>
        </View>

        <View style={{
          marginTop: 18, padding: 16, borderRadius: 22, backgroundColor: colors.primary,
          shadowColor: colors.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: isDark ? 0 : 0.16,
          shadowRadius: 14, elevation: 3,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 11, color: colors.background, opacity: 0.78, fontWeight: '700' }}>
                TOTAL ACTIVITY
              </Text>
              <Text style={{ fontSize: 23, fontWeight: '900', color: colors.background, marginTop: 3, letterSpacing: -0.5 }}>
                {totalTransacted.toLocaleString()} <Text style={{ fontSize: 12, fontWeight: '700' }}>{t('common.mmk')}</Text>
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: colors.background }}>
                {totalRecords}
              </Text>
              <Text style={{ fontSize: 10, color: colors.background, opacity: 0.78, fontWeight: '700' }}>
                RECORDS
              </Text>
            </View>
          </View>
          <View style={{ height: 1, backgroundColor: colors.background, opacity: 0.18, marginVertical: 13 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Feather name="check-circle" size={13} color={colors.background} />
            <Text style={{ fontSize: 11, color: colors.background, opacity: 0.9, marginLeft: 6 }}>
              {completedTransactions} completed transaction{completedTransactions !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>

        {/* Search bar */}
        <View style={{
          flexDirection: 'row', alignItems: 'center',
          marginTop: 18, borderRadius: 16, borderWidth: 1.5,
          borderColor: isFocused ? colors.primary : colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: 14,
        }}>
          <Feather name="search" size={16} color={colors.textSecondary} />
          <TextInput
            placeholder={t('history.search_placeholder')}
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1, paddingVertical: 13, paddingLeft: 10,
              fontSize: 14, color: colors.text,
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onSubmitEditing={() => fetchHistory()}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Feather name="x-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingRight: 20, marginTop: 13 }}
        >
          {filterOptions.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              onPress={() => setFilter(opt.value)}
              activeOpacity={0.75}
              style={{
                paddingHorizontal: 14, paddingVertical: 8,
                borderRadius: 20,
                backgroundColor: filter === opt.value ? colors.primary : (colors.surface),
                borderWidth: 1,
                borderColor: filter === opt.value ? colors.primary : colors.border,
              }}
            >
              <Text style={{
                fontSize: 11, fontWeight: '700',
                color: filter === opt.value ? colors.background : colors.textSecondary,
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Transaction List */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={groupedData}
          keyExtractor={(item: any) => item.type === 'header' ? `h-${item.title}` : item.key}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View style={{
              paddingVertical: 56, borderRadius: 24, alignItems: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1, borderColor: colors.border,
            }}>
              <View style={{
                width: 72, height: 72, borderRadius: 24,
                backgroundColor: isDark ? colors.background : `${colors.border}33`,
                alignItems: 'center', justifyContent: 'center', marginBottom: 16,
              }}>
                <Feather name="inbox" size={30} color={colors.border} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: colors.textSecondary }}>
                No transactions
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                Try a different filter or search
              </Text>
            </View>
          }
        />
      )}

      {/* ── RECEIPT MODAL ── */}
      <TransferReceiptModal
        visible={!!selectedTxForReceipt}
        onClose={() => setSelectedTxForReceipt(null)}
        transaction={selectedTxForReceipt}
      />
    </SafeAreaView>
  );
}
