import jwt from "jsonwebtoken";
import { db } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      status: 401,
      title: "Unauthorized",
      detail: "Authorization token is required"
    });
  }

  db.get("SELECT id FROM revoked_tokens WHERE token = ?", [token], (err, row) => {
    if (row) {
      return res.status(401).json({
        status: 401,
        title: "Unauthorized",
        detail: "Token has been revoked"
      });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.currentUserId    = payload.userId;
      req.currentUsername  = payload.username;
      req.currentUserRole  = payload.role;
      next();
    } catch {
      return res.status(401).json({
        status: 401,
        title: "Unauthorized",
        detail: "Invalid or expired token"
      });
    }
  });
}

export function requireAdmin(req, res, next) {
  if (req.currentUserRole !== "admin") {
    return res.status(403).json({
      status: 403,
      title: "Forbidden",
      detail: "Admin access required"
    });
  }
  next();
}