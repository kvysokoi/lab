export function errorHandler(err, req, res, next) {
 console.error(err);

 res.status(500).json({
  status: 500,
  title: "Internal Server Error",
  detail: err.message
 });
}