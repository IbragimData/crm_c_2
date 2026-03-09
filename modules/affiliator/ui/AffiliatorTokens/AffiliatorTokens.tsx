"use client";

import { ButtonComponentDefault } from "@/components";
import s from "./AffiliatorTokens.module.scss";
import iconCopy from "../../assets/dark.svg";
import Image from "next/image";
import {
  getTokensByAffiliatorId,
  createAffiliatorToken,
  activateAffiliatorToken,
  deactivateAffiliatorToken,
  deleteAffiliatorToken,
} from "@/features/affiliator";
import { useGetTokensByAffiliatorId } from "@/features/affiliator/hooks/useGetTokensByAffiliatorId";
import { useCallback, useState } from "react";

interface AffiliatorTokensProps {
  employeeId: string;
}

function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  try {
    const d = new Date(value);
    return isNaN(d.getTime()) ? value : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return value;
  }
}

export function AffiliatorTokens({ employeeId }: AffiliatorTokensProps) {
  const { tokens, loading, refetch } = useGetTokensByAffiliatorId(employeeId);
  const [creating, setCreating] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setError(null);
    setCreating(true);
    try {
      await createAffiliatorToken(employeeId);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to create token.";
      setError(String(msg));
    } finally {
      setCreating(false);
    }
  };

  const handleActivate = async (tokenId: string) => {
    setError(null);
    setActionId(tokenId);
    try {
      await activateAffiliatorToken(tokenId);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to activate.";
      setError(String(msg));
    } finally {
      setActionId(null);
    }
  };

  const handleDeactivate = async (tokenId: string) => {
    setError(null);
    setActionId(tokenId);
    try {
      await deactivateAffiliatorToken(tokenId);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to deactivate.";
      setError(String(msg));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (tokenId: string) => {
    if (!confirm("Delete this token? It will stop working immediately.")) return;
    setError(null);
    setActionId(tokenId);
    try {
      await deleteAffiliatorToken(tokenId);
      refetch();
    } catch (err: unknown) {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error ? err.message : "Failed to delete.";
      setError(String(msg));
    } finally {
      setActionId(null);
    }
  };

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token).catch(() => {});
  };

  if (loading) {
    return (
      <div className={s.AffiliatorTokens}>
        <div className={s.AffiliatorTokens__content}>
          <p className={s.AffiliatorTokens__muted}>Loading tokens…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={s.AffiliatorTokens}>
      <div className={s.AffiliatorTokens__content}>
        <div className={s.AffiliatorTokens__row}>
          <h2 className={s.AffiliatorTokens__title}>Tokens</h2>
          <ButtonComponentDefault
            label={creating ? "Creating…" : "Generate new Token"}
            color="#0d0d12"
            backgroundColor="#00f5ff"
            onClick={handleCreate}
            disabled={creating}
          />
        </div>

        {error && <p className={s.AffiliatorTokens__error}>{error}</p>}

        <div className={s.AffiliatorTokens__block}>
          {tokens.length === 0 ? (
            <p className={s.AffiliatorTokens__muted}>No tokens yet. Create one with the button above.</p>
          ) : (
            tokens.map((t) => (
              <div key={t.id} className={s.AffiliatorTokens__item}>
                <div className={s.AffiliatorTokens__box}>
                  <h3>Token</h3>
                  <p>{t.token}</p>
                </div>
                <div className={s.AffiliatorTokens__box2}>
                  <p>Created</p>
                  <h3>{formatDate(t.createdAt)}</h3>
                  {t.revokedAt && (
                    <>
                      <p style={{ marginTop: 8 }}>Revoked</p>
                      <h3>{formatDate(t.revokedAt)}</h3>
                    </>
                  )}
                </div>
                <div className={s.AffiliatorTokens__status}>
                  <span className={t.isActive ? s.AffiliatorTokens__statusActive : s.AffiliatorTokens__statusInactive}>
                    {t.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className={s.AffiliatorTokens__buttons}>
                  <button
                    type="button"
                    className={s.AffiliatorTokens__button}
                    onClick={() => handleCopy(t.token)}
                    title="Copy token"
                    aria-label="Copy token"
                  >
                    <Image src={iconCopy} width={24} height={24} alt="" />
                  </button>
                  {t.isActive ? (
                    <button
                      type="button"
                      className={s.AffiliatorTokens__butDeactivate}
                      onClick={() => handleDeactivate(t.id)}
                      disabled={actionId === t.id}
                      title="Deactivate token"
                    >
                      {actionId === t.id ? "…" : "Deactivate"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={s.AffiliatorTokens__butActivate}
                      onClick={() => handleActivate(t.id)}
                      disabled={actionId === t.id}
                      title="Activate token"
                    >
                      {actionId === t.id ? "…" : "Activate"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={s.AffiliatorTokens__but}
                    onClick={() => handleDelete(t.id)}
                    disabled={actionId === t.id}
                    title="Delete token"
                  >
                    {actionId === t.id ? "…" : "Delete"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
