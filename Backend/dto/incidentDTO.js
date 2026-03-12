export function createIncidentDTO(data) {
 return {
  id: Date.now(),
  date: data.date,
  tag: data.tag,
  severity: data.severity,
  comments: data.comments,
  reporter: data.reporter
 };
}

