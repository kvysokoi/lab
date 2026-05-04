import { db } from "../db/db.js";

export function getAllIncidents(req, res) {

 const sql = `
 SELECT incidents.id,
        incidents.severity,
        incidents.date,
        users.username AS user
 FROM incidents
 LEFT JOIN users ON incidents.user_id = users.id
 `;

 db.all(sql, [], (err, rows) => {
  if (err) return res.status(500).json({ error: err.message });

  res.json(rows);
 });
}

export function getIncidentById(req, res) {

 const sql = `
 SELECT incidents.id,
        incidents.severity,
        incidents.date,
        users.username AS user
 FROM incidents
 LEFT JOIN users ON incidents.user_id = users.id
 WHERE incidents.id = ?
 `;

 db.get(sql, [req.params.id], (err, row) => {

  if (!row) return res.status(404).json({ error: "Not found" });

  res.json(row);
 });
}

export function createIncident(req, res) {

 const { date, severity, comments, user_id } = req.body;

 if (!severity) {
  return res.status(400).json({ error: "Severity required" });
 }

 db.run(
  `INSERT INTO incidents (date, severity, comments, user_id)
   VALUES (?, ?, ?, ?)`,
  [date, severity, comments, user_id],
  function(err) {

   if (err) return res.status(500).json({ error: err.message });

   res.status(201).json({ id: this.lastID });
  }
 );
}

export function updateIncident(req, res) {

 const { severity } = req.body;

 db.run(
  "UPDATE incidents SET severity = ? WHERE id = ?",
  [severity, req.params.id],
  function(err) {

   if (this.changes === 0) {
    return res.status(404).json({ error: "Not found" });
   }

   res.json({ message: "Updated" });
  }
 );
}

export function deleteIncident(req, res) {

 db.run("DELETE FROM incidents WHERE id = ?", [req.params.id], function(err) {

  if (this.changes === 0) {
   return res.status(404).json({ error: "Not found" });
  }

  res.status(204).send();
 });
}