import { useEffect, useState } from "react";
import { fetchBuildings } from "@/services/problemsApi";
import type { Building } from "@/lib/types";

// Fetches the building list once on mount. Replaces the repeated
// `fetchBuildings().then(setBuildings)` + inline `Building` state that was
// copy-pasted across the admin/dashboard/auth pages.
export function useBuildings(): Building[] {
  const [buildings, setBuildings] = useState<Building[]>([]);

  useEffect(() => {
    fetchBuildings()
      .then(setBuildings)
      .catch(() => {});
  }, []);

  return buildings;
}
