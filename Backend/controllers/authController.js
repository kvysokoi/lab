import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../db/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-prod";
const JWT_EXPIRES = "2h";

function problem(res, status, title, detail) {
  return res.status(status).json({ status, title, detail });
}

export async function register(req, res) {
  const { username, password } = req.body;

  if (!username || username.length < 3) {
    return problem(res, 400, "Validation failed", "Username must be at least 3 characters");
  }
  if (!password || password.length < 6) {
    return problem(res, 400, "Validation failed", "Password must be at least 6 characters");
  }

  try {
    const hash = await bcrypt.hash(password, 10);

    db.run(
      "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      [username, hash, "user"],
      function (err) {
        if (err) {
          if (err.message.includes("UNIQUE")) {
            return problem(res, 409, "Conflict", "Username already taken");
          }
          return problem(res, 500, "Server error", "Internal server error");
        }
        res.status(201).json({ id: this.lastID, username, role: "user" });
      }
    );
  } catch {
    problem(res, 500, "Server error", "Internal server error");
  }
}

export async function login(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return problem(res, 400, "Validation failed", "Username and password are required");
  }

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err) return problem(res, 500, "Server error", "Internal server error");

    if (!user) {
      return problem(res, 401, "Unauthorized", "Invalid credentials");
    }

    try {
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return problem(res, 401, "Unauthorized", "Invalid credentials");
      }

      const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES }
      );

      res.json({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      });
    } catch {
      problem(res, 500, "Server error", "Internal server error");
    }
  });
}

export function logout(req, res) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return problem(res, 400, "Bad request", "No token provided");
  }

  db.run(
    "INSERT OR IGNORE INTO revoked_tokens (token, revoked_at) VALUES (?, ?)",
    [token, new Date().toISOString()],
    (err) => {
      if (err) return problem(res, 500, "Server error", "Internal server error");
      res.json({ message: "Logged out successfully" });
    }
  );
}

export function getMe(req, res) {
  res.json({
    id: req.currentUserId,
    username: req.currentUsername,
    role: req.currentUserRole
  });
}