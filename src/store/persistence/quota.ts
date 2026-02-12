import { useEffect, useMemo, useState } from "react";

export type QuotaInfo = {
  used: number;
  total: number;
  percent: number;
};

export async function checkStorageQuota(): Promise<QuotaInfo> {
  if (typeof navigator !== "undefined" && navigator.storage?.estimate) {
    const estimate = await navigator.storage.estimate();
    const used = estimate.usage ?? 0;
    const total = estimate.quota ?? 1;
    const percent = total > 0 ? (used / total) * 100 : 0;
    return { used, total, percent };
  }
  return { used: 0, total: 1, percent: 0 };
}

export function useStorageQuota() {
  const [quota, setQuota] = useState<QuotaInfo>({ used: 0, total: 1, percent: 0 });

  useEffect(() => {
    checkStorageQuota().then(setQuota).catch(() => setQuota({ used: 0, total: 1, percent: 0 }));
  }, []);

  return useMemo(() => ({
    quota,
    isWarning: quota.percent >= 80,
    isCritical: quota.percent >= 95,
  }), [quota]);
}
