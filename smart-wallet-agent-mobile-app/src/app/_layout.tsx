// app/_layout.tsx
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
import { getPendingAuthRoute, clearPendingAuthRoute, isAuthenticated, AUTH_TOKEN_KEY } from '../services/auth';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      try {
        // Check if user is authenticated
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
        
        if (token) {
          // User has token, clear any pending auth routes
          await clearPendingAuthRoute();
          if (mounted) {
            router.replace('/');
          }
        } else {
          // No token, check for pending auth route
          const pending = await getPendingAuthRoute();
          
          if (pending?.path) {
            // Check if the pending route has expired
            const pendingExpiresAt = pending.expiresAt || pending.params?.expiresAt;
            if (pendingExpiresAt && new Date(pendingExpiresAt) <= new Date()) {
              await clearPendingAuthRoute();
              if (mounted) {
                Toast.show({
                  type: 'info',
                  text1: 'Session expired',
                  text2: 'Your previous auth step has expired. Please log in again.',
                });
                router.replace('/auth');
              }
            } else if (mounted) {
              // Navigate to the pending route
              router.replace({ 
                pathname: pending.path, 
                params: pending.params 
              });
            }
          } else if (mounted) {
            // No pending route, go to auth
            router.replace('/auth');
          }
        }
      } catch (error) {
        // Silent fail - go to auth
        if (mounted) {
          router.replace('/auth');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeApp();

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#D5E726" />
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