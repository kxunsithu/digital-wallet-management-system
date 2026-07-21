// components/FloatMenu.tsx
import { 
  Text, 
  View, 
  TouchableOpacity, 
  Modal,
  Animated,
  Pressable,
  ScrollView,
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
  const [scale] = useState(new Animated.Value(0.9));

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(animation, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
        Animated.spring(scale, {
          toValue: 0.9,
          useNativeDriver: true,
          tension: 65,
          friction: 8,
        }),
      ]).start();
    }
  }, [isVisible]);

  const handleNavigate = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 250);
  };

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [120, 0],
  });

  const backdropOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.65],
  });

  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View 
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: '#000000',
            opacity: backdropOpacity,
          }}
        >
          <Pressable style={{ flex: 1 }} onPress={onClose} />
        </Animated.View>

        {/* Bottom Sheet Modal */}
        <Animated.View
          style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            borderTopLeftRadius: 32, borderTopRightRadius: 32,
            backgroundColor: isDark ? '#141612' : '#FFFFFF',
            borderTopWidth: 1,
            borderTopColor: isDark ? '#2F332B' : '#E2E8F0',
            paddingTop: 12,
            paddingBottom: 24,
            maxHeight: '85%',
            transform: [{ translateY }, { scale }],
          }}
        >
          {/* Handle Bar */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={{ width: 44, height: 4.5, borderRadius: 3, backgroundColor: isDark ? '#2F332B' : '#E2E8F0' }} />
          </View>

          {/* Modal Header */}
          <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 20, fontWeight: '800', color: isDark ? '#FFFFFF' : '#0A0B09', letterSpacing: -0.4 }}>
                Money Transfer & Actions
              </Text>
              <Text style={{ fontSize: 12, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 2 }}>
                Select transfer recipient type
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 36, height: 36, borderRadius: 18,
                backgroundColor: isDark ? '#1F221B' : '#F1F5F9',
                alignItems: 'center', justifyContent: 'center',
              }}
              activeOpacity={0.7}
            >
              <Feather name="x" size={18} color={isDark ? '#FFFFFF' : '#0A0B09'} />
            </TouchableOpacity>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            {/* ── SECTION 1: CUSTOMER TRANSFERS ── */}
            <View style={{ marginTop: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 6, height: 14, borderRadius: 3, backgroundColor: '#D5E726', marginRight: 8 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Customer Money Transfer (Cash In)
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Customer Phone Transfer */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/cash-in')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 16, borderRadius: 20,
                    backgroundColor: isDark ? '#1C1F18' : '#F8FAF5',
                    borderWidth: 1.5, borderColor: isDark ? '#2F3624' : '#E6F0C2',
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: 'rgba(213,231,38,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Feather name="phone-call" size={20} color="#D5E726" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                    Phone Transfer
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>
                    Deposit via customer phone number
                  </Text>
                </TouchableOpacity>

                {/* Customer QR Scan Transfer */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/cash-in?scan=true')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 16, borderRadius: 20,
                    backgroundColor: isDark ? '#1C1F18' : '#F8FAF5',
                    borderWidth: 1.5, borderColor: isDark ? '#2F3624' : '#E6F0C2',
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: 'rgba(213,231,38,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <MaterialCommunityIcons name="qrcode-scan" size={22} color="#D5E726" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                    Scan QR
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>
                    Scan customer QR code to cash in
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── SECTION 2: AGENT MANAGER TRANSFERS ── */}
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ width: 6, height: 14, borderRadius: 3, backgroundColor: '#10b981', marginRight: 8 }} />
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Agent Manager Transfer (Return Float)
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                {/* Manager Phone Transfer */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/cash-out')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 16, borderRadius: 20,
                    backgroundColor: isDark ? '#18241D' : '#F0FDF4',
                    borderWidth: 1.5, borderColor: isDark ? '#224230' : '#DCFCE7',
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: 'rgba(16,185,129,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <Feather name="user-check" size={20} color="#10b981" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                    Phone Transfer
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>
                    Return float via manager phone
                  </Text>
                </TouchableOpacity>

                {/* Manager QR Scan Transfer */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/cash-out?scan=true')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 16, borderRadius: 20,
                    backgroundColor: isDark ? '#18241D' : '#F0FDF4',
                    borderWidth: 1.5, borderColor: isDark ? '#224230' : '#DCFCE7',
                  }}
                >
                  <View style={{
                    width: 44, height: 44, borderRadius: 14,
                    backgroundColor: 'rgba(16,185,129,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    marginBottom: 12,
                  }}>
                    <MaterialCommunityIcons name="qrcode-scan" size={22} color="#10b981" />
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>
                    Scan QR
                  </Text>
                  <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', marginTop: 3 }}>
                    Scan agent manager QR code
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* ── SECTION 3: OTHER UTILITIES ── */}
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#6B7280' : '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>
                My Wallet Tools
              </Text>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* My QR Code */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/qr-code')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 14, borderRadius: 16,
                    backgroundColor: isDark ? '#1E1B2E' : '#F5F3FF',
                    borderWidth: 1, borderColor: isDark ? '#382D5C' : '#DDD6FE',
                    flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: 'rgba(139,92,246,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 10,
                  }}>
                    <Feather name="grid" size={18} color="#8b5cf6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>My QR</Text>
                    <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF' }}>Receive</Text>
                  </View>
                </TouchableOpacity>

                {/* History */}
                <TouchableOpacity
                  onPress={() => handleNavigate('/(tabs)/transactions')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1, padding: 14, borderRadius: 16,
                    backgroundColor: isDark ? '#261F17' : '#FFFBEB',
                    borderWidth: 1, borderColor: isDark ? '#4A3B22' : '#FDE68A',
                    flexDirection: 'row', alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 12,
                    backgroundColor: 'rgba(245,158,11,0.2)',
                    alignItems: 'center', justifyContent: 'center',
                    marginRight: 10,
                  }}>
                    <Feather name="clock" size={18} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#FFFFFF' : '#0A0B09' }}>History</Text>
                    <Text style={{ fontSize: 10, color: isDark ? '#6B7280' : '#9CA3AF' }}>Logs</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}