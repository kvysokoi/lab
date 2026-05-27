import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  login,
  logout,
  register,
  setToken,
  getToken,
  IncidentDTO,
  ApiError,
  UserDTO,
} from "./api.js";

let allIncidents: IncidentDTO[] = [];
let editingId: number | null = null;
let loadController: AbortController | null = null;
let currentSort: string = "";
let sortAsc: boolean = true;
let currentUser: UserDTO | null = null;

const authSection    = document.getElementById("authSection")       as HTMLElement;
const appSection     = document.getElementById("appSection")        as HTMLElement;
const loginForm      = document.getElementById("loginForm")         as HTMLFormElement;
const registerForm   = document.getElementById("registerForm")      as HTMLFormElement;
const logoutBtn      = document.getElementById("logoutBtn")         as HTMLButtonElement;
const currentUserEl  = document.getElementById("currentUser")       as HTMLElement;
const authError      = document.getElementById("authError")         as HTMLElement;
const showRegisterBtn= document.getElementById("showRegisterBtn")   as HTMLButtonElement;
const showLoginBtn   = document.getElementById("showLoginBtn")      as HTMLButtonElement;
const loginPanel     = document.getElementById("loginPanel")        as HTMLElement;
const registerPanel  = document.getElementById("registerPanel")     as HTMLElement;

const form           = document.getElementById("incidentForm")      as HTMLFormElement;
const titleInput     = document.getElementById("titleInput")        as HTMLInputElement;
const severitySelect = document.getElementById("severitySelect")    as HTMLSelectElement;
const statusSelect   = document.getElementById("statusSelect")      as HTMLSelectElement;
const dateInput      = document.getElementById("dateInput")         as HTMLInputElement;
const submitBtn      = document.getElementById("submitBtn")         as HTMLButtonElement;
const tableBody      = document.getElementById("incidentTableBody") as HTMLTableSectionElement;
const searchInput    = document.getElementById("searchInput")       as HTMLInputElement;
const filterSeverity = document.getElementById("filterSeverity")    as HTMLSelectElement;
const sortSelect     = document.getElementById("sortSelect")        as HTMLSelectElement;

const titleError    = document.getElementById("titleError")    as HTMLElement;
const severityError = document.getElementById("severityError") as HTMLElement;
const statusError   = document.getElementById("statusError")   as HTMLElement;
const dateError     = document.getElementById("dateError")     as HTMLElement;

let statusEl = document.getElementById("statusMsg") as HTMLElement | null;
if (!statusEl) {
  statusEl = document.createElement("p");
  statusEl.id = "statusMsg";
  statusEl.style.cssText = "text-align:center;padding:8px;font-weight:bold;";
  document.querySelector("main")?.prepend(statusEl);
}

function setStatus(msg: string, color = "#333") {
  if (statusEl) { statusEl.textContent = msg; statusEl.style.color = color; }
}

function showAuth() {
  authSection.style.display = "block";
  appSection.style.display  = "none";
}

function showApp(user: UserDTO) {
  currentUser = user;
  authSection.style.display  = "none";
  appSection.style.display   = "block";
  currentUserEl.textContent  = `👤 ${user.username} (${user.role})`;
  load();
}

function clearErrors() {
  [titleError, severityError, statusError, dateError].forEach(el => el.textContent = "");
  [titleInput, severitySelect, statusSelect, dateInput].forEach(el =>
    el.style.borderColor = ""
  );
}

function showFieldError(el: HTMLElement, input: HTMLElement, msg: string) {
  el.textContent = msg;
  input.style.borderColor = "red";
}

function isApiError(e: unknown): e is ApiError {
  return typeof e === "object" && e !== null && "status" in e && "title" in e;
}

function formatSeverity(s: string): string {
  const map: Record<string, string> = { low: "Low", medium: "Medium", high: "High" };
  return map[s?.toLowerCase()] ?? s ?? "—";
}

function escHtml(str: string): string {
  return String(str).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

showRegisterBtn?.addEventListener("click", () => {
  loginPanel.style.display    = "none";
  registerPanel.style.display = "block";
  authError.textContent = "";
});

showLoginBtn?.addEventListener("click", () => {
  loginPanel.style.display    = "block";
  registerPanel.style.display = "none";
  authError.textContent = "";
});

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";

  const username = (document.getElementById("loginUsername") as HTMLInputElement).value.trim();
  const password = (document.getElementById("loginPassword") as HTMLInputElement).value;

  try {
    const res = await login(username, password);
    setToken(res.token);
    showApp(res.user);
  } catch (e: unknown) {
    authError.textContent = isApiError(e) ? e.detail : "Login failed";
  }
});

registerForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  authError.textContent = "";

  const username = (document.getElementById("regUsername") as HTMLInputElement).value.trim();
  const password = (document.getElementById("regPassword") as HTMLInputElement).value;

  try {
    await register(username, password);
    const res = await login(username, password);
    setToken(res.token);
    showApp(res.user);
  } catch (e: unknown) {
    authError.textContent = isApiError(e) ? e.detail : "Registration failed";
  }
});

logoutBtn?.addEventListener("click", async () => {
  try {
    await logout();
  } finally {
    setToken(null);
    currentUser = null;
    showAuth();
  }
});

const colLabels: Record<string, string> = {
  title: "Назва", severity: "Критичність", status: "Статус", date: "Дата",
};

function updateHeaders() {
  document.querySelectorAll("th[data-sort]").forEach(th => {
    const col = (th as HTMLElement).dataset.sort ?? "";
    const arrow = col === currentSort ? (sortAsc ? " ↑" : " ↓") : " ↕";
    th.textContent = (colLabels[col] ?? col) + arrow;
  });
}

function render(data: IncidentDTO[]): void {
  updateHeaders();

  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999">Немає даних</td></tr>`;
    return;
  }

  tableBody.innerHTML = data.map(inc => {
    const sev = formatSeverity(inc.severity);
    const isOwner = !inc.owner_id || inc.owner_id === currentUser?.id;
    const actions = isOwner
      ? `<button onclick="startEdit(${inc.id})">✏️ Редагувати</button>
         <button onclick="confirmDelete(${inc.id})" style="background:#e74c3c">🗑 Видалити</button>`
      : `<span style="color:#999;font-size:12px">Тільки перегляд</span>`;

    return `
      <tr>
        <td>${escHtml(inc.tag)}</td>
        <td class="severity-${sev}">${sev}</td>
        <td>${escHtml(inc.reporter ?? "—")}</td>
        <td>${escHtml(inc.date ?? "—")}</td>
        <td>${actions}</td>
      </tr>`;
  }).join("");
}

async function load(): Promise<void> {
  if (loadController) loadController.abort();
  loadController = new AbortController();

  setStatus("Завантаження...", "#4a90e2");
  tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center">Завантаження...</td></tr>`;
  submitBtn.disabled = true;

  try {
    const data = await getIncidents(loadController.signal);
    allIncidents = data;
    applyFilters();
    setStatus(`Завантажено ${data.length} записів`, "green");
  } catch (e: unknown) {
    if (e instanceof Error && e.name === "AbortError") {
      setStatus("Запит скасовано", "#999");
      return;
    }
    if (isApiError(e) && e.status === 401) {
      setStatus("Сесія закінчилась", "red");
      setToken(null);
      showAuth();
      return;
    }
    setStatus(isApiError(e) ? `Помилка: ${e.detail}` : "Бекенд недоступний", "red");
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red">Помилка завантаження</td></tr>`;
  } finally {
    submitBtn.disabled = false;
  }
}

function applyFilters(): void {
  const search     = searchInput.value.toLowerCase();
  const sev        = filterSeverity.value.toLowerCase();
  const dropSort   = sortSelect.value;
  const activeSort = dropSort || currentSort;
  const dir        = sortAsc ? 1 : -1;

  let result = allIncidents.filter(i => {
    const matchSearch = !search || i.tag.toLowerCase().includes(search);
    const matchSev    = !sev    || i.severity.toLowerCase() === sev;
    return matchSearch && matchSev;
  });

  if (activeSort === "date") {
    result = [...result].sort((a, b) => a.date.localeCompare(b.date) * (dropSort ? 1 : dir));
  } else if (activeSort === "severity") {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    result = [...result].sort((a, b) =>
      ((order[a.severity.toLowerCase()] ?? 9) - (order[b.severity.toLowerCase()] ?? 9)) * (dropSort ? 1 : dir)
    );
  } else if (activeSort === "title") {
    result = [...result].sort((a, b) => a.tag.localeCompare(b.tag) * dir);
  } else if (activeSort === "status") {
    result = [...result].sort((a, b) => (a.reporter ?? "").localeCompare(b.reporter ?? "") * dir);
  }

  render(result);
}

