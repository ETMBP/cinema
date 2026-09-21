CREATE TABLE IF NOT EXISTS `users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(25) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created` datetime NOT NULL DEFAULT current_timestamp(),
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `uq_users_username` (`username`) USING BTREE,
  UNIQUE KEY `uq_users_email` (`email`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `roles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_roles_name` (`name`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT IGNORE INTO roles (name) VALUES ('admin'),('director'),('editor'),('user');

CREATE TABLE IF NOT EXISTS `role_assignments` (
  `role_id` int(10) unsigned NOT NULL DEFAULT 0,
  `user_id` int(10) unsigned NOT NULL DEFAULT 0,
  `timestamp` datetime NOT NULL DEFAULT current_timestamp(),
  KEY `role_id` (`role_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `fk_roles_ra_id` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_usesrs_ra_id` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `movies` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `year` int(10) unsigned NOT NULL DEFAULT 1990,
  `is_watched` tinyint(1) NOT NULL DEFAULT 0,
  `is_downloaded` tinyint(1) NOT NULL DEFAULT 0,
  `imdb_url` varchar(255) DEFAULT NULL,
  `added_by` int(10) unsigned DEFAULT NULL,
  `added_when` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_users_id` (`added_by`),
  CONSTRAINT `fk_users_id` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
