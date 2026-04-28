'use client';

import { useCallback } from 'react';
import { useJDStore } from '@/stores/jdStore';
import type { JDMatchResult, JobDescription } from '@/types/jd';

export function useJDMatch() {
  const store = useJDStore();
  const { setCurrentJD } = store;

  const matchJD = useCallback(
    async (jdContent: string, resumeId?: string): Promise<JDMatchResult> => {
      store.setMatching(true);
      store.setError(null);

      try {
        const response = await fetch('/api/jd/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jdContent,
            resumeId,
            companyName: store.companyName,
            jobTitle: store.jobTitle,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `匹配分析失败 (${response.status})`);
        }

        const data: JDMatchResult = await response.json();
        store.setMatchResult(data);
        setCurrentJD({
          id: '',
          companyName: store.companyName,
          jobTitle: store.jobTitle,
          content: jdContent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'JD匹配分析失败';
        store.setError(message);
        throw error;
      } finally {
        store.setMatching(false);
      }
    },
    [store]
  );

  return {
    ...store,
    matchJD,
  };
}
