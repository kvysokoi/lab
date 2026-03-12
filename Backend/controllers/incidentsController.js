import { incidents } from "../data/store.js";
import { createIncidentDTO } from "../dto/incidentDTO.js";

export function getAllIncidents(req, res) {
 res.json(incidents);
}

export function getIncidentById(req, res) {

 const id = Number(req.params.id);

 const incident = incidents.find(i => i.id === id);

 if (!incident) {
  return res.status(404).json({
   error: "Incident not found"
  });
 }

 res.json(incident);
}

export function createIncident(req, res) {

 const incident = createIncidentDTO(req.body);

 incidents.push(incident);

 res.status(201).json(incident);
}

export function updateIncident(req, res) {

 const id = Number(req.params.id);

 const incident = incidents.find(i => i.id === id);

 if (!incident) {
  return res.status(404).json({
   error: "Incident not found"
  });
 }

 incident.tag = req.body.tag ?? incident.tag;
 incident.severity = req.body.severity ?? incident.severity;
 incident.comments = req.body.comments ?? incident.comments;

 res.json(incident);
}

export function deleteIncident(req, res) {

 const id = Number(req.params.id);

 const index = incidents.findIndex(i => i.id === id);

 if (index === -1) {
  return res.status(404).json({
   error: "Incident not found"
  });
 }

 incidents.splice(index, 1);

 res.status(204).send();
}

