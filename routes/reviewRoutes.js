const express = require('express');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Check if a user has reviewed a target
router.get('/check/:userId/:targetId', reviewController.checkReview);

// Add a review
router.post('/add', reviewController.addReview);

// Get metrics for a target
router.get('/metrics', reviewController.getMetrics);

module.exports = router;