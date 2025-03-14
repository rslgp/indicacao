// PostgreSQL connection using pg-promise
const pgp = require('pg-promise')();

const db = pgp({
  host: 'localhost',
  port: 5433,
  database: 'mydatabase',
  user: 'myuser',
  password: 'mypassword'
});

module.exports = db;
