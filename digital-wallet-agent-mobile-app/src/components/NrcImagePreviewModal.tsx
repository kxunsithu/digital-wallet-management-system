// components/NrcImagePreviewModal.tsx
import { Dimensions, Image, Modal, Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "../providers/ThemeProvider";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

function clamp(value: number, min: number, max: number) {
  "worklet";
  return Math.min(Math.max(value, min), max);
}

interface NrcImagePreviewModalProps {
  visible: boolean;
  uri: string | null;
  label: string;
  onClose: () => void;
}

export default function NrcImagePreviewModal({ visible, uri, label, onClose }: NrcImagePreviewModalProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const scale = useSharedValue(MIN_SCALE);
  const savedScale = useSharedValue(MIN_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= MIN_SCALE) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .maxPointers(1)
    .onUpdate((e) => {
      if (scale.value <= MIN_SCALE) return;
      const maxX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const maxY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;
      translateX.value = clamp(savedTranslateX.value + e.translationX, -maxX, maxX);
      translateY.value = clamp(savedTranslateY.value + e.translationY, -maxY, maxY);
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedScale.value = MIN_SCALE;
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      } else {
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        savedScale.value = DOUBLE_TAP_SCALE;
      }
    });

  const composed = Gesture.Race(doubleTap, Gesture.Simultaneous(pinch, pan));

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: "#000000E6" }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingTop: insets.top + 10,
            paddingHorizontal: 16,
            paddingBottom: 10,
            borderBottomWidth: 0.5,
            borderBottomColor: "rgba(255,255,255,0.15)",
          }}
        >
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: `${colors.primary}1F`, alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Feather name="credit-card" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>NRC Document</Text>
              <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{label} side</Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            style={({ pressed }) => ({
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(255,255,255,0.12)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <GestureDetector gesture={composed}>
          <Animated.View style={[{ flex: 1 }, animatedStyle]}>
            <Image
              source={{ uri: uri ?? undefined }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>

        <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: insets.bottom + 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
            <Feather name="maximize" size={12} color="rgba(255,255,255,0.7)" />
            <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginLeft: 6 }}>
              Pinch or double-tap to zoom
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}
