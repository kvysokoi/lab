const BASE = "http://localhost:3000/api/v1";

// DTO типи (узгоджені з бекендом)
export interface IncidentDTO {
  id: number;
  date: string;
  tag: string;
  severity: string;
  reporter: string;
  user: string;
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

export interface ApiError {
  status: number;
  title: string;
  detail: string;
  errors?: Record<string, string>;
}

// Базова функція з таймаутом та retry лише для 429/503
async function request<T>(
  url: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    // Якщо ззовні передали signal — слухаємо обидва
    const signal = options.signal
      ? anySignal([options.signal as AbortSignal, controller.signal])
      : controller.signal;

    try {
      const res = await fetch(url, { ...options, signal });
      clearTimeout(timeout);

      // Retry лише для safe-методів при 429/503
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

      // 204 No Content
      if (res.status === 204) return undefined as T;

      return res.json() as Promise<T>;
    } catch (e: unknown) {
      clearTimeout(timeout);

      // AbortError — або таймаут, або скасування користувачем
      if (e instanceof Error && e.name === "AbortError") throw e;

      // Якщо це наша ApiError — пробрасуємо далі
      if (isApiError(e)) throw e;

      // Мережева помилка — retry
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

// Об'єднує два AbortSignal (браузерний API лише з одним сигналом)
function anySignal(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  for (const s of signals) {
    if (s.aborted) { controller.abort(); break; }
    s.addEventListener("abort", () => controller.abort(), { once: true });
  }
  return controller.signal;
}

// API методи
export function getIncidents(signal?: AbortSignal): Promise<IncidentDTO[]> {
  return request<IncidentDTO[]>(`${BASE}/incidents`, { signal });
}

export function getIncidentById(id: number, signal?: AbortSignal): Promise<IncidentDTO> {
  return request<IncidentDTO>(`${BASE}/incidents/${id}`, { signal });
}

export function createIncident(data: CreateIncidentDTO): Promise<{ id: number }> {
  return request<{ id: number }>(`${BASE}/incidents`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function updateIncident(id: number, data: UpdateIncidentDTO): Promise<{ message: string }> {
  return request<{ message: string }>(`${BASE}/incidents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function deleteIncident(id: number): Promise<undefined> {
  return request<undefined>(`${BASE}/incidents/${id}`, { method: "DELETE" });
}