const reviewService = require('../services/reviewService');
const targetService = require('../services/targetService');

const reviewController = {
  // Check if a user has reviewed a target
  checkReview: async (req, res) => {
    const { userId, targetId } = req.params;

    try {
      const hasReviewed = await reviewService.hasUserReviewed(userId, targetId);
      res.json({ hasReviewed });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  // Add a review
  addReview: async (req, res) => {
    const { user_phone, target_google_loc, target_phone, target_instagram, rating } = req.body;
    let userId = await targetService.getOrCreateUserId({ phone: user_phone });
    const targetId = await targetService.getOrCreateTargetId({
      google_loc: target_google_loc,
      phone: target_phone,
      instagram: target_instagram,
    });
    try {
      const review = await reviewService.addReview(userId, targetId, rating);
      if (review) {
        res.status(201).json({ review });
      } else {
        res.status(400).json({ error: 'User has already reviewed this target' });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  getMetrics: async (req, res) => {
    const { google_loc, phone, instagram } = req.query;
    if(!google_loc && !phone && !instagram) res.status(400).json({ error: 'sem identificador: google_loc, phone, instagram' });
    const targetId = await targetService.getOrCreateTargetId({
      google_loc,
      phone,
      instagram,
    });

    try {
      const metrics = await reviewService.getMetrics(targetId);
      res.json(metrics);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

};

module.exports = reviewController;