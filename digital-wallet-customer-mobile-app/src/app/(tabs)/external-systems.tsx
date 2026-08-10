// app/(tabs)/external-systems.tsx
import {
  Text,
  View,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../providers/ThemeProvider";
import { useLanguage } from "../../providers/LanguageProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { ActiveExternalSystem, getActiveExternalSystems } from "../../services/externalSystems";
import { resolveUrl } from "../../lib/utils";

export default function ExternalSystemsScreen() {
  const { theme, colors } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  const [systems, setSystems] = useState<ActiveExternalSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [imageErrorMap, setImageErrorMap] = useState<Record<number, boolean>>({});

  const fetchSystems = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    try {
      const data = await getActiveExternalSystems();
      setSystems(data);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: e instanceof Error ? e.message : "Failed to load external systems",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSystems();
  }, [fetchSystems]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSystems(true);
  };

  const filteredSystems = systems.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = s.name.toLowerCase().includes(q);
    const linkMatch = s.system_link?.toLowerCase().includes(q);
    const ownerMatch = s.user?.full_name?.toLowerCase().includes(q);
    return nameMatch || linkMatch || ownerMatch;
  });

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Toast.show({
        type: "error",
        text1: t("common.error"),
        text2: "Unable to open link",
      });
    });
  };

  const renderItem = ({ item }: { item: ActiveExternalSystem }) => {
    const logoUrl = resolveUrl(item.system_logo_url);
    const hasLogo = Boolean(logoUrl) && !imageErrorMap[item.id];

    return (
      <View
        style={{
          marginBottom: 12,
          borderRadius: 20,
          padding: 16,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: colors.secondary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0 : 0.04,
          shadowRadius: 6,
          elevation: 1,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {/* Logo */}
          {hasLogo ? (
            <Image
              source={{ uri: logoUrl! }}
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                marginRight: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: isDark ? colors.background : "#F8FAFC",
              }}
              resizeMode="cover"
              onError={() => setImageErrorMap((prev) => ({ ...prev, [item.id]: true }))}
            />
          ) : (
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                marginRight: 14,
                backgroundColor: `${colors.primary}18`,
                borderWidth: 1,
                borderColor: `${colors.primary}33`,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="grid" size={24} color={colors.primary} />
            </View>
          )}

          {/* Info */}
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                {item.name}
              </Text>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: `${colors.success}1A`,
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    color: colors.success,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {item.status}
                </Text>
              </View>
            </View>

            {item.user?.full_name ? (
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 2 }} numberOfLines={1}>
                Merchant: {item.user.full_name}
              </Text>
            ) : null}

            {item.system_link ? (
              <TouchableOpacity
                onPress={() => openLink(item.system_link!)}
                activeOpacity={0.7}
                style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}
              >
                <Feather name="external-link" size={13} color={colors.primary} style={{ marginRight: 4 }} />
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.primary,
                    fontWeight: "600",
                    textDecorationLine: "underline",
                  }}
                  numberOfLines={1}
                >
                  {item.system_link}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontSize: 28, fontWeight: "900", color: colors.text, letterSpacing: -1 }}>
              Partner Services
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 3 }}>
              Browse integrated external systems & online stores
            </Text>
          </View>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${colors.primary}18`,
              borderWidth: 1,
              borderColor: `${colors.primary}30`,
            }}
          >
            <Feather name="grid" size={20} color={colors.primary} />
          </View>
        </View>

        {/* Search bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 16,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: isFocused ? colors.primary : colors.border,
            backgroundColor: colors.surface,
            paddingHorizontal: 14,
          }}
        >
          <Feather name="search" size={16} color={colors.textSecondary} />
          <TextInput
            placeholder="Search systems or merchants..."
            placeholderTextColor={colors.textSecondary}
            style={{
              flex: 1,
              paddingVertical: 12,
              paddingLeft: 10,
              fontSize: 14,
              color: colors.text,
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
              <Feather name="x-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Systems List */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredSystems}
          keyExtractor={(item) => `sys-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120, paddingTop: 4 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} colors={[colors.primary]} />
          }
          ListEmptyComponent={
            <View
              style={{
                paddingVertical: 56,
                borderRadius: 24,
                alignItems: "center",
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: isDark ? colors.background : `${colors.border}33`,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Feather name="grid" size={30} color={colors.border} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.textSecondary }}>
                No external systems found
              </Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6 }}>
                Active integrations will appear here
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
