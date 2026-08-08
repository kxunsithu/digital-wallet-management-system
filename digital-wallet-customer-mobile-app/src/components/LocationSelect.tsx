import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { locationData } from "../constants/locationData";

interface LocationSelectProps {
  stateRegion: string;
  township: string;
  onStateRegionChange: (value: string) => void;
  onTownshipChange: (value: string) => void;
  stateRegionLabel?: string;
  townshipLabel?: string;
  stateRegionPlaceholder?: string;
  townshipPlaceholder?: string;
}

export function LocationSelect({
  stateRegion,
  township,
  onStateRegionChange,
  onTownshipChange,
  stateRegionLabel = "State / Region",
  townshipLabel = "Township",
  stateRegionPlaceholder = "Select state / region",
  townshipPlaceholder = "Select township",
}: LocationSelectProps) {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const [activeModal, setActiveModal] = useState<"state" | "township" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const availableTownships = useMemo(
    () => locationData.find((state) => state.name === stateRegion)?.townships ?? [],
    [stateRegion]
  );

  const filteredStates = useMemo(() => {
    if (!searchQuery.trim()) return locationData;
    const q = searchQuery.toLowerCase();
    return locationData.filter((state) => state.name.toLowerCase().includes(q));
  }, [searchQuery]);

  const filteredTownships = useMemo(() => {
    if (!searchQuery.trim()) return availableTownships;
    const q = searchQuery.toLowerCase();
    return availableTownships.filter((t) => t.toLowerCase().includes(q));
  }, [searchQuery, availableTownships]);

  const handleSelectState = (stateName: string) => {
    onStateRegionChange(stateName);
    const newTownships = locationData.find((s) => s.name === stateName)?.townships ?? [];
    if (!newTownships.includes(township)) {
      onTownshipChange("");
    }
    setActiveModal(null);
  };

  const handleSelectTownship = (townshipName: string) => {
    onTownshipChange(townshipName);
    setActiveModal(null);
  };

  return (
    <View style={{ marginBottom: 16 }}>
      {/* State / Region Selector */}
      <View style={{ marginBottom: 14 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
          }}
        >
          {stateRegionLabel}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setSearchQuery("");
            setActiveModal("state");
          }}
          activeOpacity={0.75}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: isDark ? colors.background : `${colors.border}22`,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: stateRegion ? colors.text : colors.textSecondary,
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {stateRegion || stateRegionPlaceholder}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Township Selector */}
      <View style={{ marginBottom: 8 }}>
        <Text
          style={{
            fontSize: 11,
            fontWeight: "600",
            color: colors.textSecondary,
            textTransform: "uppercase",
            letterSpacing: 0.8,
            marginBottom: 8,
          }}
        >
          {townshipLabel}
        </Text>
        <TouchableOpacity
          disabled={!stateRegion}
          onPress={() => {
            setSearchQuery("");
            setActiveModal("township");
          }}
          activeOpacity={0.75}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 14,
            borderRadius: 14,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: !stateRegion
              ? isDark
                ? `${colors.border}15`
                : `${colors.border}11`
              : isDark
              ? colors.background
              : `${colors.border}22`,
            opacity: !stateRegion ? 0.55 : 1,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: "600",
              color: township ? colors.text : colors.textSecondary,
              flex: 1,
              marginRight: 8,
            }}
            numberOfLines={1}
          >
            {township || (stateRegion ? townshipPlaceholder : "Select state / region first")}
          </Text>
          <Feather name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Selection Modal */}
      <Modal
        visible={activeModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModal(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.65)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setActiveModal(null)} />
          <View
            style={{
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              maxHeight: "75%",
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "800", color: colors.text }}>
                {activeModal === "state" ? "Select State / Region" : "Select Township"}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} activeOpacity={0.7}>
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 17,
                    backgroundColor: isDark ? colors.background : `${colors.border}33`,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather name="x" size={18} color={colors.text} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: colors.border,
                backgroundColor: isDark ? colors.background : `${colors.border}22`,
                marginBottom: 16,
              }}
            >
              <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 10 }} />
              <TextInput
                placeholder={activeModal === "state" ? "Search state or region..." : "Search township..."}
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{ flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text }}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} activeOpacity={0.7}>
                  <Feather name="x-circle" size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Options List */}
            {activeModal === "state" ? (
              <FlatList
                data={filteredStates}
                keyExtractor={(item) => item.name}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = stateRegion === item.name;
                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectState(item.name)}
                      activeOpacity={0.7}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        marginBottom: 6,
                        backgroundColor: isSelected ? `${colors.primary}1A` : "transparent",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? colors.primary : colors.text,
                        }}
                      >
                        {item.name}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 32, alignItems: "center" }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>No state/region found</Text>
                  </View>
                }
              />
            ) : (
              <FlatList
                data={filteredTownships}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => {
                  const isSelected = township === item;
                  return (
                    <TouchableOpacity
                      onPress={() => handleSelectTownship(item)}
                      activeOpacity={0.7}
                      style={{
                        paddingVertical: 14,
                        paddingHorizontal: 16,
                        borderRadius: 14,
                        marginBottom: 6,
                        backgroundColor: isSelected ? `${colors.primary}1A` : "transparent",
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: isSelected ? "700" : "500",
                          color: isSelected ? colors.primary : colors.text,
                        }}
                      >
                        {item}
                      </Text>
                      {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ paddingVertical: 32, alignItems: "center" }}>
                    <Text style={{ fontSize: 14, color: colors.textSecondary }}>No township found</Text>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default LocationSelect;
