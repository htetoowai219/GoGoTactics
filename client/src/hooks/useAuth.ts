import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/endpoints";
import { useAuthStore } from "../stores/authStore";

export function useInitAuth() {
  const { setUser, initialized, setInitialized } = useAuthStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        const res = await authApi.me();
        return res.data.data.user;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess) {
      setUser(query.data ?? null);
      setInitialized();
    }
  }, [query.isSuccess, query.data, setUser, setInitialized]);

  return { user: query.data ?? null, isLoading: !initialized };
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useRefreshUser() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["me"] });
}
