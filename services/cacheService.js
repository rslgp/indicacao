const client = require('../config/redis');

const KEYS = Object.freeze({
  user_review:'user_review',
  target_metrics:'target_metrics',
  target_alias:'target_alias',
});

const cacheService = {
  KEYS,
  // Check if a user has reviewed a target
  hasUserReviewed: async (userId, targetId) => {
    const cacheKey = `${KEYS.user_review}:${userId}:${targetId}`;
    const cachedResult = await client.get(cacheKey);
    return cachedResult !== null; // Returns true if cached
  },

  // Cache a user's review for a target
  cacheUserReview: async (userId, targetId) => {
    const cacheKey = `${KEYS.user_review}:${userId}:${targetId}`;
    await client.set(cacheKey, 'true', 'EX', 86400); // Cache for 24 hours
  },

  // Get cached value
  get: async (key) => {
    return await client.get(key);
  },

  // Set cached value with TTL
  set: async (key, value, mode, duration) => {
    await client.set(key, value, mode, duration);
  },

  // Invalidate cached value
  del: async (key) => {
    return await client.del(key);
  },
};

module.exports = cacheService;