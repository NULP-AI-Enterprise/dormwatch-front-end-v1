import { API_BASE } from "@/services/apiConfig";

let accessToken = null;

// ── Refresh mutex: prevents concurrent refresh calls ──
let refreshPromise = null;

// ── Proactive silent refresh ──
const ACCESS_TOKEN_LIFETIME_MS = 30 * 60 * 1000; // must match Django ACCESS_TOKEN_LIFETIME
const REFRESH_BEFORE_EXPIRY_MS = 4 * 60 * 1000;  // refresh 4 min before expiry
let proactiveRefreshTimer = null;

function setAccessToken(token) {
  accessToken = token;
  try {
    if (token) {
      sessionStorage.setItem("access_token", token);
      scheduleProactiveRefresh();
    } else {
      sessionStorage.removeItem("access_token");
      clearProactiveRefresh();
    }
  } catch (_) {}
}

try {
  accessToken = sessionStorage.getItem("access_token");
} catch (_) {}

const AUTH_HEADERS = { "Content-Type": "application/json", "Accept": "application/json" };

async function parseErrorBody(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body?.detail || "Invalid credentials");
  }
  const data = await res.json();
  setAccessToken(data.access);
  return data;
}

export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body ? JSON.stringify(body) : `Error ${res.status}`);
  }
  const tokenData = await res.json();
  setAccessToken(tokenData.access);
  return tokenData;
}

// Mutex-guarded refresh: only one refresh request at a time.
// Concurrent callers await the same promise and reuse the result.
//
// Failure semantics matter for "don't log the user out on a blip":
//   - An explicit 401 from /auth/refresh/ means the refresh cookie is gone,
//     expired, or blacklisted → the session is truly dead. Clear the token
//     and throw "AUTH_REQUIRED".
//   - A network error or any non-401 (5xx, offline, CORS) is TRANSIENT →
//     leave the existing token in place and throw "REFRESH_TRANSIENT" so the
//     caller can keep the session and retry later, rather than logging out.
export async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    let res;
    try {
      res = await fetch(`${API_BASE}/auth/refresh/`, {
        method: "POST",
        credentials: "include",
      });
    } catch (netErr) {
      // Network/transport failure — do NOT clear the session.
      throw new Error("REFRESH_TRANSIENT");
    }

    if (res.status === 401) {
      // Explicit auth-required: the session is genuinely over.
      setAccessToken(null);
      throw new Error("AUTH_REQUIRED");
    }
    if (!res.ok) {
      // 5xx / unexpected — transient, keep whatever token we have.
      throw new Error("REFRESH_TRANSIENT");
    }
    const data = await res.json();
    setAccessToken(data.access);
    return data;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// ── Proactive silent refresh ──
// Refreshes the access token before it expires so that the user
// never hits a 401 during normal navigation.

export function scheduleProactiveRefresh() {
  clearProactiveRefresh();
  const delay = ACCESS_TOKEN_LIFETIME_MS - REFRESH_BEFORE_EXPIRY_MS;
  proactiveRefreshTimer = setTimeout(async () => {
    try {
      await refreshAccessToken();
    } catch {
      // Silent failure — the reactive 401-path will handle it
    }
  }, delay);
}

export function clearProactiveRefresh() {
  if (proactiveRefreshTimer) {
    clearTimeout(proactiveRefreshTimer);
    proactiveRefreshTimer = null;
  }
}

// ── Session bootstrap (runs once, awaited by every authenticated request) ──
// The access token lives only in sessionStorage (per-tab), but the refresh
// token is an httpOnly cookie that survives reloads and new tabs. So the
// absence of a sessionStorage access token does NOT mean "logged out" — it
// may just be a fresh tab. Attempt exactly ONE silent refresh before any
// authenticated call concludes the user is unauthenticated.
let bootstrapPromise = null;
export function ensureSession() {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    if (accessToken) {
      // Same-tab reload with a (possibly stale) token: keep the ongoing
      // proactive-refresh cycle alive so it slides before expiry.
      scheduleProactiveRefresh();
      return;
    }
    // New tab / full reload with no in-memory token: try to recover the
    // session from the refresh cookie. Swallow the outcome — a 401
    // (AUTH_REQUIRED) already cleared the token; a transient failure leaves
    // things untouched so a later call can retry rather than logging out.
    try {
      await refreshAccessToken();
    } catch (_) {
      // AUTH_REQUIRED → genuinely logged out; REFRESH_TRANSIENT → retry later.
    }
  })();
  return bootstrapPromise;
}

