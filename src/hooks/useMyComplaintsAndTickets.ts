import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchMyProblems, fetchMyTickets } from "@/services/problemsApi";
import type { Complaint, Ticket } from "@/lib/types";

// Single source of truth for the resident data-loading + live-refresh contract
// shared by /user, /my-complaints, and /my-tickets. Previously each page
// hand-rolled an identical load() + `complaintUpdated` listener + lookup Maps
// (review finding: triplicated). Owning it here means one place to change the
// fetch set, the refresh trigger, or the join.
export function useMyComplaintsAndTickets() {
  const [problems, setProblems] = useState<Complaint[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const [p, t] = await Promise.all([fetchMyProblems(), fetchMyTickets()]);
      setProblems(Array.isArray(p) ? p : []);
      setTickets(Array.isArray(t) ? t : []);
    } catch (e) {
      console.error("Failed to load resident complaints/tickets", e);
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

  // A complaint may have more than one ticket (no unique constraint server-side)
  // — key by the newest ticket_id so the "current" work order wins deterministically.
  const ticketByComplaint = useMemo(() => {
    const m = new Map<number, Ticket>();
    for (const t of tickets) {
      const existing = m.get(t.complaint);
      if (!existing || t.ticket_id > existing.ticket_id) m.set(t.complaint, t);
    }
    return m;
  }, [tickets]);

  return { problems, tickets, loading, reload, complaintById, ticketByComplaint };
}

// Map-only variant for chrome that already has its own complaint list but needs
// the owner's ticket for the read-only tracking block (StudentLayout notif
// panel, DashboardPage). Keyed newest-ticket-wins, same as above.
export function useMyTicketMap() {
  const [ticketByComplaint, setTicketByComplaint] = useState<Map<number, Ticket>>(new Map());

  useEffect(() => {
    let alive = true;
    const build = (tickets: Ticket[]) => {
      const m = new Map<number, Ticket>();
      for (const t of tickets) {
        const existing = m.get(t.complaint);
        if (!existing || t.ticket_id > existing.ticket_id) m.set(t.complaint, t);
      }
      return m;
    };
    const load = () =>
      fetchMyTickets()
        .then((t) => { if (alive) setTicketByComplaint(build(Array.isArray(t) ? t : [])); })
        .catch(() => {});
    load();
    const handler = () => { load(); };
    window.addEventListener("complaintUpdated", handler);
    return () => { alive = false; window.removeEventListener("complaintUpdated", handler); };
  }, []);

  return ticketByComplaint;
}
