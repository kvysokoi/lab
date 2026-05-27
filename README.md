# Лабораторна робота — Трекер інцидентів кібербезпеки

## Структура проекту

```
lab/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── incidentsController.js
│   ├── db/
│   │   ├── db.js
│   │   ├── schema.sql
│   │   └── seed.js
│   ├── middleware/
│   │   ├── authMiddleware.js
│   │   ├── errorHandler.js
│   │   ├── securityHeaders.js
│   │   └── validateIncident.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── incidents.js
│   │   └── users.js
│   ├── services/
│   │   └── incidentsServise.js
│   └── server.js
└── Frontend/
    └── lab-1/
        ├── api.ts
        ├── app.ts
        ├── index.html
        └── styles.css
```

---

## Як запустити

### 1. Бекенд
```bash
cd Backend
npm install
npm start
```
Бекенд запускається на `http://localhost:3000`

### 2. Фронтенд
```bash
cd Frontend/lab-1
npm install
npm run dev
```
Фронтенд запускається на `http://localhost:5173`

### Тестові акаунти
| Логін | Пароль | Роль |
|-------|--------|------|
| admin | admin123 | admin |
| student1 | user123 | user |
| student2 | user123 | user |

---

## API ендпоінти

### Auth (публічні)
| Метод | URL | Опис |
|-------|-----|------|
| POST | /api/v1/auth/register | Реєстрація |
| POST | /api/v1/auth/login | Логін → JWT токен |
| POST | /api/v1/auth/logout | Логаут (інвалідація токена) |
| GET  | /api/v1/auth/me | Поточний користувач |

### Incidents (захищені — потрібен Bearer токен)
| Метод | URL | Опис |
|-------|-----|------|
| GET | /api/v1/incidents | Список всіх інцидентів |
| GET | /api/v1/incidents/:id | Деталі інциденту |
| POST | /api/v1/incidents | Створити інцидент |
| PUT | /api/v1/incidents/:id | Оновити інцидент |
| DELETE | /api/v1/incidents/:id | Видалити інцидент |
| GET | /api/v1/incidents/stats | Статистика |
| GET | /api/v1/incidents/search?severity=high | Пошук за критичністю |

---

## Сценарії перевірки

### Крок 0 — Отримати токен (потрібен для всіх запитів)
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student1","password":"user123"}'
```
Зберегти `token` зі відповіді. Далі підставляти як `<TOKEN>`.

---

### Сценарій 1 — GET список інцидентів
```bash
curl http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer <TOKEN>"
```
Очікувана відповідь: масив об'єктів зі статусом 200.

---

### Сценарій 2 — POST створення інциденту
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "date": "2026-05-19",
    "tag": "ransomware",
    "severity": "high",
    "reporter": "student1",
    "user_id": 1
  }'
```
Очікувана відповідь: `{ "id": <новий_id> }` зі статусом 201.

---

### Сценарій 3 — Помилка валідації (400)
```bash
curl -X POST http://localhost:3000/api/v1/incidents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"tag":"x"}'
```
Очікувана відповідь:
```json
{
  "status": 400,
  "title": "Validation failed",
  "detail": "One or more fields are invalid",
  "errors": {
    "severity": "Severity is required",
    "date": "Date is required"
  }
}
```

---

### Сценарій 4 — Без токена (401)
```bash
curl http://localhost:3000/api/v1/incidents
```
Очікувана відповідь:
```json
{ "status": 401, "title": "Unauthorized", "detail": "Authorization token is required" }
```

---

### Сценарій 5 — IDOR перевірка (403)
```bash
# Логін як student2
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student2","password":"user123"}'
# Зберегти як TOKEN2

# Спроба видалити інцидент student1 (id=1)
curl -X DELETE http://localhost:3000/api/v1/incidents/1 \
  -H "Authorization: Bearer <TOKEN2>"
```
Очікувана відповідь:
```json
{ "status": 403, "title": "Forbidden", "detail": "You do not have access to this incident" }
```

---

### Сценарій 6 — Security headers
```bash
curl -I http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer <TOKEN>"
```
Очікувані заголовки:
```
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
(X-Powered-By — відсутній)
```

---

### Сценарій 7 — Rate limit на логін (429)
```bash
# Виконати 6 разів підряд з невірним паролем
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}'
```
Після 5-ї спроби відповідь:
```json
{ "status": 429, "title": "Too Many Requests", "detail": "Too many login attempts. Try again in 15 minutes." }
```

---

### Сценарій 8 — Logout інвалідує токен
```bash
# Logout
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer <TOKEN>"

# Використати токен після logout
curl http://localhost:3000/api/v1/incidents \
  -H "Authorization: Bearer <TOKEN>"
```
Очікувана відповідь:
```json
{ "status": 401, "title": "Unauthorized", "detail": "Token has been revoked" }
```

---

## Правила сумісності DTO

1. **Не перейменовувати поля** — якщо фронтенд читає `severity`, поле не можна перейменувати на `level`.
2. **Не видаляти поля** — якщо фронтенд використовує `reporter`, це поле залишається назавжди.
3. **Нові поля — лише необов'язкові** — можна додати нове поле з дефолтним значенням, не ламаючи старий фронтенд.

## Версійність API

Всі ендпоінти мають префікс `/api/v1/` — при змінах контракту буде створено `/api/v2/` без видалення старої версії.