const assert = require("node:assert/strict");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

const loadFresh = (relativeModulePath, mocks = {}) => {
  const targetPath = require.resolve(path.join(rootDir, relativeModulePath));
  const savedEntries = new Map();

  for (const [mockRelativePath, exportsValue] of Object.entries(mocks)) {
    const resolvedMockPath = require.resolve(path.join(rootDir, mockRelativePath));
    savedEntries.set(resolvedMockPath, require.cache[resolvedMockPath]);
    require.cache[resolvedMockPath] = {
      id: resolvedMockPath,
      filename: resolvedMockPath,
      loaded: true,
      exports: exportsValue,
    };
  }

  const savedTarget = require.cache[targetPath];
  delete require.cache[targetPath];

  try {
    return require(targetPath);
  } finally {
    delete require.cache[targetPath];

    if (savedTarget) {
      require.cache[targetPath] = savedTarget;
    }

    for (const [resolvedMockPath, cachedValue] of savedEntries.entries()) {
      if (cachedValue) {
        require.cache[resolvedMockPath] = cachedValue;
      } else {
        delete require.cache[resolvedMockPath];
      }
    }
  }
};

const normalizeSql = (sql) => sql.replace(/\s+/g, " ").trim();

const createSequencedClient = (responses) => {
  const queue = [...responses];
  const queries = [];

  return {
    queries,
    released: false,
    async query(sql, params) {
      queries.push({
        sql: normalizeSql(sql),
        params: params ?? [],
      });

      if (queue.length === 0) {
        throw new Error(`Unexpected query: ${normalizeSql(sql)}`);
      }

      const next = queue.shift();

      if (next instanceof Error) {
        throw next;
      }

      return next;
    },
    release() {
      this.released = true;
    },
  };
};

const createPoolMockForClient = (client) => ({
  async connect() {
    return client;
  },
});

const createResponseMock = () => ({
  statusCode: 200,
  body: undefined,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    this.body = payload;
    return this;
  },
});

const expectNextError = async (handler, req) => {
  let capturedError;

  await handler(req, createResponseMock(), (error) => {
    capturedError = error;
  });

  assert.ok(capturedError, "Expected handler to forward an error");
  return capturedError;
};

const expectReject = async (promiseFactory, expectedMessage, expectedStatusCode) => {
  await assert.rejects(promiseFactory, (error) => {
    assert.equal(error.message, expectedMessage);
    assert.equal(error.statusCode, expectedStatusCode);
    return true;
  });
};

const tests = [];

const runTest = (name, fn) => {
  tests.push({ name, fn });
};

runTest("createJob inserts a trimmed job and returns 201", async () => {
  const poolMock = {
    calls: [],
    async query(sql, params) {
      this.calls.push({
        sql: normalizeSql(sql),
        params,
      });

      return {
        rows: [{ id: 1, title: "Platform Engineer", capacity: 2 }],
      };
    },
  };

  const { createJob } = loadFresh("src/controllers/jobController.js", {
    "src/db/index.js": poolMock,
  });

  const req = {
    body: {
      title: "  Platform Engineer  ",
      capacity: 2,
    },
  };
  const res = createResponseMock();

  await createJob(req, res, (error) => {
    throw error;
  });

  assert.equal(res.statusCode, 201);
  assert.deepEqual(res.body, { id: 1, title: "Platform Engineer", capacity: 2 });
  assert.equal(poolMock.calls.length, 1);
  assert.deepEqual(poolMock.calls[0].params, ["Platform Engineer", 2]);
});

runTest("createJob rejects invalid title and capacity", async () => {
  const { createJob } = loadFresh("src/controllers/jobController.js", {
    "src/db/index.js": { async query() { throw new Error("should not query"); } },
  });

  const missingTitleError = await expectNextError(createJob, {
    body: { title: "   ", capacity: 1 },
  });
  assert.equal(missingTitleError.message, "title is required");
  assert.equal(missingTitleError.statusCode, 400);

  const invalidCapacityError = await expectNextError(createJob, {
    body: { title: "Role", capacity: 0 },
  });
  assert.equal(invalidCapacityError.message, "capacity must be a positive integer");
  assert.equal(invalidCapacityError.statusCode, 400);
});

runTest("application controllers reject invalid inputs with 400", async () => {
  const controller = loadFresh("src/controllers/applicationController.js", {
    "src/db/index.js": { async query() { throw new Error("should not query"); } },
    "src/services/applicationService.js": {
      async handleApplication() {
        throw new Error("should not call handleApplication");
      },
      async handleExit() {
        throw new Error("should not call handleExit");
      },
      async handleDecay() {
        throw new Error("should not call handleDecay");
      },
      async getStatus() {
        throw new Error("should not call getStatus");
      },
      async getApplicationHistory() {
        throw new Error("should not call getApplicationHistory");
      },
    },
  });

  const badApply = await expectNextError(controller.applyToJob, {
    body: { job_id: "abc", applicant_name: "" },
  });
  assert.equal(badApply.message, "job_id must be a positive integer");
  assert.equal(badApply.statusCode, 400);

  const badExit = await expectNextError(controller.exitApplication, {
    body: { application_id: 0 },
  });
  assert.equal(badExit.message, "application_id must be a positive integer");
  assert.equal(badExit.statusCode, 400);

  const badDecay = await expectNextError(controller.decayApplication, {
    body: { application_id: -1 },
  });
  assert.equal(badDecay.message, "application_id must be a positive integer");
  assert.equal(badDecay.statusCode, 400);
});

