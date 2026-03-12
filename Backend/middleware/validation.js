export function validateIncident(req, res, next) {

 const { date, tag, severity, comments, reporter } = req.body;

 if (!date || !tag || !severity || !comments || !reporter) {
  return res.status(400).json({
   error: "All fields are required"
  });
 }

 const allowedSeverity = ["low", "medium", "high"];

 if (!allowedSeverity.includes(severity)) {
  return res.status(400).json({
   error: "Severity must be low, medium or high"
  });
 }

 next();
}
