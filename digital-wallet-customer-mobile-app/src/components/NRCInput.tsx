import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  Pressable,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import {
  nrcData,
  nrcTypes,
  NrcParts,
  parseNrc,
  formatNrc,
  keepMyanmarDigits,
} from "../constants/nrcData";

interface NRCInputProps {
  value?: string;
  onChange: (formattedNrc: string) => void;
  label?: string;
  required?: boolean;
}

export function NRCInput({ value, onChange, label = "NRC Information", required = true }: NRCInputProps) {
  const { theme, colors } = useTheme();
  const isDark = theme === "dark";

  const [parts, setParts] = useState<NrcParts>(() => parseNrc(value));

  // Modal selector states
  const [pickerModal, setPickerModal] = useState<"state" | "township" | "type" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const townships = useMemo(
    () => nrcData.find((state) => state.stateCode === parts.stateCode)?.townships ?? [],
    [parts.stateCode]
  );

  useEffect(() => {
    const parsed = parseNrc(value);
    if (formatNrc(parsed) !== formatNrc(parts) && value !== formatNrc(parts)) {
      setParts(parsed);
    }
  }, [value]);

  const updateParts = (updates: Partial<NrcParts>) => {
    setParts((current) => {
      const next = { ...current, ...updates };
      onChange(formatNrc(next));
      return next;
    });
  };

  const formattedPreview = formatNrc(parts);

  // Filtered options for picker modal
  const pickerOptions = useMemo(() => {
    if (pickerModal === "state") {
      return nrcData
        .map((s) => ({ value: s.stateCode, label: `State ${s.stateCode} (${s.stateCode})` }))
        .filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()) || opt.value.includes(searchQuery));
    }
    if (pickerModal === "township") {
      return townships
        .map((t) => ({ value: t.code, label: `${t.code} - ${t.name}` }))
        .filter((opt) => opt.label.includes(searchQuery) || opt.value.includes(searchQuery));
    }
    if (pickerModal === "type") {
      return nrcTypes.map((t) => ({ value: t.value, label: t.label }));
    }
    return [];
  }, [pickerModal, townships, searchQuery]);

  return (
    <View
      style={{
        padding: 16,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: isDark ? colors.background : `${colors.border}15`,
        marginBottom: 16,
      }}
    >
      {/* Label and Live Preview Chip */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.text }}>
          {label} {required && <Text style={{ color: colors.error }}>*</Text>}
        </Text>
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: `${colors.primary}20`,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.primary }}>
            {formattedPreview || "State/Township(Type)123456"}
          </Text>
        </View>
      </View>

      {/* Selectors Grid */}
      <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
        {/* State Code Selector */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", marginBottom: 4 }}>
            State
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setPickerModal("state");
            }}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: parts.stateCode ? colors.text : colors.textSecondary }}>
              {parts.stateCode ? `${parts.stateCode}/` : "State"}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Township Code Selector */}
        <View style={{ flex: 1.2 }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", marginBottom: 4 }}>
            Township
          </Text>
          <TouchableOpacity
            disabled={!parts.stateCode}
            onPress={() => {
              setSearchQuery("");
              setPickerModal("township");
            }}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: parts.stateCode ? colors.surface : `${colors.border}33`,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              opacity: parts.stateCode ? 1 : 0.5,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: parts.townshipCode ? colors.text : colors.textSecondary }} numberOfLines={1}>
              {parts.townshipCode || "Township"}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Type Selector */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", marginBottom: 4 }}>
            Type
          </Text>
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setPickerModal("type");
            }}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 12,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: parts.type ? colors.text : colors.textSecondary }}>
              {parts.type ? `(${parts.type})` : "Type"}
            </Text>
            <Feather name="chevron-down" size={14} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 6-Digit Number Input */}
      <View>
        <Text style={{ fontSize: 10, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", marginBottom: 4 }}>
          NRC Number (6 Digits)
        </Text>
        <TextInput
          value={parts.number}
          onChangeText={(val) => updateParts({ number: keepMyanmarDigits(val) })}
          placeholder="123456"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          maxLength={6}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            fontSize: 15,
            fontWeight: "700",
            color: colors.text,
            letterSpacing: 2,
          }}
        />
      </View>

      {/* Selection Modal */}
      <Modal
        visible={pickerModal !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPickerModal(null)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Pressable style={{ flex: 1 }} onPress={() => setPickerModal(null)} />
          <View
            style={{
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              maxHeight: "70%",
              padding: 20,
              paddingBottom: 34,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 12 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <Text style={{ fontSize: 16, fontWeight: "800", color: colors.text }}>
                {pickerModal === "state"
                  ? "Select State Code"
                  : pickerModal === "township"
                  ? "Select Township Code"
                  : "Select NRC Type"}
              </Text>
              <TouchableOpacity onPress={() => setPickerModal(null)} activeOpacity={0.7}>
                <Feather name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input for State or Township */}
            {pickerModal !== "type" && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: isDark ? colors.background : `${colors.border}22`,
                  marginBottom: 12,
                }}
              >
                <Feather name="search" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search..."
                  placeholderTextColor={colors.textSecondary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ flex: 1, paddingVertical: 10, fontSize: 14, color: colors.text }}
                />
              </View>
            )}

            <FlatList
              data={pickerOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const isSelected =
                  (pickerModal === "state" && parts.stateCode === item.value) ||
                  (pickerModal === "township" && parts.townshipCode === item.value) ||
                  (pickerModal === "type" && parts.type === item.value);

                return (
                  <TouchableOpacity
                    onPress={() => {
                      if (pickerModal === "state") {
                        updateParts({ stateCode: item.value, townshipCode: "" });
                      } else if (pickerModal === "township") {
                        updateParts({ townshipCode: item.value });
                      } else if (pickerModal === "type") {
                        updateParts({ type: item.value });
                      }
                      setPickerModal(null);
                    }}
                    activeOpacity={0.7}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 16,
                      borderRadius: 12,
                      marginBottom: 6,
                      backgroundColor: isSelected ? `${colors.primary}18` : "transparent",
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
                      {item.label}
                    </Text>
                    {isSelected && <Feather name="check" size={18} color={colors.primary} />}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ paddingVertical: 24, alignItems: "center" }}>
                  <Text style={{ fontSize: 13, color: colors.textSecondary }}>No results found</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default NRCInput;
