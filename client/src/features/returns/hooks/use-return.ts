"use client";

import { useQuery } from "@tanstack/react-query";
import type { SingleReturnResponse } from "../types/return.types";
import { fetchReturnById } from "../services/returns.service";
import { returnQueryKeys } from "./use-returns";

export function useReturn(id: string, initialData?: SingleReturnResponse) {
  return useQuery({
    queryKey: returnQueryKeys.detail(id),
    queryFn: () => fetchReturnById(id),
    initialData,
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}
