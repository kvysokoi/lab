export function validateIncident(req, res, next) {

 const { date, tag, severity, comments, reporter } = req.body;

 if (!date || !tag || !severity || !comments || !reporter) {
  return res.status(400).json({ error: "All fields required" });
 }

 const allowed = ["low", "medium", "high"];

 if (!allowed.includes(severity)) {
  return res.status(400).json({ error: "Invalid severity" });
 }

 next();
}