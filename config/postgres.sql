CREATE TABLE users (
   id SERIAL PRIMARY KEY,
   phone TEXT UNIQUE NOT NULL -- Ensure phone number is unique
);
CREATE TABLE target (
   id SERIAL PRIMARY KEY,
   google_loc TEXT,
   phone TEXT,
   instagram TEXT,  -- Ensure instagram_handle is unique
    
   rating_avg FLOAT DEFAULT 3,  -- Stores the precomputed average rating
   rating_count INT DEFAULT 1,  -- Number of ratings received
   rating_sum INT DEFAULT 3,  -- Number of sum of ratings received
   
   CONSTRAINT unique_target UNIQUE (google_loc, phone, instagram)
);

-- Create a unique index to handle NULLs as empty strings
CREATE UNIQUE INDEX unique_target_idx ON target (
   COALESCE(google_loc, ''),
   COALESCE(phone, ''),
   COALESCE(instagram, '')
);

CREATE TABLE reviews (
   id SERIAL PRIMARY KEY,
   user_id INT NOT NULL,
   target_id INT NOT NULL,
   passou_perna BOOL,
   rating INT CHECK (rating BETWEEN 1 AND 5),
   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
   UNIQUE (user_id, target_id),  -- Ensures one review per user per place
   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
   FOREIGN KEY (target_id) REFERENCES target(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX idx_target_avg_rating ON target(rating_avg DESC);
CREATE INDEX idx_target_count_rating ON target(rating_count DESC);

CREATE INDEX idx_reviews_user_target ON reviews(user_id, target_id);
CREATE INDEX idx_reviews_target ON reviews(target_id);

CREATE INDEX idx_target_google_loc ON target(google_loc);
CREATE INDEX idx_target_phone ON target(phone);
CREATE INDEX idx_target_instagram ON target(instagram);

CREATE UNIQUE INDEX idx_users_phone ON users(phone);

-- monitor index usage and identify unused indexes
-- SELECT
--     indexname,
--     tablename,
--     idx_scan AS index_scans,
--     idx_tup_read AS tuples_read,
--     idx_tup_fetch AS tuples_fetched
-- FROM
--     pg_stat_user_indexes;

--TRIGGERS fetch avg_rating O(1) instead O(N)
CREATE OR REPLACE FUNCTION update_target_rating() RETURNS TRIGGER AS $$
BEGIN
   IF TG_OP = 'INSERT' THEN
      -- Adjust rating_sum and rating_count for new reviews
      UPDATE target
      SET rating_sum = rating_sum + NEW.rating,
          rating_count = rating_count + 1,
          rating_avg = rating_sum * 1.0 / rating_count
      WHERE id = NEW.target_id;

   ELSIF TG_OP = 'UPDATE' THEN
      -- Adjust rating_sum and rating_count for updated reviews
      UPDATE target
      SET rating_sum = rating_sum - OLD.rating + NEW.rating,
          rating_avg = rating_sum * 1.0 / rating_count
      WHERE id = NEW.target_id;

   ELSIF TG_OP = 'DELETE' THEN
      -- Adjust rating_sum and rating_count for deleted reviews
      UPDATE target
      SET rating_sum = rating_sum - OLD.rating,
          rating_count = rating_count - 1,
          rating_avg = rating_sum * 1.0 / rating_count
      WHERE id = OLD.target_id;
   END IF;

   RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger for INSERT and UPDATE on reviews
CREATE TRIGGER trg_update_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_target_rating();
