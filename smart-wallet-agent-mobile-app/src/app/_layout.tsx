import { Stack } from "expo-router";
import "../../global.css";
import { useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider } from '../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import CustomToast from '../components/CustomToast';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async function checkToken() {
      try {
        const token = await SecureStore.getItemAsync("authToken");
        if (mounted && !token) {
          router.replace('/auth');
        }
      } catch (e) {
        // ignore and continue to app
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#60a5fa" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <>
        <Stack screenOptions={{ headerShown: false }} />
        <Toast
          config={{
            success: (props: any) => <CustomToast {...props} />,
            error: (props: any) => <CustomToast {...props} />,
            info: (props: any) => <CustomToast {...props} />,
          }}
        />
      </>
    </ThemeProvider>
  );
}