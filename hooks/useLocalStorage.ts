"use client";

import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      setValue(initialValue);
    } finally {
      setIsHydrated(true);
    }
  }, [initialValue, key]);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [isHydrated, key, value]);

  return [value, setValue, isHydrated] as const;
}
