// components/FloatMenuButton.tsx
import { TouchableOpacity, View, Text, Animated } from "react-native";
import { useState, useRef } from "react";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../providers/ThemeProvider";
import { LinearGradient } from 'expo-linear-gradient';

interface FloatMenuButtonProps {
  onPress: () => void;
}

export default function FloatMenuButton({ onPress }: FloatMenuButtonProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isPressed, setIsPressed] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    setIsPressed(true);
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  const handlePressOut = () => {
    setIsPressed(false);
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
    }).start();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      className="absolute bottom-8 right-6 z-50"
    >
      <Animated.View
        style={{
          transform: [{ scale: scaleAnim }],
          shadowColor: '#D5E726',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.4,
          shadowRadius: 20,
          elevation: 10,
        }}
      >
        <LinearGradient
          colors={['#D5E726', '#B8C920']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-16 h-16 rounded-full items-center justify-center"
        >
          <View className="relative">
            <Feather name="plus" size={28} color="#000" />
            {/* Rotating plus icon indicator */}
            {isPressed && (
              <View className="absolute -inset-1">
                <View className="w-full h-full items-center justify-center">
                  <Feather name="plus" size={28} color="#000" />
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}