// Kick off the recovery attempt immediately on module load so it overlaps
// with React mounting, but every authenticated request also awaits it.
ensureSession();

export async function logoutUser() {
  clearProactiveRefresh();
  await fetch(`${API_BASE}/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
  window.location.reload();
}

export async function fetchBuildings() {
  try {
    return await fetchJson("/buildings/");
  } catch (e) {
    console.warn("Failed to fetch buildings", e);
    return [];
  }
}

export async function fetchPlaces(buildingId) {
  try {
    return await fetchJson(`/places/?building_id=${buildingId}`);
  } catch (e) {
    console.warn("Failed to fetch places", e);
    return [];
  }
}

export async function fetchCategories() {
  try {
    const data = await fetchJson("/categories/");
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.warn("Failed to fetch categories", e);
    return [];
  }
}

// ── Reference-data CRUD (admin settings + resident room creation) ──

export async function createCategory(name) {
  return await fetchJson("/admin/categories/", {
    method: "POST",
    body: { name },
  });
}

export async function updateCategory(id, name) {
  return await fetchJson(`/admin/categories/${id}/`, {
    method: "PATCH",
    body: { name },
  });
}

// Non-destructive: returns { detached_complaints }.
export async function deleteCategory(id) {
  return await fetchJson(`/admin/categories/${id}/`, { method: "DELETE" });
}

export async function createBuilding(name, address, { commandantPhone, dutyMasterPhone } = {}) {
  return await fetchJson("/admin/buildings/", {
    method: "POST",
    body: {
      name,
      address,
      commandant_phone: commandantPhone ?? "",
      duty_master_phone: dutyMasterPhone ?? "",
    },
  });
}

export async function updateBuilding(id, { name, address, commandantPhone, dutyMasterPhone }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (address !== undefined) body.address = address;
  if (commandantPhone !== undefined) body.commandant_phone = commandantPhone;
  if (dutyMasterPhone !== undefined) body.duty_master_phone = dutyMasterPhone;
  return await fetchJson(`/admin/buildings/${id}/`, {
    method: "PATCH",
    body,
  });
}

// On 409 (building has rooms), fetchJson throws with the JSON body as the
// message — callers JSON.parse(err.message) to read `places_count`.
export async function deleteBuilding(id, { force = false } = {}) {
  const q = force ? "?force=true" : "";
  return await fetchJson(`/admin/buildings/${id}/${q}`, { method: "DELETE" });
}

// Returns the full Place (with place_id) — powers the combobox "create room".
export async function createPlace(buildingId, placeName) {
  return await fetchJson("/places/", {
    method: "POST",
    body: { building_id: buildingId, place_name: placeName },
  });
}

export async function updatePlace(id, placeName) {
  return await fetchJson(`/admin/places/${id}/`, {
    method: "PATCH",
    body: { place_name: placeName },
  });
}

// Non-destructive: returns { detached_complaints }.
export async function deletePlace(id) {
  return await fetchJson(`/admin/places/${id}/`, { method: "DELETE" });
}

/**
 * @param {string} path
 * @param {{ method?: string, body?: any }} [options]
 */
export async function fetchJson(path, { method = "GET", body } = {}) {
  // Wait for the one-shot session bootstrap: on a fresh tab / full reload the
  // access token isn't in memory yet, so give the silent cookie-refresh a
  // chance to populate it before we send the request (and before any 401
  // concludes the user is logged out).
  await ensureSession();

  // Build headers INSIDE a function so they always pick up the
  // current (potentially refreshed) access token — no stale closure.
  const buildHeaders = () => {
    const h = { "Accept": "application/json" };
    if (accessToken) h["Authorization"] = `Bearer ${accessToken}`;
    if (body && !(body instanceof FormData)) h["Content-Type"] = "application/json";
    return h;
  };

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers: buildHeaders(),      // ← fresh headers on every call
      credentials: "include",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });

  let res = await doFetch();

  // On 401/403 with an access token present, the token may be expired
  // or corrupted. Try a silent refresh once and retry the request.
  // DRF returns 401 (NotAuthenticated) when all authenticators fail,
  // but can return 403 (PermissionDenied) in some flows (e.g. CSRF
  // failure on SessionAuthentication). We attempt a refresh on both,
  // but only retry 403 if the refresh actually produced a *different*
  // token — otherwise it's a genuine permission denial (e.g. non-admin
  // hitting an admin endpoint).
  if ((res.status === 401 || res.status === 403) && accessToken) {
    try {
      const oldToken = accessToken;
      await refreshAccessToken();   // mutex-guarded — safe under concurrency
      // Only retry 403 if the token genuinely changed (stale → fresh).
      // A genuine 403 (wrong role) won't change with a new token.
      const tokenChanged = accessToken && accessToken !== oldToken;
      if (res.status === 401 || tokenChanged) {
        res = await doFetch();      // ← rebuilds headers with the NEW token
      }
    } catch (e) {
      // A transient refresh failure (network/5xx) must NOT log the user out —
      // the token is still in place, so surface a retryable error instead of
      // tearing down the session. Only an explicit AUTH_REQUIRED is fatal.
      if (e instanceof Error && e.message === "REFRESH_TRANSIENT") {
        throw new Error("REFRESH_TRANSIENT");
      }
      throw new Error("AUTH_REQUIRED");
    }
  }

  // After refresh-retry, if it's STILL 401/403 the session is truly dead
  if (res.status === 401 || res.status === 403) {
    setAccessToken(null);
    throw new Error("AUTH_REQUIRED");
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `Error ${res.status}`);
  }

  if (res.status === 204) return true;
  return await res.json();
}

/**
 * @param {any} raw
 * @returns {any}
 */
function normalizeComplaint(raw) {
  if (!raw) return null;

  // A record with no real id is unusable — every action (delete/status/ticket)
  // targets its id, so a fabricated id would silently 404. Skip it entirely.
  const realId = raw.id ?? raw.complaint_id;
  if (realId === undefined || realId === null) return null;

  let status = raw.status || "pending";
  if (status === "published") status = "approved";
  if (status === "denied") status = "rejected";

  let safeRoom = "";
  let safeFloor = "";
  let safeBuilding = "";

  if (raw.place && typeof raw.place === "object") {
    safeRoom = String(raw.place.place_name || "");
    if (raw.place.building) {
      safeBuilding = String(raw.place.building.name || raw.place.building.building_id || "");
    }
  } else if (raw.room && typeof raw.room === "object") {
    safeRoom = String(raw.room.room_number || "");
    if (raw.room.floor) {
      safeFloor = String(raw.room.floor.floor_number || "");
      if (raw.room.floor.building) {
        safeBuilding = String(raw.room.floor.building.number || "");
      }
    }
  } else {
    safeRoom = raw.room || "";
    safeFloor = raw.floor || "";
    safeBuilding = raw.building || "";
  }

  return {
    id: realId,
    title: raw.title ?? "Без назви",
    description: raw.description ?? "",
    // null (not a fabricated label) when the payload has no category — the UI
    // omits the chip rather than showing the literal word "Категорія".
    category: raw.category?.name ?? raw.category ?? null,
    building: safeBuilding,
    room: safeRoom,
    placeName: safeRoom,
    floor: safeFloor,
    photoUrl: raw.photo_url ?? raw.photoUrl ?? null,
    thumbnail: raw.thumbnail ?? null,
    status: status,
    // null when unset — the UI omits the badge instead of inventing "medium".
    priority: raw.priority ?? null,
    // null when unset — avoids fabricating a "created today" timestamp that
    // would also sort to the top and match the "today" date filter.
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    user_id: raw.user?.id || raw.user?.user || raw.user || null,
  };
}

// Newest first; records without a timestamp sort last (they have no known date).
function sortByNew(a, b) {
  const ta = a.createdAt ? new Date(a.createdAt).getTime() : -Infinity;
  const tb = b.createdAt ? new Date(b.createdAt).getTime() : -Infinity;
  return tb - ta;
}

export async function fetchUserProfile() {
  try {
    return await fetchJson(`/profile/?t=${Date.now()}`);
  } catch (e) {
    return null;
  }
}

export async function createProblem(problem) {
  const formData = new FormData();
  // Prefer place_id (emitted by PlaceCombobox); fall back to free-text name.
  if (problem.place_id) {
    formData.append("place_id", problem.place_id);
  } else if (problem.place_name) {
    formData.append("place_name", problem.place_name);
  }
  formData.append("category", problem.category);
  formData.append("title", problem.title);
  formData.append("description", problem.description);
  if (problem.priority) {
    formData.append("priority", problem.priority);
  }
  if (problem.photoFile instanceof File) {
    formData.append("photo_url", problem.photoFile);
  }
  const raw = await fetchJson("/me/complaints/", {
    method: "POST",
    body: formData,
  });
  return normalizeComplaint(raw);
}

export async function fetchMyProblems() {
  try {
    const data = await fetchJson("/me/complaints/");
    if (Array.isArray(data))
      return data.map(normalizeComplaint).filter(Boolean).sort(sortByNew);
  } catch (e) {
    console.warn(e);
  }
  return [];
}

// Build a `?a=1&b=2` query string from `filters`, restricted to `keys`.
// Skips missing/empty values and the sentinel "all"; prefixes "?" when non-empty.
function buildQueryParams(filters = {}, keys = ["corps", "priority"]) {
  const params = new URLSearchParams();
  for (const key of keys) {
    const value = filters[key];
    if (value && value !== "all") params.append(key, value);
  }
  return params.toString() ? `?${params.toString()}` : "";
}

// `status` keeps the single-code shorthand; `statuses` (array) narrows to any
// of several normalized codes — both are optional and, if given together,
// applied in sequence.
export async function fetchComplaints({ status, statuses, filters = {} } = {}) {
  try {
    const q = buildQueryParams(filters);
    const data = await fetchJson(`/complaints/${q}`);
    if (Array.isArray(data)) {
      let results = data.map(normalizeComplaint).filter(Boolean);
      if (status) results = results.filter((c) => c.status === status);
      if (statuses) results = results.filter((c) => statuses.includes(c.status));
      results.sort(sortByNew);
      return results;
    }
  } catch (e) {
    console.warn("Fetch error:", e);
  }
  return [];
}

export async function fetchAllComplaints(filters = {}) {
  return fetchComplaints({ filters });
}

export async function fetchApprovedComplaints(filters = {}) {
  return fetchComplaints({ status: "approved", filters });
}

// The public board feed: active ("approved" = published) plus completed
// ("resolved") issues. Matches the server's non-admin visibility rule; excludes
// pending/rejected. Admins get every status from the API but this same cut keeps
// the public dashboard's meaning consistent across roles.
export async function fetchPublicComplaints(filters = {}) {
  return fetchComplaints({ statuses: ["approved", "resolved"], filters });
}

export async function deleteProblem(id) {
  await fetchJson(`/me/complaints/${id}/`, { method: "DELETE" });
  return true;
}

export async function updateComplaintStatus(id, newStatus) {
  let backendStatus = newStatus;
  if (newStatus === "approved") backendStatus = "published";
  if (newStatus === "rejected") backendStatus = "denied";

  const formData = new FormData();
  formData.append("status", backendStatus);

  await fetchJson(`/admin/complaints/${id}/status/`, {
    method: "PATCH",
    body: formData,
  });
  return { id, status: newStatus };
}

export async function updateComplaintPriority(id, newPriority) {
  const formData = new FormData();
  formData.append("priority", newPriority);

  await fetchJson(`/admin/complaints/${id}/status/`, {
    method: "PATCH",
    body: formData,
  });
  return { id, priority: newPriority };
}

export async function fetchComments(complaintId) {
  try {
    const data = await fetchJson(`/complaints/${complaintId}/comments/`);
    return data.map((c) => ({
      id: c.comment_id,
      text: c.description,
      author: c.user_name || "Користувач",
      author_id: c.user,
      date: c.created_at,
    }));
  } catch (e) {
    console.warn("Fetch comments error:", e);
    return [];
  }
}

// ------------------ WORKERS & TICKETS ------------------

// External contractors assignable to tickets (managed in Admin Settings). Also
// serves the ticket assignment dropdown.
export async function fetchWorkers() {
  try {
      const data = await fetchJson("/admin/workers/");
      if (Array.isArray(data)) return data;
  } catch (e) {
      console.warn("Failed to fetch workers", e);
  }
  return [];
}

export async function createWorker({ full_name, company = "", phone = "" }) {
  return await fetchJson("/admin/workers/", {
      method: "POST",
      body: { full_name, company, phone },
  });
}

export async function updateWorker(workerId, fields) {
  return await fetchJson(`/admin/workers/${workerId}/`, {
      method: "PATCH",
      body: fields,
  });
}

export async function deleteWorker(workerId) {
  await fetchJson(`/admin/workers/${workerId}/`, { method: "DELETE" });
  return true;
}

// ------------------ RESIDENTS (admin user management) ------------------

// All user profiles with nested building/place/role, for the admin residents
// page ("Мешканці").
export async function fetchUsers() {
  try {
      const data = await fetchJson("/admin/users/");
      if (Array.isArray(data)) return data;
  } catch (e) {
      console.warn("Failed to fetch users", e);
  }
  return [];
}

// Assignable roles (full role table), for the edit dialog + role filter.
export async function fetchRoles() {
  try {
      const data = await fetchJson("/roles/");
      if (Array.isArray(data)) return data;
  } catch (e) {
      console.warn("Failed to fetch roles", e);
  }
  return [];
}

// Admin edit of a resident's dorm assignment / role. `fields` is any subset of
// { role_id, building_id, place_id }; the backend blocks changing your own role.
export async function updateUser(userId, fields) {
  return await fetchJson(`/admin/users/${userId}/`, {
      method: "PATCH",
      body: fields,
  });
}

export async function fetchTickets(filters = {}) {
  try {
      const q = buildQueryParams(filters, ["worker", "priority", "date_from", "date_to"]);

      const data = await fetchJson(`/tickets/${q}`);
      if (Array.isArray(data)) return data;
  } catch (e) {
      console.warn("Failed to fetch tickets", e);
  }
  return [];
}

// Read-only: the tickets (work orders) opened for the current resident's own
// complaints. Backed by GET /me/tickets/ — residents cannot list all tickets
// (that stays admin-gated via fetchTickets).
export async function fetchMyTickets() {
  try {
      const data = await fetchJson("/me/tickets/");
      if (Array.isArray(data)) return data;
  } catch (e) {
      console.warn("Failed to fetch my tickets", e);
  }
  return [];
}

/**
 * @param {any} complaintId
 * @param {any} workerId
 * @param {string | null} [deadline]
 */
export async function createTicket(complaintId, workerId, deadline = null) {
  const payload = {
      complaint: complaintId,
      worker: workerId,
      deadline: deadline
  };
  return await fetchJson("/tickets/", {
      method: "POST",
      body: payload
  });
}

/**
 * @param {any} ticketId
 * @param {any} workerId
 * @param {string | null} [deadline]
 */
export async function updateTicket(ticketId, workerId, deadline = null) {
  const payload = {};
  if (workerId !== undefined) payload.worker = workerId;
  if (deadline !== undefined) payload.deadline = deadline;

  return await fetchJson(`/tickets/${ticketId}/`, {
      method: "PATCH",
      body: payload
  });
}

// The complaint owner marks their own request resolved. Backed by
// PATCH /me/complaints/<id>/resolve/ (owner-only, published -> resolved).
export async function resolveMyComplaint(complaintId) {
  await fetchJson(`/me/complaints/${complaintId}/resolve/`, { method: "PATCH" });
  return { id: complaintId, status: "resolved" };
}

export async function postComment(complaintId, text) {
  const data = await fetchJson(`/complaints/${complaintId}/comments/`, {
    method: "POST",
    body: { description: text },
  });
  return {
    id: data.comment_id,
    text: data.description,
    author: data.user_name || "Ви",
    author_id: data.user,
    date: data.created_at,
  };
}

export async function deleteComment(commentId) {
  await fetchJson(`/comments/${commentId}/`, { method: "DELETE" });
}

export async function fetchNotifications() {
  try {
    return await fetchJson("/notifications/");
  } catch (e) {
    console.warn("Failed to fetch notifications", e);
    return [];
  }
}

export async function markNotificationRead(id) {
  try {
    return await fetchJson(`/notifications/${id}/`, {
      method: "PATCH",
    });
  } catch (e) {
    console.warn(`Failed to mark notification ${id} as read`, e);
    return null;
  }
}

export async function markAllNotificationsRead() {
  try {
    return await fetchJson("/notifications/mark-all-read/", {
      method: "POST",
    });
  } catch (e) {
    console.warn("Failed to mark all notifications as read", e);
    return null;
  }
}

export async function fetchComplaintDetail(id) {
  const raw = await fetchJson(`/complaints/${id}/`);
  return normalizeComplaint(raw);
}


