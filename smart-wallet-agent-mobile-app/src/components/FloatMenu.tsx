// components/FloatMenu.tsx
import {
  Text,
  View,
  TouchableOpacity,
  Modal,
  Animated,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { useState, useEffect } from "react";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

interface FloatMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function FloatMenu({ isVisible, onClose }: FloatMenuProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.spring(animation, {
      toValue: isVisible ? 1 : 0,
      useNativeDriver: true,
      tension: 60,
      friction: 9,
    }).start();
  }, [isVisible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 200);
  };

  const translateY = animation.interpolate({ inputRange: [0, 1], outputRange: [300, 0] });
  const backdropOpacity = animation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  // ── Section config ──────────────────────────────────────────────────────────
  const customerActions = [
    {
      label: 'Phone Transfer',
      sub: 'Deposit via phone number',
      icon: 'phone-call' as const,
      color: '#D5E726',
      bg: isDark ? '#1C1F14' : '#F8FAF0',
      border: isDark ? '#2D3318' : '#E8F0C0',
      route: '/cash-in',
    },
    {
      label: 'Scan QR Code',
      sub: 'Scan customer QR to deposit',
      icon: 'camera' as const,
      color: '#D5E726',
      bg: isDark ? '#1C1F14' : '#F8FAF0',
      border: isDark ? '#2D3318' : '#E8F0C0',
      route: '/cash-in?scan=true',
    },
  ];

  const managerActions = [
    {
      label: 'Phone Transfer',
      sub: 'Return float via phone',
      icon: 'user-check' as const,
      color: '#10b981',
      bg: isDark ? '#14221B' : '#F0FDF4',
      border: isDark ? '#1A3328' : '#DCFCE7',
      route: '/cash-out',
    },
    {
      label: 'Scan QR Code',
      sub: 'Scan manager QR code',
      icon: 'camera' as const,
      color: '#10b981',
      bg: isDark ? '#14221B' : '#F0FDF4',
      border: isDark ? '#1A3328' : '#DCFCE7',
      route: '/cash-out?scan=true',
    },
  ];

  const utilityActions = [
    {
      label: 'My QR Code',
      sub: 'Share to receive',
      icon: 'grid' as const,
      color: '#8b5cf6',
      bg: isDark ? '#1A1628' : '#F5F3FF',
      border: isDark ? '#2D2455' : '#EDE9FE',
      route: '/qr-code',
    },
    {
      label: 'Transactions',
      sub: 'View history',
      icon: 'clock' as const,
      color: '#f59e0b',
      bg: isDark ? '#231A10' : '#FFFBEB',
      border: isDark ? '#3D2E14' : '#FEF3C7',
      route: '/(tabs)/transactions',
    },
  ];

  const SectionHeader = ({ label, color }: { label: string; color: string }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
      <View style={{ width: 4, height: 14, borderRadius: 2, backgroundColor: color, marginRight: 8 }} />
      <Text style={{
        fontSize: 10, fontWeight: '800', letterSpacing: 1,
        textTransform: 'uppercase',
        color: isDark ? '#6B7280' : '#9CA3AF',
      }}>
        {label}
      </Text>
    </View>
  );

  const ActionCard = ({ item }: { item: typeof customerActions[0] }) => (
    <TouchableOpacity
      onPress={() => handleNavigate(item.route)}
      activeOpacity={0.8}
      style={{
        flex: 1, padding: 16, borderRadius: 20,
        backgroundColor: item.bg,
        borderWidth: 1.5, borderColor: item.border,
      }}
    >
      <View style={{
        width: 40, height: 40, borderRadius: 12,
        backgroundColor: `${item.color}22`,
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 10,
      }}>
        <Feather name={item.icon} size={18} color={item.color} />
      </View>
      <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', marginBottom: 3 }}>
        {item.label}
      </Text>
      <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF', lineHeight: 14 }}>
        {item.sub}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal transparent visible={isVisible} animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        {/* ── Frosted / Blurred Backdrop ── */}
        <Animated.View
          style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            opacity: backdropOpacity,
          }}
        >
          {/* Dark overlay layer */}
          <View style={{
            flex: 1,
            backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(10,11,9,0.55)',
          }}>
            <Pressable style={{ flex: 1 }} onPress={onClose} />
          </View>
        </Animated.View>

        {/* ── Bottom Sheet Panel ── */}
        <Animated.View
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            // Frosted-glass card
            backgroundColor: isDark
              ? 'rgba(16,18,14,0.97)'
              : 'rgba(255,255,255,0.97)',
            borderTopWidth: 1,
            borderTopColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            // iOS shadow to give depth
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: isDark ? 0.5 : 0.12,
            shadowRadius: 24,
            elevation: 20,
            transform: [{ translateY }],
            paddingBottom: Platform.OS === 'ios' ? 36 : 24,
          }}
        >
          {/* ── Handle ── */}
          <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 6 }}>
            <View style={{
              width: 40, height: 4, borderRadius: 2,
              backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
            }} />
          </View>

          {/* ── Title row ── */}
          <View style={{
            paddingHorizontal: 24, paddingVertical: 14,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <View>
              <Text style={{
                fontSize: 20, fontWeight: '900', letterSpacing: -0.5,
                color: isDark ? '#FFFFFF' : '#0A0B09',
              }}>
                Actions
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                Select a transfer type
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Feather name="x" size={17} color={isDark ? '#FFFFFF' : '#0A0B09'} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 8 }}
          >
            {/* ── Customer Section ── */}
            <View style={{ marginBottom: 20 }}>
              <SectionHeader label="Customer Transfer (Cash In)" color="#D5E726" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {customerActions.map((a) => <ActionCard key={a.label} item={a} />)}
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={{
              height: 1, marginBottom: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }} />

            {/* ── Manager Section ── */}
            <View style={{ marginBottom: 20 }}>
              <SectionHeader label="Agent Manager Transfer (Float Return)" color="#10b981" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {managerActions.map((a) => <ActionCard key={a.label} item={a} />)}
              </View>
            </View>

            {/* ── Divider ── */}
            <View style={{
              height: 1, marginBottom: 20,
              backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
            }} />

            {/* ── Utilities ── */}
            <View style={{ marginBottom: 4 }}>
              <SectionHeader label="Wallet Tools" color="#8b5cf6" />
              <View style={{ flexDirection: 'row', gap: 12 }}>
                {utilityActions.map((a) => <ActionCard key={a.label} item={a} />)}
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}