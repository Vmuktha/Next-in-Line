const { Pool } = require("pg");

const pool = new Pool({
  user: "vimuktha",
  host: "localhost",
  database: "pipeline_db",
  password: "",
  port: 5432,
});

module.exports = pool;
