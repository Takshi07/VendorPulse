export function errorHandler(err, req, res, next) {
  console.error(err);

  // MongoDB duplicate-key error
  if (err?.code === 11000) {
  const fields = Object.keys(err.keyPattern || {});

  // Evaluation unique constraint:
  // supplierId + year + quarter
  if (
    fields.includes("supplierId") &&
    fields.includes("year") &&
    fields.includes("quarter")
  ) {
    return res.status(409).json({
      message:
        "An evaluation already exists for this supplier and quarter",
    });
  }

  const field = fields[0];

  const messages = {
    name: "A KPI with this name already exists",
    email: "A user with this email already exists",
    taxId: "A supplier with this tax ID already exists",
  };

  return res.status(409).json({
    message:
      messages[field] ||
      "A record with this value already exists",
  });
}

  // Mongoose validation errors
  if (err?.name === "ValidationError") {
    const message =
      Object.values(err.errors || {})[0]?.message ||
      "Validation failed";

    return res.status(400).json({ message });
  }

  // Mongoose type/casting errors
  if (err?.name === "CastError") {
    return res.status(400).json({
      message: "Invalid value provided",
    });
  }

  // Errors intentionally created by our services
  if (err.status) {
    const response = {
      message: err.message,
    };
    if (err.code) {
      response.code = err.code;
    }
    return res.status(err.status).json(response);
  }

  // Unexpected errors must not expose internal details
  return res.status(500).json({
    message: "Internal server error",
  });
}