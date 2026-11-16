-- COCHASABOR: esquema MariaDB y datos mínimos de demostración.
-- Importar una sola vez desde phpMyAdmin (XAMPP).

-- COCHASABOR - esquema inicial para MariaDB 10.11+ (InnoDB, utf8mb4).
-- Las cuentas se anonimizan para conservar las relaciones e historial.
CREATE DATABASE IF NOT EXISTS cochasabor CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cochasabor;

CREATE TABLE users (
  user_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  anonymized_at DATETIME(6) NULL,
  CONSTRAINT users_display_name_nonempty CHECK (CHAR_LENGTH(TRIM(display_name)) > 0),
  CONSTRAINT users_email_normalized CHECK (email IS NULL OR BINARY email = BINARY LOWER(TRIM(email)))
) ENGINE=InnoDB;

CREATE TABLE user_sessions (
  session_id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  last_seen_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  revoked_at DATETIME(6) NULL,
  KEY user_sessions_user_expiry_idx (user_id, expires_at),
  CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE roles (
  role_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(60) NOT NULL UNIQUE,
  description VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE user_role_assignments (
  user_id BIGINT UNSIGNED NOT NULL,
  role_id BIGINT UNSIGNED NOT NULL,
  granted_by_user_id BIGINT UNSIGNED NULL,
  granted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, role_id),
  KEY user_role_assignments_role_idx (role_id, user_id),
  KEY user_role_assignments_granted_by_idx (granted_by_user_id),
  CONSTRAINT ura_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT ura_role_fk FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT,
  CONSTRAINT ura_granted_by_fk FOREIGN KEY (granted_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE places (
  place_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  zone VARCHAR(120) NOT NULL,
  latitude DECIMAL(9,6) NULL,
  longitude DECIMAL(9,6) NULL,
  address VARCHAR(500) NULL,
  price_estimate VARCHAR(120) NULL,
  visibility_status VARCHAR(30) NOT NULL DEFAULT 'PUBLISHED',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  created_by_user_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  CONSTRAINT places_name_nonempty CHECK (CHAR_LENGTH(TRIM(name)) > 0),
  CONSTRAINT places_description_nonempty CHECK (CHAR_LENGTH(TRIM(description)) > 0),
  CONSTRAINT places_zone_nonempty CHECK (CHAR_LENGTH(TRIM(zone)) > 0),
  CONSTRAINT places_visibility_check CHECK (visibility_status IN ('PUBLISHED','TEMPORARILY_HIDDEN','REMOVED')),
  CONSTRAINT places_coordinates_pair CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CONSTRAINT places_demo_coordinates CHECK (is_demo OR (latitude IS NOT NULL AND longitude IS NOT NULL)),
  KEY places_visibility_zone_idx (visibility_status, zone),
  KEY places_creator_idx (created_by_user_id, created_at),
  CONSTRAINT places_creator_fk FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE categories (
  category_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE place_categories (
  place_id BIGINT UNSIGNED NOT NULL,
  category_id BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY (place_id, category_id),
  KEY place_categories_category_idx (category_id, place_id),
  CONSTRAINT pc_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
  CONSTRAINT pc_category_fk FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE category_suggestions (
  suggestion_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  proposed_by_user_id BIGINT UNSIGNED NOT NULL,
  proposed_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  reviewed_at DATETIME(6) NULL,
  CONSTRAINT cat_suggestion_name_nonempty CHECK (CHAR_LENGTH(TRIM(proposed_name)) > 0),
  CONSTRAINT cat_suggestion_status CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN')),
  CONSTRAINT cat_suggestion_review_state CHECK ((status IN ('PENDING','WITHDRAWN') AND reviewed_at IS NULL) OR (status IN ('ACCEPTED','REJECTED') AND reviewed_at IS NOT NULL)),
  KEY category_suggestions_status_created_idx (status, created_at),
  KEY category_suggestions_proposer_idx (proposed_by_user_id, created_at),
  KEY category_suggestions_reviewer_idx (reviewed_by_user_id),
  CONSTRAINT cat_suggestion_proposer_fk FOREIGN KEY (proposed_by_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT cat_suggestion_reviewer_fk FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE place_contacts (
  contact_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  contact_type VARCHAR(20) NOT NULL,
  value VARCHAR(500) NOT NULL,
  CONSTRAINT place_contact_type CHECK (contact_type IN ('PHONE','EMAIL','WEBSITE','SOCIAL')),
  CONSTRAINT place_contact_value CHECK (CHAR_LENGTH(TRIM(value)) > 0),
  UNIQUE KEY place_contact_unique (place_id, contact_type, value),
  CONSTRAINT place_contacts_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE place_opening_hours (
  opening_hour_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  weekday TINYINT UNSIGNED NOT NULL,
  opens_at TIME NULL,
  closes_at TIME NULL,
  closes_next_day BOOLEAN NOT NULL DEFAULT FALSE,
  is_closed BOOLEAN NOT NULL DEFAULT FALSE,
  CONSTRAINT opening_weekday_check CHECK (weekday BETWEEN 1 AND 7),
  CONSTRAINT opening_interval_check CHECK (
    (is_closed AND opens_at IS NULL AND closes_at IS NULL AND NOT closes_next_day) OR
    (NOT is_closed AND opens_at IS NOT NULL AND closes_at IS NOT NULL AND
      ((NOT closes_next_day AND opens_at < closes_at) OR (closes_next_day AND closes_at < opens_at)))
  ),
  KEY place_opening_hours_lookup_idx (place_id, weekday),
  CONSTRAINT opening_hours_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE reviews (
  review_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  visibility_status VARCHAR(12) NOT NULL DEFAULT 'VISIBLE',
  version_number INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  hidden_at DATETIME(6) NULL,
  UNIQUE KEY reviews_one_per_user_place (user_id, place_id),
  KEY reviews_place_visible_created_idx (place_id, visibility_status, created_at),
  KEY reviews_user_created_idx (user_id, created_at),
  CONSTRAINT reviews_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_comment_check CHECK (CHAR_LENGTH(TRIM(comment)) BETWEEN 10 AND 1000),
  CONSTRAINT reviews_visibility_check CHECK (visibility_status IN ('VISIBLE','HIDDEN')),
  CONSTRAINT reviews_version_check CHECK (version_number > 0),
  CONSTRAINT reviews_hidden_state CHECK ((visibility_status = 'VISIBLE' AND hidden_at IS NULL) OR (visibility_status = 'HIDDEN' AND hidden_at IS NOT NULL)),
  CONSTRAINT reviews_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE RESTRICT,
  CONSTRAINT reviews_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE review_history (
  review_history_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT UNSIGNED NOT NULL,
  version_number INT UNSIGNED NOT NULL,
  change_type VARCHAR(12) NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NOT NULL,
  visibility_status VARCHAR(12) NOT NULL,
  changed_by_user_id BIGINT UNSIGNED NULL,
  changed_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY review_history_version_unique (review_id, version_number),
  KEY review_history_actor_idx (changed_by_user_id),
  CONSTRAINT review_history_change_check CHECK (change_type IN ('EDITED','HIDDEN','RESTORED','UPDATED')),
  CONSTRAINT review_history_rating_check CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT review_history_comment_check CHECK (CHAR_LENGTH(TRIM(comment)) BETWEEN 10 AND 1000),
  CONSTRAINT review_history_visibility_check CHECK (visibility_status IN ('VISIBLE','HIDDEN')),
  CONSTRAINT review_history_review_fk FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE RESTRICT,
  CONSTRAINT review_history_actor_fk FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE media (
  media_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NULL,
  review_id BIGINT UNSIGNED NULL UNIQUE,
  media_type VARCHAR(10) NOT NULL,
  storage_key VARCHAR(500) NOT NULL UNIQUE,
  alt_text VARCHAR(500) NOT NULL,
  position INT UNSIGNED NOT NULL DEFAULT 0,
  is_cover BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  cover_place_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN is_cover THEN place_id ELSE NULL END) STORED,
  UNIQUE KEY media_one_cover_per_place_idx (cover_place_id),
  KEY media_place_gallery_idx (place_id, position, media_id),
  CONSTRAINT media_type_check CHECK (media_type IN ('IMAGE','VIDEO')),
  CONSTRAINT media_storage_key_check CHECK (CHAR_LENGTH(TRIM(storage_key)) > 0),
  CONSTRAINT media_alt_text_check CHECK (CHAR_LENGTH(TRIM(alt_text)) > 0),
  CONSTRAINT media_owner_check CHECK ((place_id IS NOT NULL) <> (review_id IS NOT NULL)),
  CONSTRAINT media_review_image_check CHECK (review_id IS NULL OR media_type = 'IMAGE'),
  CONSTRAINT media_cover_check CHECK (NOT is_cover OR (place_id IS NOT NULL AND media_type = 'IMAGE')),
  CONSTRAINT media_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE,
  CONSTRAINT media_review_fk FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  place_id BIGINT UNSIGNED NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (user_id, place_id),
  KEY favorites_place_idx (place_id, user_id),
  CONSTRAINT favorites_user_fk FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT favorites_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE report_reasons (
  reason_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(80) NOT NULL UNIQUE,
  label VARCHAR(180) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE report_reason_targets (
  reason_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(10) NOT NULL,
  PRIMARY KEY (reason_id, target_type),
  CONSTRAINT report_target_type_check CHECK (target_type IN ('PLACE','REVIEW')),
  CONSTRAINT report_targets_reason_fk FOREIGN KEY (reason_id) REFERENCES report_reasons(reason_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE place_moderation_cases (
  case_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  opened_by_user_id BIGINT UNSIGNED NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  trigger_type VARCHAR(24) NOT NULL,
  threshold_used INT UNSIGNED NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  decision VARCHAR(20) NULL,
  opened_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at DATETIME(6) NULL,
  open_place_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'OPEN' THEN place_id ELSE NULL END) STORED,
  UNIQUE KEY place_moderation_one_open_case_idx (open_place_id),
  UNIQUE KEY place_moderation_case_place_unique (case_id, place_id),
  KEY place_moderation_history_idx (place_id, opened_at),
  KEY place_moderation_opened_by_idx (opened_by_user_id),
  KEY place_moderation_resolved_by_idx (resolved_by_user_id),
  CONSTRAINT place_case_trigger_check CHECK (trigger_type IN ('REPORT_THRESHOLD','TRUSTED_USER','TEAM_REVIEW')),
  CONSTRAINT place_case_status_check CHECK (status IN ('OPEN','RESOLVED')),
  CONSTRAINT place_case_decision_check CHECK (decision IS NULL OR decision IN ('RESTORE','KEEP_HIDDEN')),
  CONSTRAINT place_case_state_check CHECK ((status = 'OPEN' AND resolved_at IS NULL AND decision IS NULL) OR (status = 'RESOLVED' AND resolved_at IS NOT NULL AND decision IS NOT NULL)),
  CONSTRAINT place_case_threshold_check CHECK ((trigger_type = 'REPORT_THRESHOLD' AND threshold_used IS NOT NULL AND threshold_used > 0) OR (trigger_type <> 'REPORT_THRESHOLD' AND threshold_used IS NULL)),
  CONSTRAINT place_case_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE RESTRICT,
  CONSTRAINT place_case_opened_by_fk FOREIGN KEY (opened_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT place_case_resolved_by_fk FOREIGN KEY (resolved_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE place_reports (
  report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  reason_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(10) NOT NULL DEFAULT 'PLACE',
  moderation_case_id BIGINT UNSIGNED NULL,
  details TEXT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  closed_at DATETIME(6) NULL,
  active_place_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN place_id ELSE NULL END) STORED,
  UNIQUE KEY place_reports_one_pending_per_user_idx (reporter_user_id, active_place_id),
  KEY place_reports_pending_by_place_idx (place_id, status, created_at),
  KEY place_reports_case_idx (moderation_case_id),
  KEY place_reports_reason_idx (reason_id),
  CONSTRAINT place_report_target_check CHECK (target_type = 'PLACE'),
  CONSTRAINT place_report_status_check CHECK (status IN ('PENDING','WITHDRAWN','RESOLVED')),
  CONSTRAINT place_report_closed_check CHECK ((status = 'PENDING' AND closed_at IS NULL) OR (status <> 'PENDING' AND closed_at IS NOT NULL)),
  CONSTRAINT place_report_user_fk FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT place_report_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE RESTRICT,
  CONSTRAINT place_report_reason_target_fk FOREIGN KEY (reason_id, target_type) REFERENCES report_reason_targets(reason_id, target_type) ON DELETE RESTRICT,
  CONSTRAINT place_report_case_fk FOREIGN KEY (moderation_case_id, place_id) REFERENCES place_moderation_cases(case_id, place_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE review_moderation_cases (
  case_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'OPEN',
  ai_result VARCHAR(12) NULL,
  ai_model_version VARCHAR(100) NULL,
  policy_version VARCHAR(100) NULL,
  ai_evaluated_at DATETIME(6) NULL,
  resolved_by_user_id BIGINT UNSIGNED NULL,
  team_decision VARCHAR(255) NULL,
  opened_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at DATETIME(6) NULL,
  open_review_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'OPEN' THEN review_id ELSE NULL END) STORED,
  UNIQUE KEY review_moderation_one_open_case_idx (open_review_id),
  UNIQUE KEY review_moderation_case_review_unique (case_id, review_id),
  KEY review_moderation_history_idx (review_id, opened_at),
  KEY review_moderation_resolver_idx (resolved_by_user_id),
  CONSTRAINT review_case_status_check CHECK (status IN ('OPEN','RESOLVED')),
  CONSTRAINT review_case_ai_result_check CHECK (ai_result IS NULL OR ai_result IN ('CLEAR','VIOLATION','UNCERTAIN','ERROR')),
  CONSTRAINT review_case_state_check CHECK ((status = 'OPEN' AND resolved_at IS NULL) OR (status = 'RESOLVED' AND resolved_at IS NOT NULL)),
  CONSTRAINT review_case_review_fk FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE RESTRICT,
  CONSTRAINT review_case_resolver_fk FOREIGN KEY (resolved_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE review_reports (
  report_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  review_id BIGINT UNSIGNED NOT NULL,
  reporter_user_id BIGINT UNSIGNED NOT NULL,
  reason_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(10) NOT NULL DEFAULT 'REVIEW',
  moderation_case_id BIGINT UNSIGNED NULL,
  details TEXT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  closed_at DATETIME(6) NULL,
  active_review_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN review_id ELSE NULL END) STORED,
  UNIQUE KEY review_reports_one_pending_per_user_idx (reporter_user_id, active_review_id),
  KEY review_reports_pending_by_review_idx (review_id, status, created_at),
  KEY review_reports_case_idx (moderation_case_id),
  KEY review_reports_reason_idx (reason_id),
  CONSTRAINT review_report_target_check CHECK (target_type = 'REVIEW'),
  CONSTRAINT review_report_status_check CHECK (status IN ('PENDING','WITHDRAWN','RESOLVED')),
  CONSTRAINT review_report_closed_check CHECK ((status = 'PENDING' AND closed_at IS NULL) OR (status <> 'PENDING' AND closed_at IS NOT NULL)),
  CONSTRAINT review_report_user_fk FOREIGN KEY (reporter_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT review_report_review_fk FOREIGN KEY (review_id) REFERENCES reviews(review_id) ON DELETE RESTRICT,
  CONSTRAINT review_report_reason_target_fk FOREIGN KEY (reason_id, target_type) REFERENCES report_reason_targets(reason_id, target_type) ON DELETE RESTRICT,
  CONSTRAINT review_report_case_fk FOREIGN KEY (moderation_case_id, review_id) REFERENCES review_moderation_cases(case_id, review_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE review_appeals (
  appeal_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  moderation_case_id BIGINT UNSIGNED NOT NULL,
  appellant_user_id BIGINT UNSIGNED NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
  resolved_by_user_id BIGINT UNSIGNED NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  resolved_at DATETIME(6) NULL,
  KEY review_appeals_case_created_idx (moderation_case_id, created_at),
  KEY review_appeals_appellant_idx (appellant_user_id, created_at),
  CONSTRAINT appeal_reason_nonempty CHECK (CHAR_LENGTH(TRIM(reason)) > 0),
  CONSTRAINT appeal_status_check CHECK (status IN ('PENDING','ACCEPTED','REJECTED','WITHDRAWN')),
  CONSTRAINT appeal_state_check CHECK ((status IN ('PENDING','WITHDRAWN') AND resolved_at IS NULL) OR (status IN ('ACCEPTED','REJECTED') AND resolved_at IS NOT NULL)),
  CONSTRAINT appeal_case_fk FOREIGN KEY (moderation_case_id) REFERENCES review_moderation_cases(case_id) ON DELETE RESTRICT,
  CONSTRAINT appeal_appellant_fk FOREIGN KEY (appellant_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT appeal_resolver_fk FOREIGN KEY (resolved_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE owner_claims (
  claim_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  place_id BIGINT UNSIGNED NOT NULL,
  claimant_user_id BIGINT UNSIGNED NOT NULL,
  status VARCHAR(12) NOT NULL DEFAULT 'PENDING',
  evidence_reference VARCHAR(500) NULL,
  reviewed_by_user_id BIGINT UNSIGNED NULL,
  submitted_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  reviewed_at DATETIME(6) NULL,
  pending_place_id BIGINT UNSIGNED GENERATED ALWAYS AS (CASE WHEN status = 'PENDING' THEN place_id ELSE NULL END) STORED,
  UNIQUE KEY owner_claims_one_pending_per_user_place_idx (claimant_user_id, pending_place_id),
  KEY owner_claims_pending_idx (status, submitted_at),
  KEY owner_claims_place_history_idx (place_id, submitted_at),
  CONSTRAINT owner_claim_status_check CHECK (status IN ('PENDING','APPROVED','REJECTED','WITHDRAWN')),
  CONSTRAINT owner_claim_state_check CHECK ((status IN ('PENDING','WITHDRAWN') AND reviewed_at IS NULL) OR (status IN ('APPROVED','REJECTED') AND reviewed_at IS NOT NULL)),
  CONSTRAINT owner_claim_place_fk FOREIGN KEY (place_id) REFERENCES places(place_id) ON DELETE RESTRICT,
  CONSTRAINT owner_claim_claimant_fk FOREIGN KEY (claimant_user_id) REFERENCES users(user_id) ON DELETE RESTRICT,
  CONSTRAINT owner_claim_reviewer_fk FOREIGN KEY (reviewed_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
) ENGINE=InnoDB;

DELIMITER $$
CREATE TRIGGER reviews_archive_before_update
BEFORE UPDATE ON reviews
FOR EACH ROW
BEGIN
  DECLARE actor_id BIGINT UNSIGNED DEFAULT NULL;
  DECLARE change_kind VARCHAR(12);
  IF NOT (OLD.rating <=> NEW.rating) OR NOT (OLD.comment <=> NEW.comment) OR NOT (OLD.visibility_status <=> NEW.visibility_status) THEN
    SET actor_id = NULLIF(@cochasabor_user_id, '');
    IF OLD.visibility_status = 'VISIBLE' AND NEW.visibility_status = 'HIDDEN' THEN
      SET change_kind = 'HIDDEN';
    ELSEIF OLD.visibility_status = 'HIDDEN' AND NEW.visibility_status = 'VISIBLE' THEN
      SET change_kind = 'RESTORED';
    ELSEIF NOT (OLD.rating <=> NEW.rating) AND NOT (OLD.comment <=> NEW.comment) THEN
      SET change_kind = 'UPDATED';
    ELSE
      SET change_kind = 'EDITED';
    END IF;
    INSERT INTO review_history (review_id, version_number, change_type, rating, comment, visibility_status, changed_by_user_id, changed_at)
    VALUES (OLD.review_id, OLD.version_number, change_kind, OLD.rating, OLD.comment, OLD.visibility_status, actor_id, CURRENT_TIMESTAMP(6));
    SET NEW.version_number = OLD.version_number + 1;
    SET NEW.updated_at = CURRENT_TIMESTAMP(6);
    IF NEW.visibility_status = 'HIDDEN' THEN
      SET NEW.hidden_at = COALESCE(NEW.hidden_at, CURRENT_TIMESTAMP(6));
    ELSE
      SET NEW.hidden_at = NULL;
    END IF;
  END IF;
END$$

CREATE TRIGGER place_case_close_reports
AFTER UPDATE ON place_moderation_cases
FOR EACH ROW
BEGIN
  IF OLD.status = 'OPEN' AND NEW.status = 'RESOLVED' THEN
    UPDATE place_reports SET status = 'RESOLVED', closed_at = NEW.resolved_at
    WHERE moderation_case_id = NEW.case_id AND status = 'PENDING';
  END IF;
END$$

CREATE TRIGGER review_case_close_reports
AFTER UPDATE ON review_moderation_cases
FOR EACH ROW
BEGIN
  IF OLD.status = 'OPEN' AND NEW.status = 'RESOLVED' THEN
    UPDATE review_reports SET status = 'RESOLVED', closed_at = NEW.resolved_at
    WHERE moderation_case_id = NEW.case_id AND status = 'PENDING';
  END IF;
END$$
DELIMITER ;


-- Datos de referencia y demostración
USE cochasabor;

INSERT INTO categories (slug, name) VALUES
  ('restaurantes', 'Restaurantes'), ('cafes', 'Cafés'),
  ('miradores', 'Miradores'), ('atractivos', 'Atractivos turísticos')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO roles (code, description) VALUES
  ('MEMBER', 'Cuenta común de COCHASABOR'),
  ('TRUSTED_REPORTER', 'Puede iniciar una ocultación temporal de un lugar'),
  ('MODERATOR', 'Puede revisar reportes, apelaciones y reclamos'),
  ('ADMIN', 'Administra cuentas, categorías y configuración')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO users (email, display_name) VALUES
  ('curator@demo.invalid', 'Equipo de demostración'),
  ('visitante-01@demo.invalid', 'Visitante demo 01'), ('visitante-02@demo.invalid', 'Visitante demo 02'),
  ('visitante-03@demo.invalid', 'Visitante demo 03'), ('visitante-04@demo.invalid', 'Visitante demo 04'),
  ('visitante-05@demo.invalid', 'Visitante demo 05'), ('visitante-06@demo.invalid', 'Visitante demo 06'),
  ('visitante-07@demo.invalid', 'Visitante demo 07'), ('visitante-08@demo.invalid', 'Visitante demo 08')
ON DUPLICATE KEY UPDATE display_name = VALUES(display_name);

INSERT IGNORE INTO user_role_assignments (user_id, role_id)
SELECT u.user_id, r.role_id FROM users u CROSS JOIN roles r
WHERE r.code = 'MEMBER' AND (u.email LIKE 'visitante-%@demo.invalid' OR u.email = 'curator@demo.invalid');

INSERT INTO places (slug, name, description, zone, address, price_estimate, visibility_status, is_demo, created_by_user_id)
SELECT d.slug, d.name, d.description, d.zone, d.address, d.price_estimate, 'PUBLISHED', TRUE, u.user_id
FROM (
  SELECT 'la-casa-del-pique' slug, 'La Casa del Pique' name, 'Tradición cochala, porciones para compartir y sabor de casa.' description, 'Zona Norte' zone, 'Avenida América, zona norte (dirección de ejemplo)' address, 'Bs 35–70' price_estimate
  UNION ALL SELECT 'cafe-del-patio', 'Café del Patio', 'Café, un patio tranquilo y tiempo para disfrutar la pausa.', 'Centro', 'Calle España, centro (dirección de ejemplo)', 'Bs 15–35'
  UNION ALL SELECT 'mirador-del-valle', 'Mirador del Valle', 'Una nueva perspectiva, aire libre y una tarde sin apuro.', 'Zona Este', 'Camino de las colinas (ubicación de ejemplo)', 'Gratuito (demo)'
  UNION ALL SELECT 'el-fogon-de-la-llajta', 'El Fogón de la Llajta', 'Cocina de la tierra y una mesa que siempre invita a compartir.', 'Queru Queru', 'Zona Queru Queru (dirección de ejemplo)', 'Bs 40–85'
  UNION ALL SELECT 'pan-y-cafe', 'Pan y Café', 'Pan artesanal, algo dulce y el aroma de un buen comienzo.', 'Zona Norte', 'Avenida Melchor Pérez (dirección de ejemplo)', 'Bs 12–30'
  UNION ALL SELECT 'sendero-de-las-colinas', 'Sendero de las Colinas', 'Un paseo de ejemplo para quienes buscan mirar más lejos.', 'Tiquipaya', 'Entorno de Tiquipaya (ubicación de ejemplo)', 'Gratuito (demo)'
  UNION ALL SELECT 'jardin-de-la-llajta', 'Jardín de la Llajta', 'Verde, calma y pequeños rincones para disfrutar la tarde.', 'Centro', 'Zona central (ubicación de ejemplo)', 'Bs 10 (demo)'
  UNION ALL SELECT 'patio-de-los-artesanos', 'Patio de los Artesanos', 'Un encuentro de historias, oficios y una buena taza de café.', 'Cala Cala', 'Zona Cala Cala (dirección de ejemplo)', 'Entrada libre (demo)'
) d JOIN users u ON u.email = 'curator@demo.invalid'
ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), zone = VALUES(zone), address = VALUES(address), price_estimate = VALUES(price_estimate), is_demo = TRUE;

INSERT IGNORE INTO place_categories (place_id, category_id)
SELECT p.place_id, c.category_id FROM (
  SELECT 'la-casa-del-pique' place_slug, 'restaurantes' category_slug
  UNION ALL SELECT 'cafe-del-patio', 'cafes' UNION ALL SELECT 'cafe-del-patio', 'restaurantes'
  UNION ALL SELECT 'mirador-del-valle', 'miradores' UNION ALL SELECT 'mirador-del-valle', 'atractivos'
  UNION ALL SELECT 'el-fogon-de-la-llajta', 'restaurantes' UNION ALL SELECT 'pan-y-cafe', 'cafes'
  UNION ALL SELECT 'sendero-de-las-colinas', 'miradores' UNION ALL SELECT 'jardin-de-la-llajta', 'atractivos'
  UNION ALL SELECT 'patio-de-los-artesanos', 'atractivos' UNION ALL SELECT 'patio-de-los-artesanos', 'cafes'
) m JOIN places p ON p.slug = m.place_slug JOIN categories c ON c.slug = m.category_slug;

INSERT IGNORE INTO reviews (place_id, user_id, rating, comment, created_at)
SELECT p.place_id, u.user_id, d.rating, d.comment, d.created_at
FROM (
  SELECT 'la-casa-del-pique' place_slug, 'visitante-01@demo.invalid' user_email, 5 rating, 'Una experiencia de ejemplo: nos gustó poder compartir los platos y conversar con calma. Una buena idea para un almuerzo entre amigos.' comment, '2026-10-10 16:00:00' created_at
  UNION ALL SELECT 'la-casa-del-pique','visitante-02@demo.invalid',4,'Reseña ficticia para probar el directorio. El ambiente se presta para compartir y la propuesta de cocina tradicional es interesante.','2026-10-09 18:00:00'
  UNION ALL SELECT 'cafe-del-patio','visitante-03@demo.invalid',5,'Un café de demostración para imaginar una tarde tranquila. Me gustó la combinación de panadería y un patio para leer.','2026-10-08 16:00:00'
  UNION ALL SELECT 'cafe-del-patio','visitante-04@demo.invalid',4,'Opinión ficticia: un buen plan de ejemplo para hacer una pausa y tomar algo caliente después de recorrer el centro.','2026-10-07 16:00:00'
  UNION ALL SELECT 'mirador-del-valle','visitante-05@demo.invalid',5,'Comentario de demostración. La idea de un mirador permite imaginar una salida sencilla para disfrutar el paisaje y el aire libre.','2026-10-06 16:00:00'
  UNION ALL SELECT 'el-fogon-de-la-llajta','visitante-06@demo.invalid',4,'Reseña simulada de una comida en grupo. La ficha muestra la información necesaria para comparar opciones del catálogo.','2026-10-05 16:00:00'
  UNION ALL SELECT 'pan-y-cafe','visitante-07@demo.invalid',5,'Una opinión ficticia para acompañar esta ficha. Un desayuno con pan y café parece una buena manera de empezar el día.','2026-10-04 16:00:00'
  UNION ALL SELECT 'jardin-de-la-llajta','visitante-08@demo.invalid',4,'Una visita ficticia a un jardín de ejemplo. La propuesta invita a caminar, conversar y encontrar una pausa en la ciudad.','2026-10-03 16:00:00'
) d JOIN places p ON p.slug = d.place_slug JOIN users u ON u.email = d.user_email;

INSERT INTO report_reasons (code, label) VALUES
  ('INCORRECT_PLACE_INFO','Información del lugar incorrecta'), ('DUPLICATE_PLACE','Lugar duplicado'),
  ('PLACE_CLOSED','El lugar ya no existe o está cerrado'), ('WRONG_LOCATION','Ubicación incorrecta'),
  ('REVIEW_HARASSMENT','Insultos o acoso en la reseña'), ('REVIEW_PERSONAL_DATA','Datos personales en la reseña'),
  ('REVIEW_UNRELATED','La reseña no corresponde al lugar'), ('SPAM','Contenido no deseado o repetitivo'),
  ('INAPPROPRIATE_CONTENT','Contenido inapropiado')
ON DUPLICATE KEY UPDATE label = VALUES(label);

INSERT IGNORE INTO report_reason_targets (reason_id, target_type)
SELECT r.reason_id, a.target_type FROM (
  SELECT 'INCORRECT_PLACE_INFO' code, 'PLACE' target_type UNION ALL SELECT 'DUPLICATE_PLACE','PLACE'
  UNION ALL SELECT 'PLACE_CLOSED','PLACE' UNION ALL SELECT 'WRONG_LOCATION','PLACE'
  UNION ALL SELECT 'REVIEW_HARASSMENT','REVIEW' UNION ALL SELECT 'REVIEW_PERSONAL_DATA','REVIEW'
  UNION ALL SELECT 'REVIEW_UNRELATED','REVIEW' UNION ALL SELECT 'SPAM','PLACE'
  UNION ALL SELECT 'SPAM','REVIEW' UNION ALL SELECT 'INAPPROPRIATE_CONTENT','PLACE'
  UNION ALL SELECT 'INAPPROPRIATE_CONTENT','REVIEW'
) a JOIN report_reasons r ON r.code = a.code;
