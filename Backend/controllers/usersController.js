import { db } from "../db/db.js";

export function getUsers(req, res) {
 db.all("SELECT * FROM users", [], (err, rows) => {
  if (err) return res.status(500).json({ error: err.message });
  res.json(rows);
 });
}

export function createUser(req, res) {

 const { username } = req.body;

 if (!username || username.length < 3) {
  return res.status(400).json({ error: "Invalid username" });
 }

 db.run(
  "INSERT INTO users (username) VALUES (?)",
  [username],
  function(err) {

   if (err) return res.status(500).json({ error: err.message });

   res.status(201).json({ id: this.lastID });
  }
 );
}