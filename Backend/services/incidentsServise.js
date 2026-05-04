import { incidents } from "../data/store.js";

export function getAll(filter) {

 if (!filter) return incidents;

 return incidents.filter(i => {
  if (filter.tag && i.tag !== filter.tag) return false;
  if (filter.severity && i.severity !== filter.severity) return false;
  return true;
 });
}

export function getById(id) {
 return incidents.find(i => i.id === id);
}

export function create(incident) {
 incidents.push(incident);
 return incident;
}

export function update(id, data) {

 const incident = incidents.find(i => i.id === id);

 if (!incident) return null;

 incident.tag = data.tag ?? incident.tag;
 incident.severity = data.severity ?? incident.severity;
 incident.comments = data.comments ?? incident.comments;

 return incident;
}

export function remove(id) {

 const index = incidents.findIndex(i => i.id === id);

 if (index === -1) return false;

 incidents.splice(index, 1);
 return true;
}