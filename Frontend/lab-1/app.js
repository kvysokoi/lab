const state = {
    incidents: [],
    nextId: 1,
    editingId: null,
    sortColumn: null, 
    sortOrder: 'asc' 
};

const form = document.getElementById("incidentForm");
const tableBody = document.getElementById("incidentTableBody");
const searchInput = document.getElementById("searchInput");
const filterSeverity = document.getElementById("filterSeverity");
const submitBtn = document.getElementById("submitBtn");

loadFromStorage();

document.querySelector("thead").addEventListener("click", function(e) {
    const column = e.target.dataset.sort;
    if (!column) return; 
    if (state.sortColumn === column) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
        state.sortColumn = column;
        state.sortOrder = 'asc';
    }

    render();
});

form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearErrors();

    const dto = {
        title: document.getElementById("titleInput").value.trim(),
        severity: document.getElementById("severitySelect").value,
        status: document.getElementById("statusSelect").value,
        date: document.getElementById("dateInput").value
    };

    if (!validate(dto)) return;

    if (state.editingId === null) {
        dto.id = state.nextId++;
        state.incidents.push(dto);
    } else {
        const index = state.incidents.findIndex(i => i.id === state.editingId);
        state.incidents[index] = { ...dto, id: state.editingId };
        state.editingId = null;
        submitBtn.textContent = "Додати";
    }

    saveToStorage();
    render();
    form.reset();
    document.getElementById("titleInput").focus();
});

tableBody.addEventListener("click", function (e) {
    const id = Number(e.target.dataset.id);

    if (e.target.classList.contains("deleteBtn")) {
        state.incidents = state.incidents.filter(i => i.id !== id);
        saveToStorage();
        render();
    }

    if (e.target.classList.contains("editBtn")) {
        clearErrors();
        const incident = state.incidents.find(i => i.id === id);

        document.getElementById("titleInput").value = incident.title;
        document.getElementById("severitySelect").value = incident.severity;
        document.getElementById("statusSelect").value = incident.status;
        document.getElementById("dateInput").value = incident.date;

        state.editingId = id;
        submitBtn.textContent = "Зберегти";
    }
});

searchInput.addEventListener("input", render);
filterSeverity.addEventListener("change", render);

function render() {
    tableBody.innerHTML = "";
    let data = [...state.incidents];

    const searchValue = searchInput.value.toLowerCase();
    if (searchValue) {
        data = data.filter(i => i.title.toLowerCase().includes(searchValue));
    }

    if (filterSeverity.value) {
        data = data.filter(i => i.severity === filterSeverity.value);
    }

    if (state.sortColumn) {
        data.sort((a, b) => {
            let valA = a[state.sortColumn];
            let valB = b[state.sortColumn];

            if (state.sortColumn === 'severity') {
                const order = { Low: 1, Medium: 2, High: 3 };
                valA = order[valA];
                valB = order[valB];
            }
            
            if (state.sortColumn === 'date') {
                valA = new Date(valA);
                valB = new Date(valB);
            }

            if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    data.forEach(function (item) {
        tableBody.innerHTML += `
        <tr>
            <td>${item.title}</td>
            <td>${item.severity}</td>
            <td>${item.status}</td>
            <td>${item.date}</td>
            <td>
                <button data-id="${item.id}" class="editBtn">Редагувати</button>
                <button data-id="${item.id}" class="deleteBtn">Видалити</button>
            </td>
        </tr>
        `;
    });
}

function validate(dto) {
    let isValid = true;
    if (dto.title === "") {
        showError("titleInput", "titleError", "Поле обов'язкове");
        isValid = false;
    }
    if (dto.severity === "") {
        showError("severitySelect", "severityError", "Оберіть значення");
        isValid = false;
    }
    if (dto.status === "") {
        showError("statusSelect", "statusError", "Оберіть статус");
        isValid = false;
    }
    if (dto.date === "") {
        showError("dateInput", "dateError", "Вкажіть дату");
        isValid = false;
    }
    return isValid;
}

function showError(inputId, errorId, message) {
    document.getElementById(inputId).classList.add("invalid");
    document.getElementById(errorId).innerText = message;
}

function clearErrors() {
    document.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    document.querySelectorAll(".error-text").forEach(el => el.innerText = "");
}

function saveToStorage() {
    localStorage.setItem("incidents", JSON.stringify(state.incidents));
}

function loadFromStorage() {
    const data = localStorage.getItem("incidents");
    if (data) {
        state.incidents = JSON.parse(data);
        state.nextId = state.incidents.length > 0
            ? Math.max(...state.incidents.map(i => i.id)) + 1
            : 1;
        render();
    }
}