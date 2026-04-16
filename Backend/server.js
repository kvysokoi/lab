import express from "express";
import fs from "fs";
import path from "path";
import { db } from "./db/db.js";

console.log(" SERVER STARTED");

const app = express();
app.use(express.json());

// читаємо schema.sql
const schemaPath = path.resolve("db/schema.sql");
const schema = fs.readFileSync(schemaPath, "utf-8");

// створюємо таблиці
db.exec(schema, (err) => {
  if (err) {
    console.error(" Schema error:", err);
  } else {
    console.log(" Schema created");
  }
});

// тестовий маршрут
app.get("/", (req, res) => {
  res.send("API is working");
});

app.listen(3000, () => {
  console.log(" Server running on port 3000");
});