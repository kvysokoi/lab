import { db } from "../db/db.js";
import { getCountBySeverityForUser } from "../services/incidentsServise.js";

function problem(res, status, title, detail) {
  // Сценарій Г: не розкриваємо внутрішні деталі для 500
  const safeDetail = status === 500 ? "Internal server error" : detail;
  return res.status(status).json({ status, title, detail: safeDetail });
}

export function getAllIncidents(req, res) {
  const sql = `
    SELECT incidents.id,
           incidents.severity,
           incidents.date,
           incidents.tag,
           incidents.reporter,
           incidents.owner_id,
           users.username AS user
    FROM incidents
    LEFT JOIN users ON incidents.user_id = users.id
    ORDER BY incidents.id DESC
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return problem(res, 500, "Database error", err.message);
    res.json(rows);
  });
}

export function getIncidentById(req, res) {
  const sql = `
    SELECT incidents.id,
           incidents.severity,
           incidents.date,
           incidents.tag,
           incidents.reporter,
           incidents.owner_id,
           users.username AS user,
           comments.text AS comment
    FROM incidents
    LEFT JOIN users ON incidents.user_id = users.id
    LEFT JOIN comments ON comments.incident_id = incidents.id
    WHERE incidents.id = ?
  `;

  db.get(sql, [req.params.id], (err, row) => {
    if (err) return problem(res, 500, "Database error", err.message);
    if (!row) return problem(res, 404, "Not found", `Incident ${req.params.id} not found`);

    // Сценарій В — IDOR: перевірка власника
    if (row.owner_id && row.owner_id !== req.currentUserId) {
      return problem(res, 403, "Forbidden", "You do not have access to this incident");
    }

    res.json(row);
  });
}

export function createIncident(req, res) {
  const { date, tag, severity, reporter, user_id, comments } = req.body;

  const errors = {};
  if (!date) errors.date = "Date is required";
  if (!tag || tag.length < 2) errors.tag = "Tag must be at least 2 characters";
  if (!severity) errors.severity = "Severity is required";
  else if (!["low", "medium", "high"].includes(severity.toLowerCase()))
    errors.severity = "Severity must be low, medium or high";
  if (!reporter || reporter.length < 2) errors.reporter = "Reporter must be at least 2 characters";
  if (!user_id) errors.user_id = "user_id is required";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      status: 400,
      title: "Validation failed",
      detail: "One or more fields are invalid",
      errors
    });
  }

  const ownerId = req.currentUserId;

  const sql = `
    INSERT INTO incidents (date, tag, severity, reporter, user_id, comments, owner_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(sql, [date, tag, severity.toLowerCase(), reporter, user_id, comments || "", ownerId], function (err) {
    if (err) return problem(res, 500, "Database error", err.message);
    res.status(201).json({ id: this.lastID });
  });
}

export function updateIncident(req, res) {
  const { severity, tag, date, reporter, comments } = req.body;

  if (!severity) {
    return res.status(400).json({
      status: 400,
      title: "Validation failed",
      detail: "Severity is required",
      errors: { severity: "Severity is required" }
    });
  }

  if (!["low", "medium", "high"].includes(severity.toLowerCase())) {
    return res.status(400).json({
      status: 400,
      title: "Validation failed",
      detail: "Invalid severity value",
      errors: { severity: "Must be low, medium or high" }
    });
  }

  db.get("SELECT owner_id FROM incidents WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return problem(res, 500, "Database error", err.message);
    if (!row) return problem(res, 404, "Not found", `Incident ${req.params.id} not found`);

    if (row.owner_id && row.owner_id !== req.currentUserId) {
      return problem(res, 403, "Forbidden", "You do not have access to this incident");
    }

    const fields = [];
    const values = [];

    fields.push("severity = ?"); values.push(severity.toLowerCase());
    if (tag)      { fields.push("tag = ?");      values.push(tag); }
    if (date)     { fields.push("date = ?");     values.push(date); }
    if (reporter) { fields.push("reporter = ?"); values.push(reporter); }
    if (comments !== undefined) { fields.push("comments = ?"); values.push(comments); }

    values.push(req.params.id);

    const sql = `UPDATE incidents SET ${fields.join(", ")} WHERE id = ?`;

    db.run(sql, values, function (err) {
      if (err) return problem(res, 500, "Database error", err.message);
      res.json({ message: "Updated" });
    });
  });
}

export function deleteIncident(req, res) {
  // Сценарій В — IDOR: перевірка власника перед видаленням
  db.get("SELECT owner_id FROM incidents WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return problem(res, 500, "Database error", err.message);
    if (!row) return problem(res, 404, "Not found", `Incident ${req.params.id} not found`);

    if (row.owner_id && row.owner_id !== req.currentUserId) {
      return problem(res, 403, "Forbidden", "You do not have access to this incident");
    }

    db.run("DELETE FROM incidents WHERE id = ?", [req.params.id], function (err) {
      if (err) return problem(res, 500, "Database error", err.message);
      res.status(204).send();
    });
  });
}

export function getStats(req, res) {
  db.get("SELECT COUNT(*) as total FROM incidents", [], (err, row) => {
    if (err) return problem(res, 500, "Database error", err.message);
    res.json(row);
  });
}

export function searchBySeverity(req, res) {
  const { severity } = req.query;

  if (!severity) {
    return problem(res, 400, "Bad request", "severity query param is required");
  }

  db.all(
    "SELECT * FROM incidents WHERE LOWER(severity) = LOWER(?)",
    [severity],
    (err, rows) => {
      if (err) return problem(res, 500, "Database error", err.message);
      res.json(rows);
    }
  );
}

export function getIncidentCountBySeverity(req, res) {
  getCountBySeverityForUser(req.params.userId, (err, rows) => {
    if (err) return problem(res, 500, "Database error", err.message);
    if (!rows || rows.length === 0)
      return problem(res, 404, "Not found", "No incidents found for this user");
    res.json(rows);
  });
}