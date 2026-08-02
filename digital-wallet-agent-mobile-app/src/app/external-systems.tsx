// app/external-systems.tsx
import { Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useState, useCallback } from "react";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "../providers/ThemeProvider";
import { Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import {
  getMyExternalSystems,
  generateExternalSystemKey,
  createExternalSystem,
  AgentExternalSystem,
} from "../services/externalSystems";

export default function ExternalSystemsScreen() {
  const router = useRouter();
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const [systems, setSystems] = useState<AgentExternalSystem[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [revealedKey, setRevealedKey] = useState<{ system: AgentExternalSystem; apiKey: string } | null>(null);

  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createLink, setCreateLink] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchSystems = useCallback(async () => {
    try {
      const data = await getMyExternalSystems();
      setSystems(data);
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Failed to load",
        text2: e instanceof Error ? e.message : "Unable to load external systems",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchSystems();
    }, [fetchSystems])
  );

  const handleGenerateKey = async (system: AgentExternalSystem) => {
    setGeneratingId(system.id);
    try {
      const result = await generateExternalSystemKey(system.id);
      setRevealedKey(result);
      await fetchSystems();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Generate Failed",
        text2: e instanceof Error ? e.message : "Failed to generate API key",
      });
    } finally {
      setGeneratingId(null);
    }
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      Toast.show({ type: "error", text1: "Error", text2: "System name is required" });
      return;
    }
    setCreating(true);
    try {
      await createExternalSystem(createName.trim(), createLink.trim() || undefined);
      Toast.show({ type: "success", text1: "Success", text2: "External system created" });
      setCreateName("");
      setCreateLink("");
      setCreateModalVisible(false);
      await fetchSystems();
    } catch (e) {
      Toast.show({
        type: "error",
        text1: "Create Failed",
        text2: e instanceof Error ? e.message : "Failed to create external system",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
        borderBottomWidth: 1, borderBottomColor: colors.border,
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.surface,
            alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: colors.border,
          }}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={20} color={colors.text} />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, letterSpacing: -0.3 }}>
          External Systems
        </Text>

        <TouchableOpacity
          onPress={() => setCreateModalVisible(true)}
          style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.primary,
            alignItems: "center", justifyContent: "center",
          }}
          activeOpacity={0.7}
        >
          <Feather name="plus" size={20} color={colors.background} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginBottom: 20 }}>
          Create external systems (e.g. your online store) to accept payments into your wallet,
          then generate an API key for each system. The key is shown only once — store it safely.
        </Text>

        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 48 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : systems.length === 0 ? (
          <View style={{
            alignItems: "center", paddingVertical: 48,
            borderRadius: 20, borderWidth: 1, borderColor: colors.border,
            backgroundColor: colors.surface,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: `${colors.primary}1A`,
              alignItems: "center", justifyContent: "center",
              marginBottom: 14,
            }}>
              <Feather name="link-2" size={24} color={colors.primary} />
            </View>
            <Text style={{ fontSize: 15, fontWeight: "700", color: colors.text }}>
              No external systems
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 6, textAlign: "center" }}>
              No systems are linked to your account yet.{"\n"}Ask the admin to link one.
            </Text>
          </View>
        ) : (
          systems.map((system) => {
            const hasKey = Boolean(system.api_key_prefix);
            return (
              <View
                key={system.id}
                style={{
                  padding: 18, borderRadius: 20, marginBottom: 14,
                  backgroundColor: colors.surface,
                  borderWidth: 1, borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontSize: 15, fontWeight: "800", color: colors.text }}>
                      {system.name}
                    </Text>
                    {system.system_link ? (
                      <Text style={{ fontSize: 12, color: colors.textSecondary, marginTop: 4 }} numberOfLines={1}>
                        {system.system_link}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{
                    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
                    backgroundColor: system.status === "active" ? `${colors.success}1A` : `${colors.error}1A`,
                  }}>
                    <Text style={{
                      fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5,
                      color: system.status === "active" ? colors.success : colors.error,
                    }}>
                      {system.status}
                    </Text>
                  </View>
                </View>

                <View style={{
                  marginTop: 14, padding: 12, borderRadius: 14,
                  backgroundColor: isDark ? colors.background : `${colors.border}22`,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 6 }}>
                    API Key
                  </Text>
                  {hasKey ? (
                    <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text }} numberOfLines={1}>
                      {system.api_key_prefix}••••••••••
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 13, color: colors.textSecondary }}>
                      Not generated yet
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => handleGenerateKey(system)}
                  disabled={generatingId !== null || system.status !== "active"}
                  activeOpacity={0.85}
                  style={{ marginTop: 14, opacity: generatingId !== null || system.status !== "active" ? 0.6 : 1 }}
                >
                  <LinearGradient
                    colors={[colors.primary, `${colors.primary}CC`]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 13, borderRadius: 14, alignItems: "center", justifyContent: "center" }}
                  >
                    {generatingId === system.id ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.background }}>
                        {hasKey ? "Regenerate API Key" : "Generate API Key"}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Create External System Modal */}
      <Modal visible={createModalVisible} animationType="slide" transparent onRequestClose={() => setCreateModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View style={{
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              padding: 28, paddingBottom: 40,
              backgroundColor: colors.surface,
              borderTopWidth: 1, borderTopColor: colors.border,
            }}>
              <View style={{ alignItems: "center", marginBottom: 20 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                  Add External System
                </Text>
                <TouchableOpacity onPress={() => setCreateModalVisible(false)} activeOpacity={0.7}>
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: isDark ? colors.background : `${colors.border}33`,
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Feather name="x" size={18} color={colors.text} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ marginBottom: 18 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  System Name
                </Text>
                <TextInput
                  placeholder="e.g. ShopKart Online Store"
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    padding: 14, borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : `${colors.border}22`,
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                  value={createName}
                  onChangeText={setCreateName}
                />
              </View>

              <View style={{ marginBottom: 24 }}>
                <Text style={{ fontSize: 11, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 }}>
                  System Link (Optional)
                </Text>
                <TextInput
                  placeholder="https://your-shop.com"
                  placeholderTextColor={colors.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={{
                    padding: 14, borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: colors.border,
                    backgroundColor: isDark ? colors.background : `${colors.border}22`,
                    fontSize: 15,
                    fontWeight: "600",
                    color: colors.text,
                  }}
                  value={createLink}
                  onChangeText={setCreateLink}
                />
              </View>

              <TouchableOpacity
                onPress={handleCreate}
                disabled={creating}
                activeOpacity={0.85}
                style={{ opacity: creating ? 0.7 : 1 }}
              >
                <LinearGradient
                  colors={[colors.primary, `${colors.primary}CC`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 15, borderRadius: 16, alignItems: "center", justifyContent: "center" }}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color={colors.background} />
                  ) : (
                    <Text style={{ fontSize: 15, fontWeight: "700", color: colors.background }}>Create System</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* API Key Reveal Modal */}
      <Modal visible={revealedKey !== null} animationType="slide" transparent onRequestClose={() => setRevealedKey(null)}>
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
          <View style={{
            borderTopLeftRadius: 28, borderTopRightRadius: 28,
            padding: 28, paddingBottom: 40,
            backgroundColor: colors.surface,
            borderTopWidth: 1, borderTopColor: colors.border,
          }}>
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text, marginBottom: 8 }}>
              API Key Generated
            </Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
              Store this key now for {revealedKey?.system.name}. It is stored only as a hash and will not be shown again. Long-press the key to copy it.
            </Text>

            <View style={{
              padding: 14, borderRadius: 14,
              backgroundColor: isDark ? colors.background : `${colors.border}22`,
              marginBottom: 20,
            }}>
              <Text style={{ fontSize: 13, fontWeight: "600", color: colors.text, lineHeight: 20 }} selectable>
                {revealedKey?.apiKey}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => setRevealedKey(null)}
              style={{ paddingVertical: 12, borderRadius: 16, alignItems: "center", backgroundColor: colors.border }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: colors.textSecondary }}>I've stored the key</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
