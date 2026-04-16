import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

console.log("DB FILE WORKS"); // 👈 ОСЬ СЮДИ ДОДАЄШ

const dataDir = path.resolve("data");
const dbPath = path.join(dataDir, "app.db");

if (!fs.existsSync(dataDir)) {
 fs.mkdirSync(dataDir);
}

export const db = new sqlite3.Database(dbPath, (err) => {
 if (err) {
  console.error("DB error", err);
 } else {
  console.log("Connected to SQLite");
 }
});