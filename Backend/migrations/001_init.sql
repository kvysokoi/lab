CREATE TABLE users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 username TEXT NOT NULL UNIQUE
);

CREATE TABLE incidents (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 date TEXT NOT NULL,
 tag TEXT NOT NULL,
 severity TEXT CHECK(
  severity IN ('low','medium','high')
 ),
 reporter TEXT NOT NULL,
 user_id INTEGER,
 FOREIGN KEY(user_id) REFERENCES users(id)
);

CREATE TABLE comments (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 incident_id INTEGER,
 text TEXT NOT NULL,
 FOREIGN KEY(incident_id) REFERENCES incidents(id)
);

CREATE TABLE schema_migrations (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 filename TEXT NOT NULL
);