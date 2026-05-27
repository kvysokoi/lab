const BASE = "http://localhost:3000/api/v1";

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

export interface IncidentDTO {
  id: number;
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  user: string;
  owner_id?: number;
  comment?: string;
  comments?: string;
}

export interface CreateIncidentDTO {
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  user_id: number;
  comments?: string;
}

export interface UpdateIncidentDTO {
  severity: string;
  tag?: string;
  date?: string;
  reporter?: string;
  comments?: string;
}

export interface UserDTO {
  id: number;
  username: string;
  role: string;
}

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string>;
}

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...extra,
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }
  return headers;
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const signal = options.signal
      ? anySignal([options.signal as AbortSignal, controller.signal])
      : controller.signal;

    try {
      const res = await fetch(url, { ...options, signal });
      clearTimeout(timeout);

      const method = (options.method || "GET").toUpperCase();
      const isSafe = method === "GET" || method === "HEAD";
      if ((res.status === 429 || res.status === 503) && isSafe && i < retries) {
        await sleep(500 * (i + 1));
        continue;
      }

      if (!res.ok) {
        const err: ApiError = await res.json().catch(() => ({
          status: res.status,
          title: "Request failed",
          detail: `HTTP ${res.status}`,
        }));
        throw err;
      }

      if (res.status === 204) return undefined as T;
      return res.json() as Promise<T>;

    } catch (e: unknown) {
      clearTimeout(timeout);
      if (e instanceof Error && e.name === "AbortError") throw e;
      if (isApiError(e)) throw e;

      if (i < retries) {
        await sleep(500 * (i + 1));
        continue;
      }

      throw {
        status: 0,
        title: "Network error",
        detail: "Backend is unavailable. Check your connection.",
      } as ApiError;
    }
  }

  throw { status: 0, title: "Request failed", detail: "Max retries exceeded" } as ApiError;
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "title" in e;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) { controller.abort(); break; }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

export function login(username: string, password: string): Promise<{ token: string; user: UserDTO }> {
  return request(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function register(username: string, password: string): Promise<UserDTO> {
  return request(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
}

export function logout(): Promise<{ message: string }> {
  return request(`${BASE}/auth/logout`, {
    method: "POST",
    headers: getHeaders(),
  });
}

export function getIncidents(signal?: AbortSignal): Promise<IncidentDTO[]> {
  return request<IncidentDTO[]>(`${BASE}/incidents`, {
    signal,
    headers: getHeaders(),
  });
}

export function getIncidentById(id: number, signal?: AbortSignal): Promise<IncidentDTO> {
  return request<IncidentDTO>(`${BASE}/incidents/${id}`, {
    signal,
    headers: getHeaders(),
  });
}

export function createIncident(data: CreateIncidentDTO): Promise<{ id: number }> {
  return request<{ id: number }>(`${BASE}/incidents`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
}

export function updateIncident(id: number, data: UpdateIncidentDTO): Promise<{ message: string }> {
  return request<{ message: string }>(`${BASE}/incidents/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
}

export function deleteIncident(id: number): Promise<undefined> {
  return request<undefined>(`${BASE}/incidents/${id}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
}