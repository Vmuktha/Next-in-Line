const pool = require("../db");
const { AppError } = require("../utils/http");

const insertEvent = async (client, { jobId, applicationId, eventType, metadata }) => {
  await client.query(
    `INSERT INTO events (job_id, application_id, event_type, metadata)
     VALUES ($1, $2, $3, $4)`,
    [jobId, applicationId, eventType, JSON.stringify(metadata ?? {})]
  );
};

exports.handleApplication = async (jobId, applicantName) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const jobRes = await client.query(
      "SELECT * FROM jobs WHERE id = $1 FOR UPDATE",
      [jobId]
    );

    const job = jobRes.rows[0];
    if (!job) {
      throw new AppError("Job not found", 404);
    }

    const activeRes = await client.query(
      "SELECT COUNT(*) FROM applications WHERE job_id = $1 AND status = 'ACTIVE'",
      [jobId]
    );

    const activeCount = Number.parseInt(activeRes.rows[0].count, 10);
    const status = activeCount < job.capacity ? "ACTIVE" : "WAITLIST";

    const appRes = await client.query(
      `INSERT INTO applications (job_id, applicant_name, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [jobId, applicantName, status]
    );

    const application = appRes.rows[0];

    await insertEvent(client, {
      jobId,
      applicationId: application.id,
      eventType: "APPLIED",
      metadata: { status_assigned: status },
    });

    await client.query("COMMIT");

    return {
      message: "Application submitted",
      application,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.handleExit = async (applicationId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appRes = await client.query(
      "SELECT * FROM applications WHERE id = $1 FOR UPDATE",
      [applicationId]
    );

    const application = appRes.rows[0];
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    if (application.status === "EXITED") {
      throw new AppError("Application already exited", 409);
    }

    await client.query(
      "UPDATE applications SET status = 'EXITED', last_updated = NOW() WHERE id = $1",
      [applicationId]
    );

    await insertEvent(client, {
      jobId: application.job_id,
      applicationId,
      eventType: "EXITED",
      metadata: {},
    });

    const shouldPromoteNext =
      application.status === "ACTIVE" || application.status === "PENDING_ACK";

    if (shouldPromoteNext) {
      const nextRes = await client.query(
        `SELECT * FROM applications
         WHERE job_id = $1 AND status = 'WAITLIST'
         ORDER BY applied_at ASC
         LIMIT 1
         FOR UPDATE`,
        [application.job_id]
      );

      if (nextRes.rows.length > 0) {
        const nextApp = nextRes.rows[0];

        await client.query(
          "UPDATE applications SET status = 'PENDING_ACK', last_updated = NOW() WHERE id = $1",
          [nextApp.id]
        );

        await insertEvent(client, {
          jobId: nextApp.job_id,
          applicationId: nextApp.id,
          eventType: "PROMOTED",
          metadata: { from: "WAITLIST" },
        });
      }
    }

    await client.query("COMMIT");

    return { message: "Exit processed and promotion triggered" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.handleDecay = async (applicationId) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const appRes = await client.query(
      "SELECT * FROM applications WHERE id = $1 FOR UPDATE",
      [applicationId]
    );

    const application = appRes.rows[0];
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    if (application.status !== "PENDING_ACK") {
      throw new AppError("Application is not pending acknowledgment", 409);
    }

    await client.query(
      `UPDATE applications
       SET status = 'WAITLIST',
           priority_score = priority_score + 1,
           last_updated = NOW()
       WHERE id = $1`,
      [applicationId]
    );

    await insertEvent(client, {
      jobId: application.job_id,
      applicationId,
      eventType: "DECAYED",
      metadata: { penalty: 1 },
    });

    const nextRes = await client.query(
      `SELECT * FROM applications
       WHERE job_id = $1 AND status = 'WAITLIST'
       ORDER BY priority_score ASC, applied_at ASC
       LIMIT 1
       FOR UPDATE`,
      [application.job_id]
    );

    if (nextRes.rows.length > 0) {
      const nextApp = nextRes.rows[0];

      await client.query(
        "UPDATE applications SET status = 'PENDING_ACK', last_updated = NOW() WHERE id = $1",
        [nextApp.id]
      );

      await insertEvent(client, {
        jobId: nextApp.job_id,
        applicationId: nextApp.id,
        eventType: "PROMOTED",
        metadata: { reason: "DECAY_CASCADE" },
      });
    }

    await client.query("COMMIT");

    return { message: "Decay handled and cascade triggered" };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

exports.getStatus = async (applicationId) => {
  const client = await pool.connect();

  try {
    const appRes = await client.query(
      "SELECT * FROM applications WHERE id = $1",
      [applicationId]
    );

    const application = appRes.rows[0];
    if (!application) {
      throw new AppError("Application not found", 404);
    }

    let position = null;

    if (
      application.status === "WAITLIST" ||
      application.status === "PENDING_ACK"
    ) {
      const posRes = await client.query(
        `SELECT id FROM applications
         WHERE job_id = $1 AND status IN ('WAITLIST', 'PENDING_ACK')
         ORDER BY priority_score ASC, applied_at ASC`,
        [application.job_id]
      );

      const queue = posRes.rows.map((item) => item.id);
      position = queue.indexOf(application.id) + 1;
    }

    return {
      application_id: application.id,
      applicant_name: application.applicant_name,
      status: application.status,
      queue_position: position,
    };
  } finally {
    client.release();
  }
};

exports.getApplicationHistory = async (applicationId) => {
  const client = await pool.connect();

  try {
    const appRes = await client.query(
      "SELECT id FROM applications WHERE id = $1",
      [applicationId]
    );

    if (appRes.rows.length === 0) {
      throw new AppError("Application not found", 404);
    }

    const historyRes = await client.query(
      `SELECT events.*, applications.applicant_name
       FROM events
       LEFT JOIN applications ON applications.id = events.application_id
       WHERE events.application_id = $1
       ORDER BY events.created_at ASC, events.id ASC`,
      [applicationId]
    );

    return historyRes.rows;
  } finally {
    client.release();
  }
};
