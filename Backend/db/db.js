console.log(" DB FILE LOADED");

import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.resolve("data");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, "app.db");

export const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB error:", err);
  } else {
    console.log("✅ Connected to SQLite");
  }
});