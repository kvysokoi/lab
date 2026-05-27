import { db } from "./db.js";
import bcrypt from "bcrypt";

export async function seedDatabase() {
  db.get("SELECT COUNT(*) as count FROM users", [], async (err, row) => {
    if (err || row.count > 0) return;

    const adminHash = await bcrypt.hash("admin123", 10);
    const userHash  = await bcrypt.hash("user123", 10);

    db.run(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      ["admin", adminHash, "admin"]
    );

    db.run(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      ["student1", userHash, "user"],
      () => {
        db.get("SELECT id FROM users WHERE username = 'student1'", [], (err, user) => {
          if (!user) return;

          const incidents = [
            ["2026-03-10", "phishing", "high",   "student1", user.id],
            ["2026-03-11", "malware",  "low",    "student1", user.id],
            ["2026-03-12", "phishing", "medium", "student1", user.id],
          ];

          incidents.forEach(([date, tag, severity, reporter, ownerId]) => {
            db.run(
              "INSERT INTO incidents (date, tag, severity, reporter, user_id, owner_id) VALUES (?, ?, ?, ?, ?, ?)",
              [date, tag, severity, reporter, ownerId, ownerId]
            );
          });
        });

        db.run(
          "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
          ["student2", userHash, "user"],
          () => {
            db.get("SELECT id FROM users WHERE username = 'student2'", [], (err, user) => {
              if (!user) return;
              db.run(
                "INSERT INTO incidents (date, tag, severity, reporter, user_id, owner_id) VALUES (?, ?, ?, ?, ?, ?)",
                ["2026-03-13", "malware", "high", "student2", user.id, user.id]
              );
            });
          }
        );
      }
    );

    console.log("✅ Seed completed: admin/admin123, student1/user123, student2/user123");
  });
}