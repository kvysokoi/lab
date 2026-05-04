let currentId = 1;

export function createIncidentDTO(data) {
 return {
  id: currentId++,
  date: data.date,
  tag: data.tag,
  severity: data.severity,
  comments: data.comments,
  reporter: data.reporter
 };
}