searchInput.oninput     = applyFilters;
filterSeverity.onchange = applyFilters;
sortSelect.onchange     = () => { currentSort = ""; applyFilters(); };

document.querySelectorAll("th[data-sort]").forEach(th => {
  th.addEventListener("click", () => {
    const col = (th as HTMLElement).dataset.sort ?? "";
    if (currentSort === col) { sortAsc = !sortAsc; } else { currentSort = col; sortAsc = true; }
    sortSelect.value = "";
    applyFilters();
  });
});

function validateForm(): boolean {
  clearErrors();
  let valid = true;

  if (!titleInput.value.trim()) {
    showFieldError(titleError, titleInput, "Назва обов'язкова"); valid = false;
  } else if (titleInput.value.trim().length < 2) {
    showFieldError(titleError, titleInput, "Мінімум 2 символи"); valid = false;
  }
  if (!severitySelect.value) {
    showFieldError(severityError, severitySelect, "Оберіть критичність"); valid = false;
  }
  if (!statusSelect.value) {
    showFieldError(statusError, statusSelect, "Оберіть статус"); valid = false;
  }
  if (!dateInput.value) {
    showFieldError(dateError, dateInput, "Дата обов'язкова"); valid = false;
  }

  return valid;
}

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    tag:      titleInput.value.trim(),
    severity: severitySelect.value,
    reporter: statusSelect.value,
    date:     dateInput.value,
    user_id:  currentUser?.id ?? 1,
    comments: "",
  };

  submitBtn.disabled = true;
  submitBtn.textContent = editingId ? "Зберігаємо..." : "Додаємо...";

  try {
    if (editingId !== null) {
      await updateIncident(editingId, { severity: payload.severity, tag: payload.tag, date: payload.date, reporter: payload.reporter });
      setStatus("Інцидент оновлено", "green");
      cancelEdit();
    } else {
      await createIncident(payload);
      setStatus("Інцидент створено", "green");
    }
    form.reset();
    clearErrors();
    await load();
  } catch (e: unknown) {
    if (isApiError(e)) {
      setStatus(`${e.title}: ${e.detail}`, "red");
      if (e.errors) {
        if (e.errors.tag)      showFieldError(titleError,    titleInput,     e.errors.tag);
        if (e.errors.severity) showFieldError(severityError, severitySelect, e.errors.severity);
        if (e.errors.date)     showFieldError(dateError,     dateInput,      e.errors.date);
        if (e.errors.reporter) showFieldError(statusError,   statusSelect,   e.errors.reporter);
      }
    } else {
      setStatus("Помилка збереження", "red");
    }
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = editingId ? "Зберегти" : "Додати";
  }
});

function startEdit(id: number): void {
  const inc = allIncidents.find(i => i.id === id);
  if (!inc) return;

  editingId = id;
  titleInput.value      = inc.tag;
  severitySelect.value  = formatSeverity(inc.severity);
  dateInput.value       = inc.date;
  submitBtn.textContent = "Зберегти";

  if (!document.getElementById("cancelBtn")) {
    const btn = document.createElement("button");
    btn.id = "cancelBtn"; btn.type = "button";
    btn.textContent = "Скасувати";
    btn.style.background = "#999";
    btn.onclick = cancelEdit;
    submitBtn.after(btn);
  }

  titleInput.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function cancelEdit(): void {
  editingId = null;
  form.reset();
  clearErrors();
  submitBtn.textContent = "Додати";
  document.getElementById("cancelBtn")?.remove();
}

async function confirmDelete(id: number): Promise<void> {
  if (!confirm("Видалити цей інцидент?")) return;

  try {
    await deleteIncident(id);
    setStatus("Інцидент видалено", "green");
    await load();
  } catch (e: unknown) {
    setStatus(isApiError(e) ? `${e.title}: ${e.detail}` : "Помилка видалення", "red");
  }
}

declare global {
  interface Window {
    startEdit:     (id: number) => void;
    confirmDelete: (id: number) => Promise<void>;
  }
}
window.startEdit     = startEdit;
window.confirmDelete = confirmDelete;

showAuth();

export {};