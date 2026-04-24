const pool = require("../db");
const { AppError, asyncHandler } = require("../utils/http");

exports.createJob = asyncHandler(async (req, res) => {
  const title = typeof req.body?.title === "string" ? req.body.title.trim() : "";
  const capacity = Number(req.body?.capacity);

  if (!title) {
    throw new AppError("title is required", 400);
  }

  if (!Number.isInteger(capacity) || capacity < 1) {
    throw new AppError("capacity must be a positive integer", 400);
  }

  const result = await pool.query(
    `INSERT INTO jobs (title, capacity)
     VALUES ($1, $2)
     RETURNING *`,
    [title, capacity]
  );

  res.status(201).json(result.rows[0]);
});
