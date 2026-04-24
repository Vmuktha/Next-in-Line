const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./src/db");
const jobRoutes = require("./src/routes/jobRoutes");
const applicationRoutes = require("./src/routes/applicationRoutes");
const { AppError } = require("./src/utils/http");

const app = express();
const PORT = Number(process.env.PORT) || 5050;

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({ message: "API running" });
});

app.get("/test-db", async (_req, res, next) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.status(200).json(result.rows);
  } catch (error) {
    next(error);
  }
});

app.use("/jobs", jobRoutes);
app.use("/applications", applicationRoutes);

app.use((req, _res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

app.use((error, _req, res, _next) => {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : Number.isInteger(error.status)
      ? error.status
    : 500;

  const payload = {
    error: error.message || "Internal server error",
  };

  if (error.details !== undefined) {
    payload.details = error.details;
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json(payload);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
