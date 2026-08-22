import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyProblems } from "@/services/problemsApi";
import type { Complaint } from "@/lib/types";

// Single source of truth for the resident data-loading + live-refresh contract
// shared by /user and /my-complaints. Owning it here means one place to change
// the fetch set, the refresh trigger, or the lookup join.
export function useMyComplaints() {
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const p = await fetchMyProblems();
      setProblems(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error("Failed to load resident complaints", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // A complaint edit/status change elsewhere (side panel) dispatches this.
    const handler = () => { reload(); };
    window.addEventListener("complaintUpdated", handler);
    return () => window.removeEventListener("complaintUpdated", handler);
  }, [reload]);

  const complaintById = useMemo(
    () => new Map<number, Complaint>(problems.map((p) => [p.id, p])),
    [problems]
  );

  return { problems, loading, reload, complaintById };
}
