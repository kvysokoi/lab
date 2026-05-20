export function errorHandler(
 err,
 req,
 res,
 next
) {

 res.status(500).json({

  status: 500,

  title: "Server error",

  detail: err.message
 });
}