class AppError extends Error {
  constructor(message, statusCode = 500, details) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.details = details;
  }
}

const asyncHandler = (handler) => async (req, res, next) => {
  try {
    await handler(req, res, next);
  } catch (error) {
    next(error);
  }
};

const isPositiveInteger = (value) =>
  Number.isInteger(value) && value > 0;

module.exports = {
  AppError,
  asyncHandler,
  isPositiveInteger,
};
