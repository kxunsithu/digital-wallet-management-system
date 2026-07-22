import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import api from "@/lib/axiox";

export const useRealTimeBalance = (userId?: number | string, enabled: boolean = true) => {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);
  const prevBalanceRef = useRef<number | null>(null);

  const fetchBalance = useCallback(async () => {
    if (!userId || !enabled || !isMountedRef.current) {
      console.log("useRealTimeBalance: Skipping fetch - userId:", userId, "enabled:", enabled, "mounted:", isMountedRef.current);
      return;
    }

    try {
      setLoading(true);
      console.log("useRealTimeBalance: Fetching balance for userId:", userId);
      const response = await api.get(`/wallets?user_id=${userId}&per_page=1&include_admin=true`);
      console.log("useRealTimeBalance: API Response:", response.data);
      
      // Response structure: { success, data: { data: [wallets...], pagination info } }
      const wallets = response.data?.data?.data;
      console.log("useRealTimeBalance: Wallets array:", wallets);
      
      if (isMountedRef.current && wallets && wallets.length > 0) {
        const newBalance = parseFloat(wallets[0].balance);
        console.log("useRealTimeBalance: Setting balance to:", newBalance);
        
        if (prevBalanceRef.current !== null && newBalance > prevBalanceRef.current) {
          const diff = newBalance - prevBalanceRef.current;
          const formattedAmount = new Intl.NumberFormat("en-MM").format(diff);
          toast.success(`Money Received - +${formattedAmount} MMK`);
        }
        
        prevBalanceRef.current = newBalance;
        setBalance(newBalance);
        setError(null);
      }
    } catch (err: unknown) {
      if (isMountedRef.current) {
        const error = err as Record<string, unknown>;
        const message = (error?.response as Record<string, unknown>)?.data as Record<string, unknown> || {};
        setError((message.message as string) || "Failed to fetch balance");
        console.error("Balance fetch error:", err);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [userId, enabled]);

  // Manual refresh function
  const refreshBalance = useCallback(async () => {
    await fetchBalance();
  }, [fetchBalance]);

  // Initial fetch and setup polling
  useEffect(() => {
    if (!enabled || !userId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Fetch immediately in a separate microtask to avoid warnings
    Promise.resolve().then(() => {
      if (isMountedRef.current) {
        fetchBalance();
      }
    });

    // Set up polling every 2 seconds
    intervalRef.current = setInterval(() => {
      if (isMountedRef.current) {
        fetchBalance();
      }
    }, 2000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, userId, fetchBalance]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Start polling
  const startPolling = useCallback(() => {
    if (!intervalRef.current && enabled && userId) {
      Promise.resolve().then(() => {
        if (isMountedRef.current) {
          fetchBalance();
        }
      });
      
      intervalRef.current = setInterval(() => {
        if (isMountedRef.current) {
          fetchBalance();
        }
      }, 2000);
    }
  }, [fetchBalance, enabled, userId]);

  return {
    balance,
    loading,
    error,
    refreshBalance,
    stopPolling,
    startPolling,
  };
};
