// Redis connection using ioredis or any Redis client
const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6333
});

module.exports = redis;
