import { useCallback, useEffect, useRef } from 'react';
import { clearDraft, readDraft, writeDraft } from './formDraft';

export function mergeDraft<T extends object>(key: string, baseline: T): { value: T; restored: boolean } {
  const saved = readDraft<Partial<T>>(key);
  if (!saved) return { value: baseline, restored: false };
  const value = { ...baseline, ...saved } as T;
  let restored = false;
  try {
    restored = JSON.stringify(value) !== JSON.stringify(baseline);
  } catch {
    restored = true;
  }
  if (!restored) {
    clearDraft(key);
    return { value: baseline, restored: false };
  }
  return { value, restored: true };
}

/** Writes a form snapshot locally until it matches the untouched baseline again. */
export function usePersistDraft(key: string, value: unknown, baseline: unknown, enabled = true) {
  const frozen = useRef<string | null>(null);
  const latest = useRef('');
  let serialized = '';
  try {
    serialized = JSON.stringify(value);
  } catch {
    serialized = '';
  }
  latest.current = serialized;
  let baseSerialized: string | null = null;
  if (baseline != null) {
    try {
      baseSerialized = JSON.stringify(baseline);
    } catch {
      baseSerialized = null;
    }
  }

  useEffect(() => {
    if (!enabled || baseSerialized == null || !serialized) return;
    if (frozen.current != null && serialized === frozen.current) return;
    frozen.current = null;
    if (serialized === baseSerialized) {
      clearDraft(key);
      return;
    }
    try {
      writeDraft(key, JSON.parse(serialized));
    } catch {
      // A full browser store should not block the form.
    }
  }, [key, enabled, serialized, baseSerialized]);

  return useCallback(() => {
    frozen.current = latest.current;
    clearDraft(key);
  }, [key]);
}
