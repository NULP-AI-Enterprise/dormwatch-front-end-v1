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
    const err = new Error(body?.detail || "Invalid credentials");
    if (body?.email_verified === false) {
      err.requiresVerification = true;
      err.email = body.email;
    }
    throw err;
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
  if (tokenData?.email_verified === false) {
    const err = new Error(tokenData.detail);
    err.requiresVerification = true;
    err.email = tokenData.email;
    throw err;
  }
  setAccessToken(tokenData.access);
  return tokenData;
}

export async function verifyEmail(email, code) {
  const res = await fetch(`${API_BASE}/auth/verify-email/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    credentials: "include",
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body?.detail || "Invalid or expired verification code");
  }
  const data = await res.json();
  setAccessToken(data.access);
  return data;
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${API_BASE}/auth/password-reset/request/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body?.detail || "Failed to request password reset");
  }
  return await res.json();
}

export async function confirmPasswordReset(email, code, password, confirmPassword) {
  const res = await fetch(`${API_BASE}/auth/password-reset/confirm/`, {
    method: "POST",
    headers: AUTH_HEADERS,
    body: JSON.stringify({ email, code, password, confirm_password: confirmPassword }),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body?.detail || "Failed to reset password");
  }
  return await res.json();
}

export async function changePassword(oldPassword, newPassword, confirmNewPassword) {
  const res = await fetch(`${API_BASE}/auth/password-change/`, {
    method: "POST",
    headers: {
      ...AUTH_HEADERS,
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      old_password: oldPassword,
      new_password: newPassword,
      confirm_new_password: confirmNewPassword,
    }),
  });
  if (!res.ok) {
    const body = await parseErrorBody(res);
    throw new Error(body?.detail || "Failed to change password");
  }
  return await res.json();
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

// Maps the backend Place payload (snake_case) to the app's Place shape.
// capacity/occupancy pass through as-is; is_shared → isShared.
function mapPlace(p) {
  return {
    place_id: p.place_id,
    place_name: p.place_name,
    capacity: p.capacity ?? 0,
    isShared: !!p.is_shared,
    occupancy: p.occupancy,
  };
}

export async function fetchPlaces(buildingId) {
  try {
    const data = await fetchJson(`/places/?building_id=${buildingId}`);
    return Array.isArray(data) ? data.map(mapPlace) : [];
  } catch (e) {
    console.warn("Failed to fetch places", e);
    return [];
  }
}

// The bounded set of rooms the current resident may file a звернення against:
// their own assigned room + all shared rooms in their building. Backed by
// GET /me/complaint-places/ (server also re-validates the choice on POST).
export async function fetchMyComplaintPlaces() {
  try {
    const data = await fetchJson("/me/complaint-places/");
    return Array.isArray(data) ? data.map(mapPlace) : [];
  } catch (e) {
    console.warn("Failed to fetch complaint places", e);
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

export async function createBuilding(name, address, { commandantPhone } = {}) {
  return await fetchJson("/admin/buildings/", {
    method: "POST",
    body: {
      name,
      address,
      commandant_phone: commandantPhone ?? "",
    },
  });
}

export async function updateBuilding(id, { name, address, commandantPhone }) {
  const body = {};
  if (name !== undefined) body.name = name;
  if (address !== undefined) body.address = address;
  if (commandantPhone !== undefined) body.commandant_phone = commandantPhone;
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
// capacity/isShared are optional; a shared room defaults to capacity 0.
export async function createPlace(buildingId, placeName, { capacity, isShared } = {}) {
  const body = { building_id: buildingId, place_name: placeName };
  if (capacity !== undefined) body.capacity = capacity;
  if (isShared !== undefined) body.is_shared = isShared;
  return mapPlace(
    await fetchJson("/places/", {
      method: "POST",
      body,
    })
  );
}

export async function updatePlace(id, placeName, { capacity, isShared } = {}) {
  const body = { place_name: placeName };
  if (capacity !== undefined) body.capacity = capacity;
  if (isShared !== undefined) body.is_shared = isShared;
  return mapPlace(
    await fetchJson(`/admin/places/${id}/`, {
      method: "PATCH",
      body,
    })
  );
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

  // A record with no real id is unusable — every action (delete/status)
  // targets its id, so a fabricated id would silently 404. Skip it entirely.
  const realId = raw.id ?? raw.complaint_id;
  if (realId === undefined || realId === null) return null;

  // The server speaks the canonical slugs (pending/approved/in_progress/...)
  // byte-identical with STATUS_LABELS in lib/complaintUtils.ts — no aliasing.
  const status = raw.status || "pending";

  let safeRoom = "";
  let safeFloor = "";
  let safeBuilding = "";
  let shared = false;

  if (raw.place && typeof raw.place === "object") {
    safeRoom = String(raw.place.place_name || "");
    shared = !!raw.place.is_shared;
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
    // Public payloads emit `building_name` (no room/place); authenticated
    // payloads emit a nested `place`. Fall back to the flat label so the
    // public feed shows the building without leaking the room.
    safeBuilding = raw.building || raw.building_name || "";
  }

  return {
    id: realId,
    title: raw.title ?? "Без назви",
    description: raw.description ?? "",
    // null when the payload has no category/priority/timestamp — the UI
    // omits the chip rather than showing the literal word "Категорія".
    category: raw.category?.name ?? raw.category ?? null,
    building: safeBuilding,
    room: safeRoom,
    placeName: safeRoom,
    isShared: shared,
    floor: safeFloor,
    photoUrl: raw.photo_url ?? raw.photoUrl ?? null,
    thumbnail: raw.thumbnail ?? null,
    status: status,
    // null when unset — the UI omits the badge instead of inventing "medium".
    priority: raw.priority ?? null,
    // Assignment + lifecycle (merged into Complaint on the server): the
    // assigned contractor object, schedule, stamps, and re-file chain links.
    worker: raw.worker ?? null,
    deadline: raw.deadline ?? null,
    startedAt: raw.started_at ?? null,
    finishedAt: raw.finished_at ?? null,
    resolvedAt: raw.resolved_at ?? null,
    workNote: raw.work_note || "",
    rejectionReason: raw.rejection_reason || "",
    reworkReason: raw.rework_reason || "",
    followUpOf: raw.follow_up_of ?? null,
    root: raw.root ?? null,
    isOverdue: !!raw.is_overdue,
    // null when unset — avoids fabricating a "created today" timestamp that
    // would also sort to the top and match the "today" date filter.
    createdAt: raw.created_at ?? raw.createdAt ?? null,
    user_id: raw.user?.id || raw.user?.user || raw.user || null,
    rejectionReason: raw.rejection_reason ?? raw.rejectionReason ?? null,
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
  if (Array.isArray(problem.photoFiles) && problem.photoFiles.length > 0) {
    formData.append("photo_url", problem.photoFiles[0]);
    problem.photoFiles.forEach((file) => {
      formData.append("photos", file);
    });
  } else if (problem.photoFile instanceof File) {
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

// The public board feed: active ("approved") plus completed ("resolved")
// issues. Matches the server's non-admin visibility rule; excludes
// pending/rejected. Admins get every status from the API but this same cut keeps
// the public dashboard's meaning consistent across roles.
export async function fetchPublicComplaints(filters = {}) {
  return fetchComplaints({ statuses: ["approved", "resolved"], filters });
}

export async function deleteProblem(id) {
  await fetchJson(`/me/complaints/${id}/`, { method: "DELETE" });
  return true;
}

// Admin delete: hard-delete before a worker is assigned, archive afterwards
// (archived flag + archived_by/archived_at) so rejection marks and follow-up
// chains survive. Routes through the admin endpoint whose state-aware logic
// keeps the hard-delete and archive paths distinct.
export async function deleteAdminComplaint(id) {
  await fetchJson(`/admin/complaints/${id}/`, { method: "DELETE" });
  return true;
}

// ── Resident lifecycle verbs (owner-only, server-enforced transitions) ──
// accept: review → resolved; reject: review → terminal not_accepted
// (rework_reason required by the server); withdraw: pending → withdrawn.
export async function acceptComplaint(id) {
  await fetchJson(`/me/complaints/${id}/accept/`, { method: "POST" });
  return true;
}

export async function rejectComplaint(id, reworkReason) {
  await fetchJson(`/me/complaints/${id}/reject/`, {
    method: "POST",
    body: { rework_reason: reworkReason },
  });
  return true;
}

export async function withdrawComplaint(id) {
  await fetchJson(`/me/complaints/${id}/withdraw/`, { method: "POST" });
  return true;
}

// One-tap re-file: the server creates a fresh Очікує complaint prefilled from
// the closed one (title/description/category/place/photo), linked via
// follow_up_of. 409 means this source already has one open follow-up.
export async function refileComplaint(id) {
  const raw = await fetchJson(`/complaints/${id}/refile/`, { method: "POST" });
  return normalizeComplaint(raw);
}

// ── WORKER PANEL ──
// The provisioned worker's own jobs. Active list = live work sorted by next
// deadline (server-side); history = past jobs with their stamps.
export async function fetchWorkerJobs() {
  try {
    const data = await fetchJson("/worker/complaints/");
    if (Array.isArray(data)) {
      return data.map(normalizeComplaint).filter(Boolean);
    }
  } catch (e) {
    console.warn("Failed to fetch worker jobs", e);
  }
  return [];
}

export async function fetchWorkerHistory() {
  try {
    const data = await fetchJson("/worker/complaints/?history=true");
    if (Array.isArray(data)) {
      return data.map(normalizeComplaint).filter(Boolean);
    }
  } catch (e) {
    console.warn("Failed to fetch worker history", e);
  }
  return [];
}

// One-tap lifecycle stamps for the assigned worker: start (Взято в роботу),
// finish (Виконано), start_undo / finish_undo, with an optional short note.
// The server enforces the transition matrix; the 30s undo window before a
// resident is notified lives server-side too.
export async function workerComplaintAction(id, action, note) {
  const body = { action };
  if (note && note.trim()) body.note = note.trim();
  const raw = await fetchJson(`/worker/complaints/${id}/`, {
    method: "PATCH",
    body,
  });
  return normalizeComplaint(raw);
}

// Generic admin PATCH over the single complaint endpoint: any subset of
// { status, worker_id, deadline, priority, rejection_reason } in one call —
// this is what backs the combined triage moves (схвалити + призначити,
// reject with reason).
export async function updateComplaintAdmin(id, patch) {
  return await fetchJson(`/admin/complaints/${id}/`, {
    method: "PATCH",
    body: patch,
  });
}

// Admin lifecycle moves go through the single complaint PATCH. The server
// speaks the canonical slugs directly — no published/denied translation.
export async function updateComplaintStatus(id, newStatus) {
  return updateComplaintAdmin(id, { status: newStatus });
}

export async function updateComplaintPriority(id, newPriority) {
  return updateComplaintAdmin(id, { priority: newPriority });
}

// Admin assignment surface (worker + deadline on the complaint itself).
// workerId null clears the assignment; deadline null clears the deadline.
export async function updateComplaintAssignment(id, { workerId, deadline } = {}) {
  const body = {};
  if (workerId !== undefined) body.worker_id = workerId;
  if (deadline !== undefined) body.deadline = deadline;
  return updateComplaintAdmin(id, body);
}

export async function fetchComments(complaintId) {
  try {
    const data = await fetchJson(`/complaints/${complaintId}/comments/`);
    return data.map((c) => ({
      id: c.comment_id,
      text: c.description,
      author: c.user_name || "Користувач",
      author_id: c.user,
      authorIsAdmin: !!c.author_is_admin,
      date: c.created_at,
    }));
  } catch (e) {
    console.warn("Fetch comments error:", e);
    return [];
  }
}

// ------------------ WORKERS ------------------

// External contractors assignable to complaints (managed in Admin Settings).
// Also serves the complaint assignment dropdown in the admin panel.
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

// Provision a worker account: mints a single-use invite token bound to this
// worker. The admin delivers the redemption link by email or printed QR; the
// worker supplies their own email/password at /auth?invite=...
export async function createWorkerInvite(workerId) {
  return await fetchJson(`/admin/workers/${workerId}/invite/`, {
    method: "POST",
  });
}

// Sever a worker's account link (Worker.account → None). The worker endpoints
// then 403 at the next request because the live link check
// (`getattr(actor, 'worker', None)`) no longer resolves — access is stripped
// instead of riding an old refresh cookie. Reversible: re-provision anytime.
export async function unlinkWorker(workerId) {
  return await fetchJson(`/admin/workers/${workerId}/unlink/`, {
    method: "POST",
  });
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

// Admin completed-work report: resolved complaints with an assigned worker,
// filtered by resolution date within [date_from, date_to] (inclusive by day).
// Backed by GET /admin/reports/completed/. Returns the raw report rows
// (complaint title, resolved_at, building/room, category, worker, deadline).
export async function fetchCompletedReport({ date_from, date_to } = {}) {
  try {
    const params = new URLSearchParams();
    if (date_from) params.append("date_from", date_from);
    if (date_to) params.append("date_to", date_to);
    const q = params.toString() ? `?${params.toString()}` : "";
    const data = await fetchJson(`/admin/reports/completed/${q}`);
    if (Array.isArray(data)) return data;
  } catch (e) {
    console.warn("Failed to fetch completed report", e);
  }
  return [];
}

// Admin per-worker resource-tracking report: jobs count, per-job duration
// (started_at → finished_at, shown per job — never summed), average resolution
// time on resolved_at, on-time vs overdue, and rejection rate. Backed by
// GET /admin/reports/workers/. Returns { workers: [...], caveats: [...] }.
export async function fetchWorkerReport() {
  try {
    const data = await fetchJson("/admin/reports/workers/");
    if (data && Array.isArray(data.workers)) return data;
  } catch (e) {
    console.warn("Failed to fetch worker report", e);
  }
  return { workers: [], caveats: [] };
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
    authorIsAdmin: !!data.author_is_admin,
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

// Announcements — resident feed + dashboard widget (global + own building).
export async function fetchAnnouncements() {
  try {
    const d = await fetchJson("/announcements/");
    return Array.isArray(d) ? d : [];
  } catch (e) {
    console.warn("Failed to fetch announcements", e);
    return [];
  }
}

// Admin management list (all announcements).
export async function fetchAdminAnnouncements() {
  try {
    const d = await fetchJson("/admin/announcements/");
    return Array.isArray(d) ? d : [];
  } catch (e) {
    console.warn("Failed to fetch admin announcements", e);
    return [];
  }
}

// buildingId null = global (all buildings). expiresAt is a "YYYY-MM-DD" string or null.
export async function createAnnouncement({ title, body, buildingId, isPinned, expiresAt }) {
  return await fetchJson("/admin/announcements/", {
    method: "POST",
    body: {
      title,
      body,
      building: buildingId ?? null,
      is_pinned: !!isPinned,
      expires_at: expiresAt ?? null,
    },
  });
}

export async function updateAnnouncement(id, fields) {
  return await fetchJson(`/admin/announcements/${id}/`, { method: "PATCH", body: fields });
}

export async function deleteAnnouncement(id) {
  return await fetchJson(`/admin/announcements/${id}/`, { method: "DELETE" });
}

export async function fetchComplaintDetail(id) {
  const raw = await fetchJson(`/complaints/${id}/`);
  return normalizeComplaint(raw);
}

export async function generateInviteLink(payload) {
  return fetchJson("/admin/invites/", {
    method: "POST",
    body: payload,
  });
}
