const { error: logError } = require("../logger");

function mapValidationError(err) {
  if (err && err.name === "ZodError") {
    return {
      status: 400,
      body: {
        message: "Validation failed",
        issues: err.issues?.map((issue) => ({
          path: issue.path?.join("."),
          message: issue.message,
        })),
      },
    };
  }

  return null;
}

// Express error-handling middleware (must have 4 args)
function errorHandler(err, req, res, next) {
  const mapped = mapValidationError(err);

  const status = mapped?.status || err.status || 500;
  const body =
    mapped?.body || {
      message: err.message || "Internal server error",
    };

  logError("unhandled_error", {
    status,
    message: err.message,
    stack: err.stack,
    path: req.originalUrl,
  });

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json(body);
}

module.exports = errorHandler;

