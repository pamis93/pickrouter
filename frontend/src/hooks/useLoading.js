// src/hooks/useLoading.js
import { useState, useCallback } from 'react';

export const useLoading = () => {
  const [loading, setLoading] = useState(false);
  const wrap = useCallback(async (fn) => {
    setLoading(true);
    try {
      return await fn();
    } finally {
      setLoading(false);
    }
  }, []);
  return { loading, wrap };
};
