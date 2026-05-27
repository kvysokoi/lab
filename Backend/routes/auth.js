import express from "express";
import rateLimit from "express-rate-limit";
import { register, login, logout, getMe } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    status: 429,
    title: "Too Many Requests",
    detail: "Too many login attempts. Try again in 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", loginLimiter, login);
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getMe);

export default router;