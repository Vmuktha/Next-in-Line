const pool = require("../db");
const {
  handleApplication,
  handleExit,
  handleDecay,
  getStatus,
  getApplicationHistory,
} = require("../services/applicationService");
const { AppError, asyncHandler, isPositiveInteger } = require("../utils/http");

const parsePositiveInteger = (value, fieldName) => {
  const parsed = Number(value);

  if (!isPositiveInteger(parsed)) {
    throw new AppError(`${fieldName} must be a positive integer`, 400);
  }

  return parsed;
};

const parseApplicantName = (value) => {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new AppError("applicant_name is required", 400);
  }

  return value.trim();
};

exports.applyToJob = asyncHandler(async (req, res) => {
  const jobId = parsePositiveInteger(req.body?.job_id, "job_id");
  const applicantName = parseApplicantName(req.body?.applicant_name);

  const result = await handleApplication(jobId, applicantName);
  res.status(201).json(result);
});

exports.exitApplication = asyncHandler(async (req, res) => {
  const applicationId = parsePositiveInteger(
    req.body?.application_id,
    "application_id"
  );

  const result = await handleExit(applicationId);
  res.status(200).json(result);
});

exports.decayApplication = asyncHandler(async (req, res) => {
  const applicationId = parsePositiveInteger(
    req.body?.application_id,
    "application_id"
  );

  const result = await handleDecay(applicationId);
  res.status(200).json(result);
});

exports.getApplicationStatus = asyncHandler(async (req, res) => {
  const applicationId = parsePositiveInteger(req.params?.id, "id");
  const result = await getStatus(applicationId);

  res.status(200).json(result);
});

exports.getApplicationHistory = asyncHandler(async (req, res) => {
  const applicationId = parsePositiveInteger(req.params?.id, "id");
  const result = await getApplicationHistory(applicationId);

  res.status(200).json(result);
});

exports.getAllApplications = asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT *
     FROM applications
     ORDER BY applied_at ASC, id ASC`
  );

  res.status(200).json(result.rows);
});

exports.getAllEvents = asyncHandler(async (_req, res) => {
  const result = await pool.query(
    `SELECT events.*, applications.applicant_name
     FROM events
     LEFT JOIN applications ON applications.id = events.application_id
     ORDER BY events.created_at DESC, events.id DESC
     LIMIT 20`
  );

  res.status(200).json(result.rows);
});
