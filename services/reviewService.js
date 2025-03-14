const db = require('../config/db');
const cacheService = require('./cacheService');

const reviewService = {
  // Check if a user has reviewed a target
  hasUserReviewed: async (userId, targetId) => {
    // Check cache first
    const hasReviewed = await cacheService.hasUserReviewed(userId, targetId);
    console.log(hasReviewed);
    if (hasReviewed) return true;

    // If not in cache, check database
    const query = 'SELECT EXISTS (SELECT 1 FROM reviews WHERE user_id = $1 AND target_id = $2)';
    const exists = await db.one(query, [userId, targetId], (row) => row.exists);

    // Cache the result
    if (exists) {
      await cacheService.cacheUserReview(userId, targetId);
    }

    return exists;
  },

  // Add a review
  addReview: async (userId, targetId, rating) => {
    const query = `
      INSERT INTO reviews (user_id, target_id, rating)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, target_id) DO NOTHING
      RETURNING *;
    `;
    const review = await db.oneOrNone(query, [userId, targetId, rating]);

    // Cache the review if successful
    if (review) {
      await cacheService.cacheUserReview(userId, targetId);
      await cacheService.del(`${cacheService.KEYS.target_metrics}:${targetId}`);

    }

    return review;
  },

  getMetrics: async (targetId) => {
    const cacheKey = `${cacheService.KEYS.target_metrics}:${targetId}`;

    // Check cache first
    const cachedMetrics = await cacheService.get(cacheKey);
    if (cachedMetrics) {
      return JSON.parse(cachedMetrics);
    }

    // If not in cache, compute metrics
//     const query = `
//       WITH review_counts AS (
//     SELECT
//         COUNT(*) AS total_count,
//         COUNT(*) FILTER (WHERE rating IN (4, 5)) AS count_endorsement,
//         COUNT(*) FILTER (WHERE passou_perna = TRUE OR rating = 1) AS count_abuse,
//         COUNT(*) FILTER (WHERE rating = 2) AS count_not_recommend
//     FROM reviews
//     WHERE target_id = $1
// )
// SELECT
//     count_endorsement * 100.0 / total_count AS endorsement_percentage,
//     count_abuse * 100.0 / total_count AS abuse_percentage,
//     count_not_recommend * 100.0 / total_count AS not_recommend_percentage
// FROM review_counts;

//     `;
const query = `

SELECT
  rating_avg,
  rating_count  
FROM target
WHERE id = $1

`;
    const metrics = await db.one(query, [targetId]);

    // Cache the metrics for 5 minutes (300 seconds)
    await cacheService.set(cacheKey, JSON.stringify(metrics), 'EX', 300);

    return metrics;
  },

};

module.exports = reviewService;