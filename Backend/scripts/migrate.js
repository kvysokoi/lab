import fs from "fs";
import path from "path";

import { db } from "../db/db.js";

const migrationsPath = path.resolve("migrations");

db.serialize(() => {

 db.run(`
 CREATE TABLE IF NOT EXISTS schema_migrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL
 )
 `);

 const files = fs.readdirSync(migrationsPath);

 files.forEach((file) => {

  db.get(`
   SELECT * FROM schema_migrations
   WHERE filename='${file}'
  `, (err, row) => {

   if (!row) {

    const sql = fs.readFileSync(
     path.join(migrationsPath, file),
     "utf-8"
    );

    db.exec(sql);

    db.run(`
     INSERT INTO schema_migrations(filename)
     VALUES('${file}')
    `);

    console.log(`Migration applied: ${file}`);
   }
  });
 });
});