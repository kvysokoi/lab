import {
  getIncidents,
  createIncident,
  updateIncident,
  deleteIncident,
  IncidentDTO,
  ApiError,
} from "./api.js";

const form           = document.getElementById("incidentForm")    as HTMLFormElement;
const titleInput     = document.getElementById("titleInput")      as HTMLInputElement;
const severitySelect = document.getElementById("severitySelect")  as HTMLSelectElement;
const statusSelect   = document.getElementById("statusSelect")    as HTMLSelectElement;
const dateInput      = document.getElementById("dateInput")       as HTMLInputElement;
const submitBtn      = document.getElementById("submitBtn")       as HTMLButtonElement;
const tableBody      = document.getElementById("incidentTableBody") as HTMLTableSectionElement;
const searchInput    = document.getElementById("searchInput")     as HTMLInputElement;
const filterSeverity = document.getElementById("filterSeverity")  as HTMLSelectElement;
const sortSelect     = document.getElementById("sortSelect")      as HTMLSelectElement;

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

let allIncidents: IncidentDTO[] = [];
let editingId: number | null = null;
let loadController: AbortController | null = null;

function setStatus(msg: string, color = "#333") {
  if (statusEl) { statusEl.textContent = msg; statusEl.style.color = color; }
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

function render(data: IncidentDTO[]): void {
  if (data.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#999">Немає даних</td></tr>`;
    return;
  }

  tableBody.innerHTML = data.map(inc => {
    const sev = formatSeverity(inc.severity);
    return `
      <tr>
        <td>${escHtml(inc.tag)}</td>
        <td class="severity-${sev}">${sev}</td>
        <td>${escHtml(inc.reporter ?? "—")}</td>
        <td>${escHtml(inc.date ?? "—")}</td>
        <td>
          <button onclick="startEdit(${inc.id})">✏️ Редагувати</button>
          <button onclick="confirmDelete(${inc.id})" style="background:#e74c3c">🗑 Видалити</button>
        </td>
      </tr>`;
  }).join("");
}

function escHtml(str: string): string {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
    if (isApiError(e)) {
      setStatus(`Помилка: ${e.detail}`, "red");
    } else {
      setStatus("Бекенд недоступний", "red");
    }
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:red">Помилка завантаження</td></tr>`;
  } finally {
    submitBtn.disabled = false;
  }
}

function applyFilters(): void {
  const search = searchInput.value.toLowerCase();
  const sev    = filterSeverity.value.toLowerCase();
  const sort   = sortSelect.value;

  let result = allIncidents.filter(i => {
    const matchSearch = !search || i.tag.toLowerCase().includes(search);
    const matchSev    = !sev    || i.severity.toLowerCase() === sev;
    return matchSearch && matchSev;
  });

  if (sort === "date") {
    result = [...result].sort((a, b) => a.date.localeCompare(b.date));
  } else if (sort === "severity") {
    const order: Record<string, number> = { high: 0, medium: 1, low: 2 };
    result = [...result].sort((a, b) =>
      (order[a.severity.toLowerCase()] ?? 9) - (order[b.severity.toLowerCase()] ?? 9)
    );
  }

  render(result);
}

searchInput.oninput  = applyFilters;
filterSeverity.onchange = applyFilters;
sortSelect.onchange  = applyFilters;

function validateForm(): boolean {
  clearErrors();
  let valid = true;

  if (!titleInput.value.trim()) {
    showFieldError(titleError, titleInput, "Назва обов'язкова");
    valid = false;
  } else if (titleInput.value.trim().length < 2) {
    showFieldError(titleError, titleInput, "Мінімум 2 символи");
    valid = false;
  }

  if (!severitySelect.value) {
    showFieldError(severityError, severitySelect, "Оберіть критичність");
    valid = false;
  }

  if (!statusSelect.value) {
    showFieldError(statusError, statusSelect, "Оберіть статус");
    valid = false;
  }

  if (!dateInput.value) {
    showFieldError(dateError, dateInput, "Дата обов'язкова");
    valid = false;
  }

  return valid;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    tag:      titleInput.value.trim(),
    severity: severitySelect.value,
    reporter: statusSelect.value,   // поле "статус" мапимо на reporter
    date:     dateInput.value,
    user_id:  1,
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
        if (e.errors.tag)      showFieldError(titleError, titleInput, e.errors.tag);
        if (e.errors.severity) showFieldError(severityError, severitySelect, e.errors.severity);
        if (e.errors.date)     showFieldError(dateError, dateInput, e.errors.date);
        if (e.errors.reporter) showFieldError(statusError, statusSelect, e.errors.reporter);
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
  titleInput.value = inc.tag;
  severitySelect.value = formatSeverity(inc.severity);
  dateInput.value = inc.date;
  submitBtn.textContent = "Зберегти";

  if (!document.getElementById("cancelBtn")) {
    const btn = document.createElement("button");
    btn.id = "cancelBtn";
    btn.type = "button";
    btn.textContent = "Скасувати";
    btn.style.background = "#999";
    btn.onclick = cancelEdit;
    submitBtn.after(btn);
  }

  titleInput.focus();
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
    if (isApiError(e)) {
      setStatus(`${e.title}: ${e.detail}`, "red");
    } else {
      setStatus("Помилка видалення", "red");
    }
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

load();

export {};