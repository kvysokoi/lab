# Лабораторна робота №2
## Розробка REST API без використання бази даних

### Опис роботи
У даній лабораторній роботі було реалізовано HTTP REST API для сервісу трекера інцидентів кібербезпеки.
Система дозволяє створювати, переглядати, оновлювати та видаляти інциденти. Дані зберігаються в оперативній пам’яті сервера без використання бази даних.
### Технології
- Node.js
- Express.js
- JSON
- REST API

### Структура проекту
backend
server.js
routes/
controllers/
dto/
middleware/
data/

### Основні можливості API
- створення інциденту
- отримання списку інцидентів
- отримання одного інциденту
- оновлення інциденту
- видалення інциденту

### Приклади маршрутів
GET  
/api/incidents  
POST  
/api/incidents  
PUT  
/api/incidents/:id  
DELETE  
/api/incidents/:id  

### HTTP статус-коди
200 OK  
201 Created  
204 No Content  
400 Bad Request  
404 Not Found  
500 Internal Server Error  

### Запуск проекту
Встановити залежності:
npm install
Запустити сервер:
npm start
Сервер запускається на:
http://localhost:3000/api/incidents