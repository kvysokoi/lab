CREATE TABLE IF NOT EXISTS incidents (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 date TEXT,
 tag TEXT,
 severity TEXT,
 comments TEXT,
 reporter TEXT
);