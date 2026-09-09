"use client";

import { useEffect, useState } from "react";
import type { MetaResponse } from "./types";

let cachedMeta: MetaResponse | null = null;

/** Charge une seule fois les listes de reference (ecoles, mondes, types...). */
export function useMeta() {
  const [meta, setMeta] = useState<MetaResponse | null>(cachedMeta);
  const [loading, setLoading] = useState(!cachedMeta);

  useEffect(() => {
    if (cachedMeta) return;
    let cancelled = false;
    fetch("/api/meta")
      .then((res) => res.json())
      .then((data: MetaResponse) => {
        if (cancelled) return;
        cachedMeta = data;
        setMeta(data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { meta, loading };
}
