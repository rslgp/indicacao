#!/bin/bash

# Create base directory
mkdir -p src/config src/controllers src/routes src/services

# Create db.js (PostgreSQL connection)
cat <<EOL > src/config/db.js
// PostgreSQL connection using pg-promise
const pgp = require('pg-promise')();

const db = pgp({
  host: 'localhost',
  port: 5432,
  database: 'your_database_name',
  user: 'your_username',
  password: 'your_password'
});

module.exports = db;
EOL

# Create redis.js (Redis connection)
cat <<EOL > src/config/redis.js
// Redis connection using ioredis or any Redis client
const Redis = require('ioredis');
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

module.exports = redis;
EOL

# Create reviewController.js (Review logic)
cat <<EOL > src/controllers/reviewController.js
// Review controller
const reviewService = require('../services/reviewService');

exports.getReviews = async (req, res) => {
  try {
    const reviews = await reviewService.getAllReviews();
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
};

exports.createReview = async (req, res) => {
  try {
    const newReview = await reviewService.createReview(req.body);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ message: 'Error creating review' });
  }
};
EOL

# Create reviewRoutes.js (Review routes)
cat <<EOL > src/routes/reviewRoutes.js
// Review routes
const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/reviews', reviewController.getReviews);
router.post('/reviews', reviewController.createReview);

module.exports = router;
EOL

# Create reviewService.js (Business logic)
cat <<EOL > src/services/reviewService.js
// Review service
const db = require('../config/db');
const redis = require('../config/redis');

exports.getAllReviews = async () => {
  // Check if reviews are in cache
  const cachedReviews = await redis.get('reviews');
  if (cachedReviews) {
    return JSON.parse(cachedReviews);
  }

  // Fetch from DB if not in cache
  const reviews = await db.any('SELECT * FROM reviews');
  redis.set('reviews', JSON.stringify(reviews), 'EX', 3600); // Cache for 1 hour
  return reviews;
};

exports.createReview = async (reviewData) => {
  const newReview = await db.one(
    'INSERT INTO reviews(title, description) VALUES($1, $2) RETURNING *',
    [reviewData.title, reviewData.description]
  );
  return newReview;
};
EOL

# Create cacheService.js (Redis caching logic)
cat <<EOL > src/services/cacheService.js
// Redis caching logic (this file can be expanded as needed)
const redis = require('../config/redis');

exports.cacheData = (key, data) => {
  redis.set(key, JSON.stringify(data), 'EX', 3600); // Cache for 1 hour
};

exports.getCachedData = async (key) => {
  const cachedData = await redis.get(key);
  if (cachedData) {
    return JSON.parse(cachedData);
  }
  return null;
};
EOL

# Create app.js (Express server)
cat <<EOL > src/app.js
// Express server setup
const express = require('express');
const app = express();
const reviewRoutes = require('./routes/reviewRoutes');

app.use(express.json()); // Parse JSON request body
app.use('/api', reviewRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(\`Server is running on port \${PORT}\`);
});
EOL

# Print a message
echo "Project structure created successfully!"
