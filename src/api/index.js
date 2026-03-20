async function request(method, path, body) {
  const res = await fetch(path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const get  = (path)        => request("GET",    path);
const post = (path, body)  => request("POST",   path, body);
const patch= (path, body)  => request("PATCH",  path, body);
const del  = (path)        => request("DELETE", path);

export const auth = {
  login:  (credentials) => post("/api/auth/login", credentials),
  logout: ()            => post("/api/auth/logout"),
  me:     ()            => get("/api/auth/me"),
};

export const users = {
  list:   ()           => get("/api/users"),
  create: (data)       => post("/api/users", data),
  update: (id, data)   => patch(`/api/users/${id}`, data),
};

export const patients = {
  list:   (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return get(`/api/patients${q ? "?" + q : ""}`);
  },
  create: (data)        => post("/api/patients", data),
  update: (id, data)    => patch(`/api/patients/${id}`, data),
  remove: (id)          => del(`/api/patients/${id}`),
};

export const scripts = {
  list:    ()           => get("/api/scripts"),
  create:  (data)       => post("/api/scripts", data),
  update:  (id, data)   => patch(`/api/scripts/${id}`, data),
  reorder: (ids)        => post("/api/scripts/reorder", { ids }),
  remove:  (id)         => del(`/api/scripts/${id}`),
};

export const content = {
  all:    ()           => get("/api/content"),
  get:    (key)        => get(`/api/content/${key}`),
  set:    (key, value) => request("PUT", `/api/content/${key}`, value),
};

export const checklist = {
  list:           ()             => get("/api/checklist"),
  createSection:  (data)         => post("/api/checklist/sections", data),
  updateSection:  (id, data)     => patch(`/api/checklist/sections/${id}`, data),
  deleteSection:  (id)           => del(`/api/checklist/sections/${id}`),
  createItem:     (secId, data)  => post(`/api/checklist/sections/${secId}/items`, data),
  updateItem:     (id, data)     => patch(`/api/checklist/items/${id}`, data),
  deleteItem:     (id)           => del(`/api/checklist/items/${id}`),
};
