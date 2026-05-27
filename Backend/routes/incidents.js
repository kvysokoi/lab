import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";

import {
  getAllIncidents,
  getIncidentById,
  createIncident,
  updateIncident,
  deleteIncident,
  getStats,
  searchBySeverity,
  getIncidentCountBySeverity
} from "../controllers/incidentsController.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/", getAllIncidents);
router.get("/stats", getStats);
router.get("/search", searchBySeverity);
router.get("/user/:userId/severity-stats", getIncidentCountBySeverity);
router.get("/:id", getIncidentById);
router.post("/", createIncident);
router.put("/:id", updateIncident);
router.delete("/:id", deleteIncident);

export default router;