import { useQuery } from "@tanstack/react-query";
import { gameDataApi } from "../api/endpoints";
import type { GameDataBundle } from "../types";

export function useGameData() {
  const query = useQuery({
    queryKey: ["game-data"],
    queryFn: async () => {
      const res = await gameDataApi.all();
      return res.data.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
  return {
    data: query.data as GameDataBundle | undefined,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
