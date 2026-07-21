// app/_layout.tsx
import { Stack, useRouter } from "expo-router";
import "../../global.css";
import { useEffect, useState, useRef } from "react";
import * as SecureStore from "expo-secure-store";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider } from '../providers/ThemeProvider';
import Toast from 'react-native-toast-message';
import CustomToast from '../components/CustomToast';
import { getPendingAuthRoute, clearPendingAuthRoute, AUTH_TOKEN_KEY } from '../services/auth';

export default function RootLayout() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const initializedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function initializeApp() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      try {
        const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);

        if (token) {
          await clearPendingAuthRoute();
          if (mounted) {
            router.replace('/(tabs)');
          }
        } else {
          const pending = await getPendingAuthRoute();

          if (pending?.path) {
            // Null expiresAt means persistent (never expires)
            const pendingExpiresAt = pending.expiresAt ?? pending.params?.expiresAt ?? null;

            if (pendingExpiresAt && new Date(pendingExpiresAt) <= new Date()) {
              // Expired OTP session
              await clearPendingAuthRoute();
              if (mounted) {
                Toast.show({
                  type: 'info',
                  text1: 'Session Expired',
                  text2: 'Please request a new OTP.',
                });
                router.replace('/auth');
              }
            } else if (mounted) {
              // Valid pending route (e.g. /auth/create-pin or /auth/verify-pin)
              router.replace({
                pathname: pending.path,
                params: pending.params,
              });
            }
          } else if (mounted) {
            router.replace('/auth');
          }
        }
      } catch (error) {
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

  return (
    <ThemeProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }} />
        {loading && (
          <View 
            style={{
              position: 'absolute', inset: 0,
              backgroundColor: '#0A0B09',
              alignItems: 'center', justifyContent: 'center',
              zIndex: 999,
            }}
          >
            <ActivityIndicator size="large" color="#D5E726" />
          </View>
        )}
        <Toast
          config={{
            success: (props: any) => <CustomToast {...props} />,
            error: (props: any) => <CustomToast {...props} />,
            info: (props: any) => <CustomToast {...props} />,
          }}
        />
      </View>
    </ThemeProvider>
  );
}