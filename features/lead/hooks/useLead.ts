"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLeadById } from "../api";
import { Lead } from "../types";

export type LeadPageError = "forbidden" | "not_found" | null;

export function useLead(id: string) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<LeadPageError>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setError(null);
    setLead(null);
    setLoading(true);

    getLeadById(id)
      .then((le) => {
        if (cancelled) return;
        setLead(le);
        setError(null);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const status = err && typeof err === "object" && "response" in err
          ? (err as { response?: { status?: number } }).response?.status
          : undefined;
        if (status === 403) {
          setError("forbidden");
          setLead(null);
        } else {
          router.replace("/404");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, router]);

  return { lead, loading, error };
}