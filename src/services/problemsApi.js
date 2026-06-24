const API_BASE = import.meta.env.VITE_API_URL || "/api";

let accessToken = null;

function setAccessToken(token) {
  accessToken = token;
  try {
    if (token) {
      sessionStorage.setItem("access_token", token);
    } else {
      sessionStorage.removeItem("access_token");
    }
  } catch (_) {}
}

try {
  accessToken = sessionStorage.getItem("access_token");
} catch (_) {}

export async function loginUser(email, password) {
  const res = await fetch(`${API_BASE}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).detail || "Invalid credentials");
  const data = await res.json();
  setAccessToken(data.access);
  return data;
}

export async function registerUser(data) {
  const res = await fetch(`${API_BASE}/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errBody = await res.json();
    throw new Error(JSON.stringify(errBody));
  }
  const tokenData = await res.json();
  setAccessToken(tokenData.access);
  return tokenData;
}

export async function refreshAccessToken() {
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    setAccessToken(null);
    throw new Error("AUTH_REQUIRED");
  }
  const data = await res.json();
  setAccessToken(data.access);
  return data;
}

export async function logoutUser() {
  await fetch(`${API_BASE}/auth/logout/`, {
    method: "POST",
    credentials: "include",
  });
  setAccessToken(null);
  window.location.reload();
}

export async function fetchBuildings() {
  const res = await fetch(`${API_BASE}/buildings/`);
  return res.json();
}

export async function fetchPlaces(buildingId) {
  const res = await fetch(`${API_BASE}/places/?building_id=${buildingId}`);
  return res.json();
}

async function fetchJson(path, { method = "GET", body } = {}) {
  const headers = {};
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const doFetch = () =>
    fetch(`${API_BASE}${path}`, {
      method,
      headers,
      credentials: "include",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    });

  let res = await doFetch();

  if (res.status === 401 && accessToken) {
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch {
      throw new Error("AUTH_REQUIRED");
    }
  }

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

export const CATEGORY_LABELS = {
  plumbing: "Сантехніка",
  electricity: "Електрика",
  furniture: "Меблі",
  internet: "Інтернет",
};

function normalizeComplaint(raw) {
  if (!raw) return null;
  const nowIso = new Date().toISOString();
  let status = raw.status || "pending";
  if (status === "published") status = "approved";
  if (status === "denied") status = "rejected";

  let safeRoom = "";
  let safeFloor = "";
  let safeBuilding = "4";

  if (raw.place && typeof raw.place === "object") {
    safeRoom = String(raw.place.place_name || "");
    if (raw.place.building) {
      safeBuilding = String(raw.place.building.name || raw.place.building.building_id || "4");
    }
  } else if (raw.room && typeof raw.room === "object") {
    safeRoom = String(raw.room.room_number || "");
    if (raw.room.floor) {
      safeFloor = String(raw.room.floor.floor_number || "");
      if (raw.room.floor.building) {
        safeBuilding = String(raw.room.floor.building.number || "4");
      }
    }
  } else {
    safeRoom = raw.room || "";
    safeFloor = raw.floor || "";
    safeBuilding = raw.building || "4";
  }

  return {
    id: raw.id ?? raw.complaint_id ?? Date.now(),
    title: raw.title ?? "Без назви",
    description: raw.description ?? "",
    category: raw.category?.name ?? raw.category ?? "plumbing",
    building: safeBuilding,
    room: safeRoom,
    placeName: safeRoom,
    floor: safeFloor,
    photoUrl: raw.photo_url ?? raw.photoUrl ?? null,
    status: status,
    votesCount: Number(raw.votesCount || raw.counter || 0),
    createdAt: raw.created_at || raw.createdAt || nowIso,
    user_id: raw.user?.id || raw.user?.user || raw.user || null,
  };
}

function sortByNew(a, b) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
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
  formData.append("building_number", problem.building);
  formData.append("floor_number", problem.floor);
  formData.append("room_number", problem.room);
  formData.append("room", problem.category);
  formData.append("title", problem.title);
  formData.append("description", problem.description);
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

export async function fetchApprovedComplaints(sort = "new") {
  try {
    const data = await fetchJson("/complaints/");
    if (Array.isArray(data)) {
      const approved = data
        .map(normalizeComplaint)
        .filter((c) => c && c.status === "approved");
      if (sort === "popular")
        approved.sort((a, b) => b.votesCount - a.votesCount);
      else approved.sort(sortByNew);
      return approved;
    }
  } catch (e) {
    console.warn("Fetch error:", e);
  }
  return [];
}

export async function fetchPendingComplaints() {
  try {
    const data = await fetchJson("/complaints/");
    if (Array.isArray(data))
      return data
        .map(normalizeComplaint)
        .filter((c) => c && c.status === "pending")
        .sort(sortByNew);
  } catch (e) {
    console.warn(e);
  }
  return [];
}

export async function fetchRejectedComplaints() {
  try {
    const data = await fetchJson("/complaints/");
    if (Array.isArray(data))
      return data
        .map(normalizeComplaint)
        .filter((c) => c && c.status === "rejected")
        .sort(sortByNew);
  } catch (e) {
    console.warn(e);
  }
  return [];
}

export async function fetchComplaintsByStatus(targetStatus) {
  try {
    const data = await fetchJson("/complaints/");
    if (Array.isArray(data))
      return data
        .map(normalizeComplaint)
        .filter((c) => c && c.status === targetStatus)
        .sort(sortByNew);
  } catch (e) {
    console.warn(e);
  }
  return [];
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

export async function approveComplaint(id) {
  return updateComplaintStatus(id, "approved");
}

export async function voteComplaint(id) {
  const res = await fetchJson(`/complaints/${id}/counter/`, {
    method: "PATCH",
  });
  return { id, votesCount: res.counter };
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

export async function updateUserProfile(data) {
  const formData = new FormData();
  if (data.first_name) formData.append("first_name", data.first_name);
  if (data.last_name) formData.append("last_name", data.last_name);
  if (data.email) formData.append("email", data.email);
  if (data.photoFile instanceof File) formData.append("photo_url", data.photoFile);

  return await fetchJson("/profile/", { method: "PATCH", body: formData });
}

export async function changeUserRoom(building, floor, room) {
  return await fetchJson("/profile/change-room/", {
    method: "PATCH",
    body: {
      building_number: parseInt(building),
      floor_number: parseInt(floor),
      room_number: String(room),
    },
  });
}
