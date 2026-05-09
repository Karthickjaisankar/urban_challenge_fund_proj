import { useEffect, useState } from "react";

/**
 * Subscribes to /api/dept/{code}/stream (SSE) and yields the latest snapshot.
 * Reconnects when `code` changes.
 */
export function useLiveTick(code: string): { snapshot: any | null; connected: boolean } {
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setSnapshot(null);
    setConnected(false);
    const es = new EventSource(`/api/dept/${code}/stream`);
    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);
    es.onmessage = (ev) => {
      try { setSnapshot(JSON.parse(ev.data)); } catch { /* ignore */ }
    };
    return () => es.close();
  }, [code]);

  return { snapshot, connected };
}
