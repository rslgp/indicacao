const db = require('../config/db');

const getOrCreateElem = async ({ findQuery, insertQuery, args }) => {
  try {
    // Try to find an existing target
    const existingElem = await db.oneOrNone(findQuery, args);

    if (existingElem) {
      return existingElem.id; // Return the existing target_id
    }

    // If no target is found, create a new one
    const newElem = await db.one(insertQuery, args);
    return newElem.id; // Return the new target_id
  } catch (err) {
    console.error('Error finding or creating target:', err);
    throw err;
  }
}
const targetService = {

  // Get or create target_id by google_loc, phone, or instagram
  getOrCreateTargetId: async ({ google_loc, phone, instagram }) => {
    const findQuery = `
      SELECT id
      FROM target
      WHERE
        google_loc = $1 OR
        phone = $2 OR
        instagram = $3
      LIMIT 1;
    `;

    const insertQuery = `
      INSERT INTO target (google_loc, phone, instagram)
      VALUES ($1, $2, $3)
      RETURNING id;
    `;

    return getOrCreateElem({ findQuery, insertQuery, args: [google_loc, phone, instagram] });
  },

  getOrCreateUserId: async ({ phone }) => {
    const findQuery = `
      SELECT id
      FROM users
      WHERE
        phone = $1
      LIMIT 1;
    `;

    const insertQuery = `
      INSERT INTO users (phone)
      VALUES ($1)
      RETURNING id;
    `;


    return getOrCreateElem({ findQuery, insertQuery, args: [phone] });
  },
};

module.exports = targetService;