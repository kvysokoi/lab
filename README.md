# Лабораторна робота №4 — Інтеграція Frontend і Backend

## Структура проекту

```
lab/
├── Backend/          # Express + SQLite API
│   ├── controllers/
│   ├── db/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   └── server.js
└── Frontend/
    └── lab-1/        # Vite + TypeScript
        ├── api.ts
        ├── app.ts
        ├── index.html
        └── styles.css
```

## Як запустити

### 1. Бекенд

```bash
cd Backend
node server.js
```

Бекенд запускається на `http://localhost:3000`

### 2. Фронтенд

```bash
cd Frontend/lab-1
npm install
npm run dev
```

Фронтенд запускається на `http://localhost:5173`

---

## API ендпоінти

| Метод  | URL                                      | Опис                        |
|--------|------------------------------------------|-----------------------------|
| GET    | /api/v1/incidents                        | Список всіх інцидентів      |
| GET    | /api/v1/incidents/:id                    | Деталі інциденту            |
| POST   | /api/v1/incidents                        | Створити інцидент           |
| PUT    | /api/v1/incidents/:id                    | Оновити інцидент            |
| DELETE | /api/v1/incidents/:id                    | Видалити інцидент           |
| GET    | /api/v1/incidents/stats                  | Статистика                  |
| GET    | /api/v1/incidents/search?severity=high   | Пошук за критичністю        |
| GET    | /api/v1/users                            | Список користувачів         |
| POST   | /api/v1/users                            | Створити користувача        |

---

## Сценарії перевірки

### Сценарій 1 — GET список інцидентів

```bash
curl http://localhost:3000/api/v1/incidents
```

Очікувана відповідь: масив об'єктів зі статусом 200.

---

### Сценарій 2 — POST створення інциденту

```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-05-19",
    "tag": "ransomware",
    "severity": "high",
    "reporter": "admin",
    "user_id": 1,
    "comments": "test"
  }'
```

Очікувана відповідь: `{ "id": <новий_id> }` зі статусом 201.

---

### Сценарій 3 — Помилка валідації (400)

```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -d '{ "tag": "x" }'
```

Очікувана відповідь:
```json
{
  "status": 400,
  "title": "Validation failed",
  "detail": "One or more fields are invalid",
  "errors": {
    "severity": "Severity is required",
    "date": "Date is required",
    "reporter": "Reporter must be at least 2 characters"
  }
}
```

---

### Сценарій 4 — GET неіснуючий інцидент (404)

```bash
curl http://localhost:3000/api/v1/incidents/99999
```

Очікувана відповідь:
```json
{
  "status": 404,
  "title": "Not found",
  "detail": "Incident 99999 not found"
}
```

---

### Сценарій 5 — Перевірка CORS

Відкрити браузер на `http://localhost:5173` — запити до бекенду мають проходити без помилок CORS у консолі.

---

### Сценарій 6 — Бекенд недоступний (мережева помилка)

1. Зупинити бекенд (`Ctrl+C` в терміналі бекенду)
2. Відкрити `http://localhost:5173`
3. UI показує повідомлення **"Бекенд недоступний"** — сторінка не ламається

---

### Сценарій 7 — DELETE видалення інциденту

```bash
curl -X DELETE http://localhost:3000/api/v1/incidents/1
```

Очікувана відповідь: статус 204 (без тіла).

---

### Сценарій 8 — PUT оновлення інциденту

```bash
curl -X PUT http://localhost:3000/api/v1/incidents/2 \
  -H "Content-Type: application/json" \
  -d '{ "severity": "low" }'
```

Очікувана відповідь: `{ "message": "Updated" }` зі статусом 200.

---

## Правила сумісності DTO

1. **Не перейменовувати поля** — якщо фронтенд читає `severity`, поле не можна перейменувати на `level`.
2. **Не видаляти поля** — якщо фронтенд використовує `reporter`, це поле залишається назавжди.
3. **Нові поля — лише необов'язкові** — можна додати нове поле з дефолтним значенням, не ламаючи старий фронтенд.

## Версійність API

Всі ендпоінти мають префікс `/api/v1/` — при змінах контракту буде створено `/api/v2/` без видалення старої версії.