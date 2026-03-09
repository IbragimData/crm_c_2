"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getTokensByAffiliatorId } from "../api";
import { Token } from "../types";

export function useGetTokensByAffiliatorId(id: string) {
  const router = useRouter();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(() => {
    if (!id) return;
    setLoading(true);
    getTokensByAffiliatorId(id)
      .then(setTokens)
      .catch(() => router.replace("/404"))
      .finally(() => setLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (!id) return;
    getTokensByAffiliatorId(id)
      .then(setTokens)
      .catch(() => router.replace("/404"))
      .finally(() => setLoading(false));
  }, [id, router]);

  return { tokens, loading, refetch };
}