runTest("handleApplication assigns ACTIVE when capacity is available", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 9, capacity: 2 }] },
    { rows: [{ count: "1" }] },
    {
      rows: [{ id: 77, job_id: 9, applicant_name: "Alice", status: "ACTIVE" }],
    },
    { rows: [] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  const result = await service.handleApplication(9, "Alice");

  assert.equal(result.application.status, "ACTIVE");
  assert.equal(result.message, "Application submitted");
  assert.equal(client.queries[3].params[2], "ACTIVE");
  assert.deepEqual(client.queries[4].params, [
    9,
    77,
    "APPLIED",
    JSON.stringify({ status_assigned: "ACTIVE" }),
  ]);
  assert.equal(client.queries.at(-1).sql, "COMMIT");
  assert.equal(client.released, true);
});

runTest("handleApplication assigns WAITLIST at the capacity boundary", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 4, capacity: 1 }] },
    { rows: [{ count: "1" }] },
    {
      rows: [{ id: 88, job_id: 4, applicant_name: "Bob", status: "WAITLIST" }],
    },
    { rows: [] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  const result = await service.handleApplication(4, "Bob");

  assert.equal(result.application.status, "WAITLIST");
  assert.equal(client.queries[3].params[2], "WAITLIST");
});

runTest("handleExit marks exited application and promotes the next waitlisted applicant", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 10, job_id: 2, status: "ACTIVE" }] },
    { rows: [] },
    { rows: [] },
    { rows: [{ id: 12, job_id: 2, status: "WAITLIST", applicant_name: "Nina" }] },
    { rows: [] },
    { rows: [] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  const result = await service.handleExit(10);

  assert.equal(result.message, "Exit processed and promotion triggered");
  assert.match(client.queries[2].sql, /UPDATE applications SET status = 'EXITED'/);
  assert.deepEqual(client.queries[3].params, [
    2,
    10,
    "EXITED",
    JSON.stringify({}),
  ]);
  assert.match(client.queries[4].sql, /WHERE job_id = \$1 AND status = 'WAITLIST'/);
  assert.match(client.queries[5].sql, /UPDATE applications SET status = 'PENDING_ACK'/);
  assert.deepEqual(client.queries[6].params, [
    2,
    12,
    "PROMOTED",
    JSON.stringify({ from: "WAITLIST" }),
  ]);
  assert.equal(client.queries.at(-1).sql, "COMMIT");
});

runTest("handleExit rejects repeated exits with 409", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 10, job_id: 2, status: "EXITED" }] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  await expectReject(
    () => service.handleExit(10),
    "Application already exited",
    409
  );

  assert.equal(client.queries.at(-1).sql, "ROLLBACK");
  assert.equal(client.released, true);
});

runTest("handleExit from WAITLIST exits cleanly without promotion", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 31, job_id: 7, status: "WAITLIST" }] },
    { rows: [] },
    { rows: [] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  const result = await service.handleExit(31);

  assert.equal(result.message, "Exit processed and promotion triggered");
  assert.equal(client.queries.length, 5);
  assert.equal(client.queries.at(-1).sql, "COMMIT");
});

runTest("handleDecay requeues the current pending application and promotes the next candidate", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 20, job_id: 6, status: "PENDING_ACK" }] },
    { rows: [] },
    { rows: [] },
    {
      rows: [{ id: 21, job_id: 6, status: "WAITLIST", applicant_name: "Kai" }],
    },
    { rows: [] },
    { rows: [] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  const result = await service.handleDecay(20);

  assert.equal(result.message, "Decay handled and cascade triggered");
  assert.match(client.queries[2].sql, /SET status = 'WAITLIST'/);
  assert.deepEqual(client.queries[3].params, [
    6,
    20,
    "DECAYED",
    JSON.stringify({ penalty: 1 }),
  ]);
  assert.match(client.queries[5].sql, /SET status = 'PENDING_ACK'/);
  assert.deepEqual(client.queries[6].params, [
    6,
    21,
    "PROMOTED",
    JSON.stringify({ reason: "DECAY_CASCADE" }),
  ]);
  assert.equal(client.queries.at(-1).sql, "COMMIT");
});

runTest("handleDecay rejects invalid states with 409", async () => {
  const client = createSequencedClient([
    { rows: [] },
    { rows: [{ id: 20, job_id: 6, status: "ACTIVE" }] },
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  await expectReject(
    () => service.handleDecay(20),
    "Application is not pending acknowledgment",
    409
  );

  assert.equal(client.queries.at(-1).sql, "ROLLBACK");
  assert.equal(client.released, true);
});

runTest("getStatus returns 404 for missing applications", async () => {
  const client = createSequencedClient([
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  await expectReject(
    () => service.getStatus(404),
    "Application not found",
    404
  );

  assert.equal(client.released, true);
});

runTest("getApplicationHistory returns 404 for missing applications", async () => {
  const client = createSequencedClient([
    { rows: [] },
  ]);

  const service = loadFresh("src/services/applicationService.js", {
    "src/db/index.js": createPoolMockForClient(client),
  });

  await expectReject(
    () => service.getApplicationHistory(404),
    "Application not found",
    404
  );

  assert.equal(client.released, true);
});

const main = async () => {
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
    console.error(`\n${failed} test(s) failed.`);
    return;
  }

  console.log(`\nAll ${tests.length} tests passed.`);
};

main();
